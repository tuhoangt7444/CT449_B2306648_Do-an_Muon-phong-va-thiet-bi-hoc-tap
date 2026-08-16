const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const login = asyncHandler(async (req, res, next) => {
  const body = req.body || {};
  const code = (body.code || body.identifier || '').toString().trim();
  const password = (body.password || '').toString().trim();

  if (!code) {
    throw new AppError('Mã số sinh viên là bắt buộc', 400);
  }
  if (!password) {
    throw new AppError('Mật khẩu là bắt buộc', 400);
  }
  // Gọi hàm loginUnified từ authService để xác thực người dùng
  const result = await authService.loginUnified({ identifier: code, password });
  // Lưu thông tin người dùng vào session
  req.session.userId = result.user._id.toString();
  req.session.userType = result.userType; //Lưu loại tài khoản
  if (result.role) {
    req.session.role = result.role;
    req.session.buildingId = result.buildingId ? result.buildingId.toString() : null;
  } else {
    delete req.session.role;
    delete req.session.buildingId;
  }
  // Lưu session và gửi phản hồi thành công
  req.session.save((err) => {
    if (err) return next(err); // Xử lý lỗi khi lưu session
    res.status(200).json({
      data: result.user,
      userType: result.userType,
      role: result.role || null,
      buildingId: result.buildingId || null,
      message: 'Đăng nhập thành công'
    });
  });
});
// Lấy thông tin người dùng hiện tại
const getMe = asyncHandler(async (req, res) => {
  if (!req.session || !req.session.userId || !req.session.userType) {
    throw new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', 401);
  }

  try {
    const user = await authService.getCurrentUser(req.session.userId, req.session.userType);
    if (req.session.userType === 'staff') {
      req.session.role = user.role;
      req.session.buildingId = user.buildingId ? user.buildingId.toString() : null;
    }

    res.status(200).json({
      data: user,
      userType: req.session.userType,
      role: req.session.role || null,
      buildingId: user.buildingId || null,
      message: 'Lấy thông tin người dùng hiện tại thành công'
    });
  } catch (err) {
    req.session.destroy(() => {}); // Xóa session nếu có lỗi xảy ra
    res.clearCookie('connect.sid');
    throw err;
  }
});
// Đăng xuất người dùng
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
  login,
  getMe,
  logout
};
