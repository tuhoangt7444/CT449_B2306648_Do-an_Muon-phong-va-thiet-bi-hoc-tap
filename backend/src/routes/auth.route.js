const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/student/login', authController.studentLogin);
router.post('/staff/login', authController.staffLogin);
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
