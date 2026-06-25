const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT } = require('../middleware/auth');
const Stripe = require('stripe');

const prisma = new PrismaClient();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/subscribe/create-checkout - Create Stripe checkout session
router.post('/create-checkout', authenticateJWT, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || (plan !== 'monthly' && plan !== 'yearly')) {
      return res.status(400).json({ error: 'Plan must be monthly or yearly' });
    }

    const priceAmount = plan === 'monthly' ? 500 : 5000; // in cents ($5 or $50)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `GolfDraw ${plan === 'monthly' ? 'Monthly' : 'Yearly'} Premium`,
            description: 'Enter monthly draws, support your charity, win prizes.'
          },
          unit_amount: priceAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/dashboard?payment=success&plan=${plan}&userId=${req.user.id}`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard?payment=cancelled`,
      metadata: {
        userId: req.user.id,
        plan: plan
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/subscribe/confirm - Confirm payment and update DB
router.post('/confirm', authenticateJWT, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || (plan !== 'monthly' && plan !== 'yearly')) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        isSubscribed: true,
        subscriptionPlan: plan,
        subscriptionDate: new Date()
      },
      include: { charity: true }
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Subscription activated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Subscription confirm error:', error);
    res.status(500).json({ error: 'Failed to activate subscription' });
  }
});

module.exports = router;