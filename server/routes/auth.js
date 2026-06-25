const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_me_in_production';

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, charityId, charityPercent, role } = req.body;

    // Only allow 'subscriber' or 'admin' — default to 'subscriber'
    const assignedRole = role === 'admin' ? 'admin' : 'subscriber';

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const percent = charityPercent !== undefined ? parseFloat(charityPercent) : 10;
    if (percent < 10) {
      return res.status(400).json({ error: 'Charity contribution percentage must be at least 10%' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        charityId: charityId || null,
        charityPercent: percent,
        role: assignedRole
      },
      include: {
        charity: true
      }
    });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, isSubscribed: user.isSubscribed },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password hash from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { charity: true }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, isSubscribed: user.isSubscribed },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

const { authenticateJWT } = require('../middleware/auth');

// PUT /profile - Update logged-in user's charity preference
router.put('/profile', authenticateJWT, async (req, res) => {
  try {
    const { charityId, charityPercent } = req.body;
    const percent = parseFloat(charityPercent);

    if (isNaN(percent) || percent < 10) {
      return res.status(400).json({ error: 'Charity contribution percentage must be at least 10%' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        charityId: charityId || null,
        charityPercent: percent
      },
      include: {
        charity: true
      }
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update charity preferences' });
  }
});

module.exports = router;
