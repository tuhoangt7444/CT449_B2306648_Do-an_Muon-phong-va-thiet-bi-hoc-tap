const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const studentLogin = asyncHandler(async (req, res, next) => {
  const body = req.body || {};
  const studentCode = body.studentCode || body.identifier || body.email || body.studentId || body.username || body.code;
  const email = body.email;
  const password = body.password;
  const identifier = (studentCode || email || '').toString().trim();

  if (!identifier) {
    throw new AppError('Mã sinh viên hoặc Email là bắt buộc', 400);
  }
  if (!password || password.toString().trim() === '') {
    throw new AppError('Mật khẩu là bắt buộc', 400);
  }

  const student = await authService.loginStudent({ identifier, password: password.toString().trim() });

  req.session.userId = student._id.toString();
  req.session.userType = 'student';
  delete req.session.role;

  req.session.save((err) => {
    if (err) return next(err);
    res.status(200).json({
      data: student,
      userType: 'student',
      message: 'Đăng nhập sinh viên thành công'
    });
  });
});

const staffLogin = asyncHandler(async (req, res, next) => {
  const body = req.body || {};
  const staffCode = body.staffCode || body.identifier || body.email || body.staffId || body.username || body.code;
  const email = body.email;
  const password = body.password;
  const identifier = (staffCode || email || '').toString().trim();

  if (!identifier) {
    throw new AppError('Mã nhân viên hoặc Email là bắt buộc', 400);
  }
  if (!password || password.toString().trim() === '') {
    throw new AppError('Mật khẩu là bắt buộc', 400);
  }

  const staff = await authService.loginStaff({ identifier, password: password.toString().trim() });

  req.session.userId = staff._id.toString();
  req.session.userType = 'staff';
  req.session.role = staff.role;

  req.session.save((err) => {
    if (err) return next(err);
    res.status(200).json({
      data: staff,
      userType: 'staff',
      role: staff.role,
      message: 'Đăng nhập nhân viên thành công'
    });
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
