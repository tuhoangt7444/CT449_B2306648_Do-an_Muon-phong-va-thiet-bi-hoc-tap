const reviewService = require('../services/review.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const getReviews = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };
  const result = await reviewService.getAllReviews(req.query, currentUser);
  res.status(200).json({
    data: result.reviews,
    pagination: result.pagination
  });
});

const getReviewById = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };
  const review = await reviewService.getReviewById(req.params.id, currentUser);
  res.status(200).json({
    data: review,
    message: 'Lấy chi tiết đánh giá thành công'
  });
});

const createReview = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };
  const review = await reviewService.createReview(req.body, currentUser);
  res.status(201).json({
    data: review,
    message: 'Tạo đánh giá phòng thành công'
  });
});

const updateReview = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };
  const review = await reviewService.updateReview(req.params.id, req.body, currentUser);
  res.status(200).json({
    data: review,
    message: 'Cập nhật đánh giá thành công'
  });
});

const deleteReview = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };
  await reviewService.deleteReview(req.params.id, currentUser);
  res.status(204).send();
});

const getRoomReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getRoomReviews(req.params.id, req.query);
  res.status(200).json({
    data: {
      room: result.room,
      averageRating: result.averageRating,
      reviewCount: result.reviewCount,
      reviews: result.reviews
    },
    pagination: result.pagination
  });
});

module.exports = {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getRoomReviews
};
