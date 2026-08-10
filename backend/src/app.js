const express = require('express');
const cors = require('cors');
const { getDatabase } = require('./config/db');
const roomRouter = require('./routes/room.route');

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

app.use('/api/rooms', roomRouter);

app.use((req, res) => {
  res.status(404).json({
    message: 'Resource not found'
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (err.code === 11000 ? 409 : 500);
  let message = err.message || 'Internal Server Error';

  if (err.code === 11000) {
    message = 'Mã phòng đã tồn tại';
  }

  res.status(statusCode).json({
    message: message,
    errors: err.errors || []
  });
});

module.exports = app;
