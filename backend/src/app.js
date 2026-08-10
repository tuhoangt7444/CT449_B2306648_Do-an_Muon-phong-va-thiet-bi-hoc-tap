const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { getDatabase } = require('./config/db');
const roomRouter = require('./routes/room.route');
const equipmentRouter = require('./routes/equipment.route');
const authRouter = require('./routes/auth.route');
const studentRouter = require('./routes/student.route');
const staffRouter = require('./routes/staff.route');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'studyhub_ctu_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

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

app.use('/api/auth', authRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/students', studentRouter);
app.use('/api/staff', staffRouter);

app.use((req, res) => {
  res.status(404).json({
    message: 'Resource not found'
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (err.code === 11000 ? 409 : 500);
  let message = err.message || 'Internal Server Error';

  if (err.code === 11000) {
    message = 'Mã hoặc Email dữ liệu đã tồn tại';
  }

  res.status(statusCode).json({
    message: message,
    errors: err.errors || []
  });
});

module.exports = app;
