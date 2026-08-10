const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { requireAuth, requireStudent, requireStaff } = require('../middlewares/auth.middleware');

const router = express.Router();

router.patch('/:id/approve', requireStaff, bookingController.approveBooking);
router.patch('/:id/reject', requireStaff, bookingController.rejectBooking);
router.patch('/:id/cancel', requireStudent, bookingController.cancelBooking);
router.patch('/:id/check-in', requireStaff, bookingController.checkInBooking);
router.patch('/:id/complete', requireStaff, bookingController.completeBooking);

router.get('/', requireAuth, bookingController.getBookings);
router.get('/:id', requireAuth, bookingController.getBookingById);
router.post('/', requireStudent, bookingController.createBooking);
router.patch('/:id', requireStudent, bookingController.updateBooking);
router.delete('/:id', requireStudent, bookingController.deleteBooking);

module.exports = router;
