const express = require('express');
const reviewController = require('../controllers/review.controller');
const { requireAuth, requireStudent } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, reviewController.getReviews);
router.post('/', requireStudent, reviewController.createReview);
router.get('/:id', requireAuth, reviewController.getReviewById);
router.patch('/:id', requireStudent, reviewController.updateReview);
router.delete('/:id', requireAuth, reviewController.deleteReview);

module.exports = router;
