const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { requireAuth, requireStudent } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, bookingController.getBookings);
router.get('/:id', requireAuth, bookingController.getBookingById);
router.post('/', requireStudent, bookingController.createBooking);
router.patch('/:id', requireStudent, bookingController.updateBooking);
router.delete('/:id', requireStudent, bookingController.deleteBooking);

module.exports = router;
