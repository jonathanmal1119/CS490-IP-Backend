const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const filmsRouter = require('./routes/films');
const actorsRouter = require('./routes/actors');

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'],
  credentials: true
}));

// Routes
app.use('/api/films', filmsRouter);
app.use('/api/actors', actorsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Server Error'
  });
});

module.exports = app;
