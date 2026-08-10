const express = require('express');
const roomController = require('../controllers/room.controller');
const bookingController = require('../controllers/booking.controller');

const router = express.Router();

router.get('/', roomController.getRooms);
router.get('/:id', roomController.getRoomById);
router.get('/:id/schedule', bookingController.getRoomSchedule);
router.post('/', roomController.createRoom);
router.patch('/:id', roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);

module.exports = router;
