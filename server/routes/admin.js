const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT, requireAdmin } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

// Configure Multer for memory storage (file uploads)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET /api/admin/users - List all users with sub details (Admin only)
router.get('/users', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        charity: true,
        scores: {
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Strip passwords before sending
    const safeUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

// PUT /api/admin/users/:id/subscribe - Manually toggle subscription status (Admin only)
router.put('/users/:id/subscribe', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isSubscribed, plan } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isSubscribed: !!isSubscribed,
        subscriptionPlan: isSubscribed ? (plan || 'monthly') : null,
        subscriptionDate: isSubscribed ? new Date() : null
      },
      include: { charity: true }
    });

    const { password, ...safeUser } = updatedUser;
    res.json({ message: 'User subscription status updated', user: safeUser });
  } catch (error) {
    console.error('Error modifying user subscription:', error);
    res.status(500).json({ error: 'Failed to update user subscription status' });
  }
});

// GET /api/admin/winners - List all winners (Admin only)
router.get('/winners', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const winners = await prisma.winner.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, charity: true }
        },
        draw: true
      },
      orderBy: { draw: { createdAt: 'desc' } }
    });
    res.json(winners);
  } catch (error) {
    console.error('Error fetching winners:', error);
    res.status(500).json({ error: 'Failed to fetch winners' });
  }
});

// PUT /api/admin/verify/:winnerId - Approve/reject/pay a winner (Admin only)
router.put('/verify/:winnerId', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { winnerId } = req.params;
    const { status } = req.body; // 'pending' | 'approved' | 'rejected' | 'paid'

    if (!['pending', 'approved', 'rejected', 'paid'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be pending, approved, rejected, or paid.' });
    }

    const winner = await prisma.winner.findUnique({
      where: { id: winnerId }
    });

    if (!winner) {
      return res.status(404).json({ error: 'Winner record not found' });
    }

    const updatedWinner = await prisma.winner.update({
      where: { id: winnerId },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        draw: true
      }
    });

    res.json({ message: `Winner status updated to ${status}`, winner: updatedWinner });
  } catch (error) {
    console.error('Error verifying winner:', error);
    res.status(500).json({ error: 'Failed to update winner status' });
  }
});

// PUT /api/admin/draws/:id/publish - Publish a draw result (Admin only)
router.put('/draws/:id/publish', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const draw = await prisma.draw.findUnique({ where: { id } });
    if (!draw) {
      return res.status(404).json({ error: 'Draw not found' });
    }

    const updatedDraw = await prisma.draw.update({
      where: { id },
      data: { published: true },
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

    res.json({ message: 'Draw result published successfully', draw: updatedDraw });
  } catch (error) {
    console.error('Error publishing draw:', error);
    res.status(500).json({ error: 'Failed to publish draw result' });
  }
});

// POST /api/admin/winners/:id/proof - Upload proof screenshot (Accessible by owner or Admin)
// Note: This endpoint resides in routes/admin.js but handles verification and updates for users as well.
router.post('/winners/:id/proof', authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;

    const winner = await prisma.winner.findUnique({
      where: { id }
    });

    if (!winner) {
      return res.status(404).json({ error: 'Winner record not found' });
    }

    // Check permissions: must be the winning user or an admin
    if (winner.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. You cannot upload proof for this record.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // Fail-safe mock upload if Cloudinary is not configured in .env
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary environment variables not fully configured. Using mock upload URL.');
      
      const mockUrl = 'https://images.unsplash.com/photo-1587174132402-41d13edeb6c6?q=80&w=600'; // high-quality golf image fallback
      
      const updatedWinner = await prisma.winner.update({
        where: { id },
        data: { proofUrl: mockUrl },
        include: {
          user: { select: { id: true, name: true, email: true } },
          draw: true
        }
      });

      return res.json({
        message: 'Mock upload successful (Cloudinary credentials missing)',
        proofUrl: mockUrl,
        winner: updatedWinner
      });
    }

    // Perform actual Cloudinary upload using streams
    const uploadStream = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { 
            folder: 'golfdraw_proofs',
            resource_type: 'image'
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
    };

    const cloudinaryResult = await uploadStream();

    const updatedWinner = await prisma.winner.update({
      where: { id },
      data: { proofUrl: cloudinaryResult.secure_url },
      include: {
        user: { select: { id: true, name: true, email: true } },
        draw: true
      }
    });

    res.json({
      message: 'Proof uploaded successfully to Cloudinary',
      proofUrl: cloudinaryResult.secure_url,
      winner: updatedWinner
    });
  } catch (error) {
    console.error('Cloudinary proof upload error:', error);
    res.status(500).json({ error: 'Failed to upload proof image to Cloudinary' });
  }
});

module.exports = router;
