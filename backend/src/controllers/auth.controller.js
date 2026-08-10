const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const studentLogin = asyncHandler(async (req, res) => {
  const { studentCode, email, password } = req.body || {};
  const identifier = studentCode || email;

  if (!identifier || typeof identifier !== 'string' || identifier.trim() === '') {
    throw new AppError('Mã sinh viên hoặc Email là bắt buộc', 400);
  }
  if (!password || typeof password !== 'string' || password === '') {
    throw new AppError('Mật khẩu là bắt buộc', 400);
  }

  const student = await authService.loginStudent({ identifier, password });

  req.session.userId = student._id.toString();
  req.session.userType = 'student';

  res.status(200).json({
    data: student,
    userType: 'student',
    message: 'Đăng nhập sinh viên thành công'
  });
});

const staffLogin = asyncHandler(async (req, res) => {
  const { staffCode, email, password } = req.body || {};
  const identifier = staffCode || email;

  if (!identifier || typeof identifier !== 'string' || identifier.trim() === '') {
    throw new AppError('Mã nhân viên hoặc Email là bắt buộc', 400);
  }
  if (!password || typeof password !== 'string' || password === '') {
    throw new AppError('Mật khẩu là bắt buộc', 400);
  }

  const staff = await authService.loginStaff({ identifier, password });

  req.session.userId = staff._id.toString();
  req.session.userType = 'staff';
  req.session.role = staff.role;

  res.status(200).json({
    data: staff,
    userType: 'staff',
    role: staff.role,
    message: 'Đăng nhập nhân viên thành công'
  });
});

const getMe = asyncHandler(async (req, res) => {
  if (!req.session || !req.session.userId || !req.session.userType) {
    throw new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', 401);
  }

  try {
    const user = await authService.getCurrentUser(req.session.userId, req.session.userType);
    res.status(200).json({
      data: user,
      userType: req.session.userType,
      role: req.session.role || null,
      message: 'Lấy thông tin người dùng hiện tại thành công'
    });
  } catch (err) {
    req.session.destroy(() => {});
    res.clearCookie('connect.sid');
    throw err;
  }
});

const logout = asyncHandler(async (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.status(204).send();
    });
  } else {
    res.clearCookie('connect.sid');
    res.status(204).send();
  }
});

module.exports = {
  studentLogin,
  staffLogin,
  getMe,
  logout
};
