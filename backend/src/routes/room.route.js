const express = require('express');
const roomController = require('../controllers/room.controller');
const bookingController = require('../controllers/booking.controller');
const { requireStaff } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', roomController.getRooms);
router.get('/:id/reviews', roomController.getRoomReviews);
router.get('/:id/schedule', bookingController.getRoomSchedule);
router.get('/:id', roomController.getRoomById);
router.post('/', requireStaff, roomController.createRoom);
router.patch('/:id', requireStaff, roomController.updateRoom);
router.delete('/:id', requireStaff, roomController.deleteRoom);

module.exports = router;
