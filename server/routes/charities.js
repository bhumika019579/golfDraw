const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/charities - Public endpoint to list all charities
router.get('/', async (req, res) => {
  try {
    const charities = await prisma.charity.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(charities);
  } catch (error) {
    console.error('Error fetching charities:', error);
    res.status(500).json({ error: 'Failed to fetch charities' });
  }
});

// POST /api/charities - Admin only endpoint to create a charity
router.post('/', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const charity = await prisma.charity.create({
      data: {
        name,
        description,
        imageUrl: imageUrl || null
      }
    });

    res.status(201).json(charity);
  } catch (error) {
    console.error('Error creating charity:', error);
    res.status(500).json({ error: 'Failed to create charity' });
  }
});

// PUT /api/charities/:id - Admin only endpoint to update a charity
router.put('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const existingCharity = await prisma.charity.findUnique({
      where: { id }
    });

    if (!existingCharity) {
      return res.status(404).json({ error: 'Charity not found' });
    }

    const updatedCharity = await prisma.charity.update({
      where: { id },
      data: {
        name,
        description,
        imageUrl: imageUrl || null
      }
    });

    res.json(updatedCharity);
  } catch (error) {
    console.error('Error updating charity:', error);
    res.status(500).json({ error: 'Failed to update charity' });
  }
});

// DELETE /api/charities/:id - Admin only endpoint to delete a charity
router.delete('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existingCharity = await prisma.charity.findUnique({
      where: { id }
    });

    if (!existingCharity) {
      return res.status(404).json({ error: 'Charity not found' });
    }

    await prisma.charity.delete({
      where: { id }
    });

    res.json({ message: 'Charity deleted successfully' });
  } catch (error) {
    console.error('Error deleting charity:', error);
    res.status(500).json({ error: 'Failed to delete charity' });
  }
});

module.exports = router;
