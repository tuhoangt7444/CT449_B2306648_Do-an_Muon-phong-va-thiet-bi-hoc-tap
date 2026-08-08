const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    data: {
      status: 'ok'
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
