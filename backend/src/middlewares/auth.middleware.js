const AppError = require('../utils/appError');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId || !req.session.userType) {
    return next(new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', 401));
  }
  next();
}

function requireStudent(req, res, next) {
  if (!req.session || !req.session.userId || !req.session.userType) {
    return next(new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', 401));
  }
  if (req.session.userType !== 'student') {
    return next(new AppError('Chỉ sinh viên mới có quyền thực hiện thao tác này.', 403));
  }
  next();
}

function requireStaff(req, res, next) {
  if (!req.session || !req.session.userId || !req.session.userType) {
    return next(new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', 401));
  }
  if (req.session.userType !== 'staff') {
    return next(new AppError('Bạn không có quyền truy cập tài nguyên này.', 403));
  }
  next();
}

module.exports = {
  requireAuth,
  requireStudent,
  requireStaff
};
