const express = require('express');
const roomController = require('../controllers/room.controller');

const router = express.Router();

router.get('/', roomController.getRooms);
router.get('/:id', roomController.getRoomById);
router.post('/', roomController.createRoom);
router.patch('/:id', roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);

module.exports = router;
