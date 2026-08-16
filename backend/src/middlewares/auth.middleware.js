const AppError = require('../utils/appError');
const { ObjectId } = require('mongodb');
// Middleware để kiểm tra xác thực người dùng
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId || !req.session.userType) {
    return next(new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', 401));
  }
  next();
}
// Middleware để kiểm tra quyền truy cập của sinh viên
function requireStudent(req, res, next) {
  if (!req.session || !req.session.userId || !req.session.userType) {
    return next(new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', 401));
  }
  if (req.session.userType !== 'student') {
    return next(new AppError('Chỉ sinh viên mới có quyền thực hiện thao tác này.', 403));
  }
  next();
}
// Middleware để kiểm tra quyền truy cập của nhân viên
function requireStaff(req, res, next) {
  if (!req.session || !req.session.userId || !req.session.userType) {
    return next(new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', 401));
  }
  if (req.session.userType !== 'staff') {
    return next(new AppError('Bạn không có quyền truy cập tài nguyên này.', 403));
  }
  next();
}
// Middleware để kiểm tra quyền truy cập của Super Admin
function requireSuperAdmin(req, res, next) {
  if (!req.session || !req.session.userId || !req.session.userType) {
    return next(new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', 401));
  }
  if (req.session.userType !== 'staff' || req.session.role !== 'super_admin') {
    return next(new AppError('Quyền truy cập bị từ chối. Thao tác này yêu cầu quyền Quản trị cao nhất (Super Admin).', 403));
  }
  next();
}
// Lấy phạm vi truy cập của nhân viên từ session
function getStaffScope(req) {
  if (!req.session || req.session.userType !== 'staff') {
    return { isSuperAdmin: false, buildingId: null };
  }
  if (req.session.role === 'super_admin') {
    return { isSuperAdmin: true, buildingId: null };
  }
  let bId = req.session.buildingId ? new ObjectId(req.session.buildingId) : null;
  return { isSuperAdmin: false, buildingId: bId };
}
// Kiểm tra quyền truy cập của nhân viên đối với một tòa nhà cụ thể
function assertBuildingAccess(req, resourceBuildingId) {
  if (!req.session || req.session.userType !== 'staff') {
    const error = new Error('Bạn không có quyền truy cập tài nguyên này');
    error.statusCode = 403;
    throw error;
  }

  if (req.session.role === 'super_admin') {
    return true;
  }

  if (!resourceBuildingId) {
    const error = new Error('Tài nguyên không có thông tin tòa nhà');
    error.statusCode = 403;
    throw error;
  }
  //
  const userBuildingId = req.session.buildingId ? req.session.buildingId.toString() : null;
  const targetBuildingId = resourceBuildingId.toString();

  if (userBuildingId !== targetBuildingId) {
    const error = new Error('Truy cập bị từ chối. Bạn không có quyền thao tác trên tài nguyên của tòa nhà khác.');
    error.statusCode = 403;
    throw error;
  }

  return true;
}

module.exports = {
  requireAuth,
  requireStudent,
  requireStaff,
  requireSuperAdmin,
  getStaffScope,
  assertBuildingAccess
};
