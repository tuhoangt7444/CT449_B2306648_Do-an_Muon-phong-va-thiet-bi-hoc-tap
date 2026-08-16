const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { requireAuth, requireStudent, requireStaff } = require('../middlewares/auth.middleware');

const router = express.Router();
// nhân viên duyệt yêu cầu
router.patch('/:id/approve', requireStaff, bookingController.approveBooking);
// nhân viên từ chối yêu cầu
router.patch('/:id/reject', requireStaff, bookingController.rejectBooking);
// sinh viên hủy yêu cầu
router.patch('/:id/cancel', requireStudent, bookingController.cancelBooking);
// sinh viên trả phòng sớm
router.patch('/:id/return', requireStudent, bookingController.returnBookingEarly);
// nhân viên check-in
router.patch('/:id/check-in', requireStaff, bookingController.checkInBooking);
// nhân viên hoàn thành yêu cầu
router.patch('/:id/complete', requireStaff, bookingController.completeBooking);
// lấy danh sách yêu cầu đặt phòng
router.get('/', requireAuth, bookingController.getBookings);
// lấy chi tiết yêu cầu đặt phòng theo id
router.get('/:id', requireAuth, bookingController.getBookingById);
// sinh viên tạo yêu cầu đặt phòng
router.post('/', requireStudent, bookingController.createBooking);
// sinh viên cập nhật yêu cầu đặt phòng
router.patch('/:id', requireStudent, bookingController.updateBooking);
// sinh viên xóa yêu cầu đặt phòng
router.delete('/:id', requireStudent, bookingController.deleteBooking);

module.exports = router;
