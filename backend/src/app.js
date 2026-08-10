const express = require('express');
const cors = require('cors');
const { getDatabase } = require('./config/db');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const db = getDatabase();
    if (db) {
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = 'disconnected';
  }

  res.status(200).json({
    data: {
      status: 'ok',
      database: dbStatus
    },
    message: 'StudyHub CTU API is running'
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: 'Resource not found'
  });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
