const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/scores - Get user's scores in reverse chronological order
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const scores = await prisma.score.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' }
    });
    res.json(scores);
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// POST /api/scores - Add a new score
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { value, date } = req.body;
    const scoreVal = parseInt(value, 10);

    if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45) {
      return res.status(400).json({ error: 'Score value must be an integer between 1 and 45' });
    }

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Normalize date to start of day in UTC to avoid time-zone mismatches
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    if (isNaN(normalizedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Check for duplicate date for this user
    const duplicate = await prisma.score.findFirst({
      where: {
        userId: req.user.id,
        date: normalizedDate
      }
    });

    if (duplicate) {
      return res.status(400).json({ error: 'A score for this date has already been entered' });
    }

    // Fetch existing scores ordered by date ascending to find the oldest
    const existingScores = await prisma.score.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'asc' }
    });

    // If there are 5 or more scores, delete the oldest ones so that we keep only the latest 4, then insert the 5th
    if (existingScores.length >= 5) {
      // Find how many to delete (usually 1, but we do a loop to be robust)
      const toDeleteCount = existingScores.length - 4;
      for (let i = 0; i < toDeleteCount; i++) {
        await prisma.score.delete({
          where: { id: existingScores[i].id }
        });
      }
    }

    // Add new score
    const newScore = await prisma.score.create({
      data: {
        userId: req.user.id,
        value: scoreVal,
        date: normalizedDate
      }
    });

    res.status(201).json(newScore);
  } catch (error) {
    console.error('Error adding score:', error);
    res.status(500).json({ error: 'Failed to add score' });
  }
});

// PUT /api/scores/:id - Edit an existing score
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { value, date } = req.body;
    const scoreVal = parseInt(value, 10);

    if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45) {
      return res.status(400).json({ error: 'Score value must be an integer between 1 and 45' });
    }

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    if (isNaN(normalizedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Verify ownership
    const existingScore = await prisma.score.findUnique({
      where: { id }
    });

    if (!existingScore) {
      return res.status(404).json({ error: 'Score not found' });
    }

    if (existingScore.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this score' });
    }

    // Check duplicate date (excluding current score)
    const duplicate = await prisma.score.findFirst({
      where: {
        userId: req.user.id,
        date: normalizedDate,
        NOT: { id }
      }
    });

    if (duplicate) {
      return res.status(400).json({ error: 'Another score with this date already exists' });
    }

    const updatedScore = await prisma.score.update({
      where: { id },
      data: {
        value: scoreVal,
        date: normalizedDate
      }
    });

    res.json(updatedScore);
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ error: 'Failed to update score' });
  }
});

// DELETE /api/scores/:id - Delete a score
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existingScore = await prisma.score.findUnique({
      where: { id }
    });

    if (!existingScore) {
      return res.status(404).json({ error: 'Score not found' });
    }

    if (existingScore.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this score' });
    }

    await prisma.score.delete({
      where: { id }
    });

    res.json({ message: 'Score deleted successfully' });
  } catch (error) {
    console.error('Error deleting score:', error);
    res.status(500).json({ error: 'Failed to delete score' });
  }
});

module.exports = router;
