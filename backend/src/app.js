const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { getDatabase } = require('./config/db');
const roomRouter = require('./routes/room.route');
const equipmentRouter = require('./routes/equipment.route');
const authRouter = require('./routes/auth.route');
const staffRouter = require('./routes/staff.route');
const bookingRouter = require('./routes/booking.route');
const reviewRouter = require('./routes/review.route');
const dashboardRouter = require('./routes/dashboard.route');
const buildingRouter = require('./routes/building.route');
const buildingManagerRouter = require('./routes/buildingManager.route');

const app = express();
// Cấu hình CORS để cho phép các origin cụ thể truy cập vào API
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_ORIGIN
].filter(Boolean);
// Cấu hình CORS để cho phép các origin cụ thể truy cập vào API
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin không được phép bởi CORS'));
    }
  },
  credentials: true // Cho phép gửi cookie từ client
}));
// Cấu hình middleware để phân tích dữ liệu JSON và URL-encoded với giới hạn kích thước 20MB
app.use(express.json({ limit: '20mb' }));
// dùng extended: true cho phép phân tích dữ liệu có cấu trúc phức tạp hơn như object và array.
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
// Cấu hình session để quản lý phiên làm việc của người dùng
app.use(session({
  // dùng secret từ biến môi trường nếu không có thì dùng giá trị mặc định
  secret: process.env.SESSION_SECRET || 'studyhub_ctu_secret_key_2026',
  // không lưu session nếu không có thay đổi
  resave: false,
  // không lưu session nếu không có dữ liệu
  saveUninitialized: false,
  // Cấu hình cookie cho session
  cookie: {
    httpOnly: true, // KHông cho client JavaScript truy cập cookie tránh xss
    sameSite: 'lax', // Chỉ cho gửi cookie trong cùng một site hoặc từ các trang con của site đó, giúp bảo vệ chống lại CSRF
    secure: false, // Chỉ gửi cookie qua HTTPS
    maxAge: 24 * 60 * 60 * 1000 //thời gian sống cookie 1 ngày
  }
}));
// Định nghĩa route kiểm tra trạng thái của API và cơ sở dữ liệu
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
  // Gửi phản hồi với trạng thái của API và cơ sở dữ liệu
  res.status(200).json({
    data: {
      status: 'ok',
      database: dbStatus
    },
    message: 'StudyHub CTU API is running'
  });
});
// Tạo tiền tố url
app.use('/api/auth', authRouter);
app.use('/api/buildings', buildingRouter);
app.use('/api/building-managers', buildingManagerRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/staff', staffRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((req, res) => {
  res.status(404).json({
    message: 'Resource not found'
  });
});
// Middleware xử lý lỗi
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
// Xuất app để sử dụng trong server.js
module.exports = app;
