const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middlewares
app.use(cors());
app.use(express.json());

// Import Routers
const authRouter = require('./routes/auth');
const scoresRouter = require('./routes/scores');
const charitiesRouter = require('./routes/charities');
const subscriptionRouter = require('./routes/subscription');
const drawRouter = require('./routes/draw');
const adminRouter = require('./routes/admin');

// Bind Routers to Endpoints
app.use('/api/auth', authRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/charities', charitiesRouter);
app.use('/api/subscribe', subscriptionRouter); // Mounts POST /api/subscribe
app.use('/api/draw', drawRouter);
app.use('/api/admin', adminRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'An unexpected server error occurred' });
});

// App Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`GolfDraw server running on port ${PORT}`);
});
