const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/draw/latest - Get the latest draw result
router.get('/latest', async (req, res) => {
  try {
    // For general public / subscribers, retrieve the latest PUBLISHED draw
    // For admin, retrieve the absolute latest draw (published or unpublished)
    let userRole = 'subscriber';
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_me_in_production');
        userRole = decoded.role;
      } catch (err) {
        // Token verification failed, treat as public
      }
    }

    const queryOptions = {
      orderBy: { createdAt: 'desc' },
      include: {
        winners: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    };

    if (userRole !== 'admin') {
      queryOptions.where = { published: true };
    }

    const latestDraw = await prisma.draw.findFirst(queryOptions);

    if (!latestDraw) {
      return res.status(404).json({ message: 'No draws have been run or published yet' });
    }

    res.json(latestDraw);
  } catch (error) {
    console.error('Error fetching latest draw:', error);
    res.status(500).json({ error: 'Failed to fetch latest draw' });
  }
});

// GET /api/draw/winnings - Get authenticated user's winnings history
router.get('/winnings', authenticateJWT, async (req, res) => {
  try {
    const winnings = await prisma.winner.findMany({
      where: { userId: req.user.id },
      include: {
        draw: true
      },
      orderBy: {
        draw: {
          createdAt: 'desc'
        }
      }
    });
    res.json(winnings);
  } catch (error) {
    console.error('Error fetching winnings:', error);
    res.status(500).json({ error: 'Failed to fetch winnings history' });
  }
});

// POST /api/draw/run - Run the draw for the specified month (Admin only)
router.post('/run', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { month } = req.body;

    // Default to current month in "YYYY-MM" format if not specified
    const targetMonth = month || new Date().toISOString().substring(0, 7);

    // Check if draw already exists for this month
    const existingDraw = await prisma.draw.findFirst({
      where: { month: targetMonth }
    });

    if (existingDraw) {
      return res.status(400).json({ error: `A draw has already been executed for the month: ${targetMonth}` });
    }

    // 1. Pick 5 random unique numbers between 1-45
    // 1. Pick 5 random unique numbers between 1-45
    let drawnNumbers;
    if (req.body.testNumbers && Array.isArray(req.body.testNumbers) && req.body.testNumbers.length === 5) {
      drawnNumbers = [...req.body.testNumbers].sort((a, b) => a - b);
    } else {
      drawnNumbers = [];
      while (drawnNumbers.length < 5) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!drawnNumbers.includes(num)) {
          drawnNumbers.push(num);
        }
      }
      drawnNumbers.sort((a, b) => a - b);
    }

    // 2. Fetch active subscribers
    const activeSubscribers = await prisma.user.findMany({
      where: { isSubscribed: true },
      include: { scores: true }
    });

    const activeSubscribersCount = activeSubscribers.length;

    // Total pool = active subscribers * 5
    const totalPool = activeSubscribersCount * 5;

    // 3. Find carry-over jackpot from previous draw
    let rolloverAmount = 0;
    const previousDraw = await prisma.draw.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (previousDraw && previousDraw.jackpotRolled) {
      rolloverAmount = previousDraw.jackpotPool;
    }

    // 4. Calculate pools
    // Tier 1 (Match 5) = 40%
    const jackpotPool = (totalPool * 0.40) + rolloverAmount;
    // Tier 2 (Match 4) = 35%
    const matchFour = totalPool * 0.35;
    // Tier 3 (Match 3) = 25%
    const matchThree = totalPool * 0.25;

    // 5. Evaluate matches
    const winners5 = [];
    const winners4 = [];
    const winners3 = [];

    activeSubscribers.forEach((user) => {
      // Get subscriber score values
      const userScoreValues = user.scores.map(s => s.value);

      // Calculate how many values match the drawn numbers
      const matches = userScoreValues.filter(v => drawnNumbers.includes(v));
      const matchCount = matches.length;

      if (matchCount === 5) {
        winners5.push(user.id);
      } else if (matchCount === 4) {
        winners4.push(user.id);
      } else if (matchCount === 3) {
        winners3.push(user.id);
      }
    });

    // 6. Split winnings
    let jackpotRolled = false;
    const winnerRecords = [];

    // Match 5 (Tier 1)
    if (winners5.length > 0) {
      const prizePerWinner = jackpotPool / winners5.length;
      winners5.forEach((userId) => {
        winnerRecords.push({
          userId,
          matchCount: 5,
          prizeAmount: prizePerWinner,
          status: 'pending'
        });
      });
    } else {
      // Rollover jackpot to next month
      jackpotRolled = true;
    }

    // Match 4 (Tier 2)
    if (winners4.length > 0) {
      const prizePerWinner = matchFour / winners4.length;
      winners4.forEach((userId) => {
        winnerRecords.push({
          userId,
          matchCount: 4,
          prizeAmount: prizePerWinner,
          status: 'pending'
        });
      });
    }

    // Match 3 (Tier 3)
    if (winners3.length > 0) {
      const prizePerWinner = matchThree / winners3.length;
      winners3.forEach((userId) => {
        winnerRecords.push({
          userId,
          matchCount: 3,
          prizeAmount: prizePerWinner,
          status: 'pending'
        });
      });
    }

    // 7. Write to database using a transaction
    const draw = await prisma.$transaction(async (tx) => {
      const newDraw = await tx.draw.create({
        data: {
          month: targetMonth,
          drawnNumbers,
          totalPool,
          jackpotPool,
          matchFour,
          matchThree,
          jackpotRolled,
          published: false // starts as unpublished
        }
      });

      if (winnerRecords.length > 0) {
        await tx.winner.createMany({
          data: winnerRecords.map(w => ({
            ...w,
            drawId: newDraw.id
          }))
        });
      }

      // Return the draw with winners included
      return tx.draw.findUnique({
        where: { id: newDraw.id },
        include: {
          winners: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });
    });

    res.status(201).json({
      message: 'Draw ran successfully',
      draw
    });
  } catch (error) {
    console.error('Error running draw:', error);
    res.status(500).json({ error: 'Failed to execute draw' });
  }
});

module.exports = router;
