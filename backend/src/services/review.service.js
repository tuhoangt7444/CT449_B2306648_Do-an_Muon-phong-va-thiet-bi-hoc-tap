const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/db');
const collections = require('../config/collections');
const AppError = require('../utils/appError');

async function populateReviewDetails(review) {
  if (!review) return null;
  const db = getDatabase();

  const [student, room, booking] = await Promise.all([
    db.collection(collections.STUDENTS).findOne(
      { _id: review.studentId },
      { projection: { password: 0 } }
    ),
    db.collection(collections.ROOMS).findOne(
      { _id: review.roomId }
    ),
    db.collection(collections.BOOKINGS).findOne(
      { _id: review.bookingId }
    )
  ]);

  return {
    ...review,
    student: student || null,
    room: room || null,
    booking: booking || null
  };
}

async function getAllReviews(queryOptions = {}, currentUser = null) {
  const db = getDatabase();
  const {
    roomId,
    studentId,
    bookingId,
    rating,
    from,
    to,
    search,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = queryOptions;

  const filter = {};

  if (roomId && ObjectId.isValid(roomId)) {
    filter.roomId = new ObjectId(roomId);
  }

  if (bookingId && ObjectId.isValid(bookingId)) {
    filter.bookingId = new ObjectId(bookingId);
  }

  if (currentUser && currentUser.userType === 'student') {
    if (studentId && ObjectId.isValid(studentId)) {
      if (studentId !== currentUser.userId) {
        throw new AppError('Bạn không có quyền xem đánh giá của sinh viên khác', 403);
      }
      filter.studentId = new ObjectId(studentId);
    }
  } else if (studentId && ObjectId.isValid(studentId)) {
    filter.studentId = new ObjectId(studentId);
  }

  if (rating !== undefined && rating !== null && rating !== '') {
    const rNum = Number(rating);
    if (!Number.isInteger(rNum) || rNum < 1 || rNum > 5) {
      throw new AppError('Điểm đánh giá (rating) phải là số nguyên từ 1 đến 5', 400);
    }
    filter.rating = rNum;
  }

  if (from || to) {
    const timeFilter = {};
    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) throw new AppError('Thời gian bắt đầu (from) không hợp lệ', 400);
      timeFilter.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) throw new AppError('Thời gian kết thúc (to) không hợp lệ', 400);
      timeFilter.$lte = toDate;
    }
    filter.createdAt = timeFilter;
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    filter.comment = new RegExp(search.trim(), 'i');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const allowedSortFields = ['rating', 'createdAt', 'updatedAt'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDir = sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortDir };

  const totalItems = await db.collection(collections.REVIEWS).countDocuments(filter);
  const rawReviews = await db.collection(collections.REVIEWS)
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .toArray();

  const populatedReviews = await Promise.all(rawReviews.map(r => populateReviewDetails(r)));
  const totalPages = Math.ceil(totalItems / limitNum) || 0;

  return {
    reviews: populatedReviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages
    }
  };
}

async function getReviewById(id, currentUser = null) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã đánh giá (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const review = await db.collection(collections.REVIEWS).findOne({ _id: new ObjectId(id) });

  if (!review) {
    throw new AppError('Không tìm thấy đánh giá', 404);
  }

  return await populateReviewDetails(review);
}

async function createReview(data, currentUser) {
  if (!currentUser || currentUser.userType !== 'student') {
    throw new AppError('Chỉ sinh viên mới được quyền tạo đánh giá', 403);
  }

  const { bookingId, rating, comment } = data || {};

  if (!bookingId || !ObjectId.isValid(bookingId)) {
    throw new AppError('Mã phiếu mượn (bookingId) không hợp lệ', 400);
  }

  const ratingNum = Number(rating);
  if (rating === undefined || rating === null || typeof rating !== 'number' || !Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new AppError('Điểm đánh giá (rating) phải là số nguyên từ 1 đến 5', 400);
  }

  if (comment !== undefined && comment !== null && (typeof comment !== 'string' || comment.trim().length > 1000)) {
    throw new AppError('Nội dung đánh giá (comment) phải là chuỗi và tối đa 1000 ký tự', 400);
  }

  const db = getDatabase();
  const bId = new ObjectId(bookingId);

  const booking = await db.collection(collections.BOOKINGS).findOne({ _id: bId });
  if (!booking) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (booking.studentId.toString() !== currentUser.userId) {
    throw new AppError('Bạn không có quyền đánh giá phiếu mượn của sinh viên khác', 403);
  }

  if (booking.status !== 'completed') {
    throw new AppError('Chỉ có thể đánh giá phiếu mượn ở trạng thái đã hoàn thành (completed)', 409);
  }

  const existingReview = await db.collection(collections.REVIEWS).findOne({ bookingId: bId });
  if (existingReview) {
    throw new AppError('Phiếu mượn này đã được đánh giá trước đó', 409);
  }

  const now = new Date();
  const newReview = {
    bookingId: bId,
    studentId: booking.studentId,
    roomId: booking.roomId,
    rating: ratingNum,
    comment: comment ? comment.trim() : '',
    createdAt: now,
    updatedAt: now
  };

  try {
    const result = await db.collection(collections.REVIEWS).insertOne(newReview);
    const createdDoc = { _id: result.insertedId, ...newReview };
    return await populateReviewDetails(createdDoc);
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('Phiếu mượn này đã được đánh giá trước đó', 409);
    }
    throw err;
  }
}

async function updateReview(id, updateData, currentUser) {
  if (!currentUser || currentUser.userType !== 'student') {
    throw new AppError('Chỉ sinh viên sở hữu mới được quyền cập nhật đánh giá', 403);
  }

  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã đánh giá (ID) không hợp lệ', 400);
  }

  if (!updateData || Object.keys(updateData).length === 0) {
    throw new AppError('Dữ liệu cập nhật không được để rỗng', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.REVIEWS).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy đánh giá', 404);
  }

  if (existing.studentId.toString() !== currentUser.userId) {
    throw new AppError('Bạn không có quyền sửa đánh giá này', 403);
  }

  const setPayload = { updatedAt: new Date() };

  if (updateData.rating !== undefined) {
    const rNum = Number(updateData.rating);
    if (typeof updateData.rating !== 'number' || !Number.isInteger(rNum) || rNum < 1 || rNum > 5) {
      throw new AppError('Điểm đánh giá (rating) phải là số nguyên từ 1 đến 5', 400);
    }
    setPayload.rating = rNum;
  }

  if (updateData.comment !== undefined) {
    if (typeof updateData.comment !== 'string' || updateData.comment.trim().length > 1000) {
      throw new AppError('Nội dung đánh giá (comment) phải là chuỗi và tối đa 1000 ký tự', 400);
    }
    setPayload.comment = updateData.comment.trim();
  }

  await db.collection(collections.REVIEWS).updateOne(
    { _id: targetId },
    { $set: setPayload }
  );

  const updatedDoc = await db.collection(collections.REVIEWS).findOne({ _id: targetId });
  return await populateReviewDetails(updatedDoc);
}

async function deleteReview(id, currentUser) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã đánh giá (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.REVIEWS).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy đánh giá', 404);
  }

  if (currentUser.userType === 'student') {
    if (existing.studentId.toString() !== currentUser.userId) {
      throw new AppError('Bạn không có quyền xóa đánh giá này', 403);
    }
  } else if (currentUser.userType === 'staff') {
    const staffDoc = await db.collection(collections.STAFF).findOne({ _id: new ObjectId(currentUser.userId) });
    if (!staffDoc || staffDoc.role !== 'manager') {
      throw new AppError('Chỉ Quản lý (Manager) mới có quyền xóa đánh giá', 403);
    }
  } else {
    throw new AppError('Bạn không có quyền xóa đánh giá này', 403);
  }

  await db.collection(collections.REVIEWS).deleteOne({ _id: targetId });
  return true;
}

async function getRoomReviews(roomId, queryOptions = {}) {
  if (!ObjectId.isValid(roomId)) {
    throw new AppError('Mã phòng (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const roomObjId = new ObjectId(roomId);

  const room = await db.collection(collections.ROOMS).findOne({ _id: roomObjId });
  if (!room) {
    throw new AppError('Không tìm thấy phòng học', 404);
  }

  const stats = await getRoomRatingStats(roomObjId);

  const {
    rating,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = queryOptions;

  const filter = { roomId: roomObjId };

  if (rating !== undefined && rating !== null && rating !== '') {
    const rNum = Number(rating);
    if (!Number.isInteger(rNum) || rNum < 1 || rNum > 5) {
      throw new AppError('Điểm đánh giá (rating) phải là số nguyên từ 1 đến 5', 400);
    }
    filter.rating = rNum;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const allowedSortFields = ['rating', 'createdAt'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDir = sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortDir };

  const totalFiltered = await db.collection(collections.REVIEWS).countDocuments(filter);
  const rawReviews = await db.collection(collections.REVIEWS)
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .toArray();

  const populatedReviews = await Promise.all(rawReviews.map(r => populateReviewDetails(r)));
  const totalPages = Math.ceil(totalFiltered / limitNum) || 0;

  return {
    room: {
      _id: room._id,
      roomCode: room.roomCode,
      name: room.name,
      capacity: room.capacity,
      status: room.status
    },
    averageRating: stats.averageRating,
    reviewCount: stats.reviewCount,
    reviews: populatedReviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems: totalFiltered,
      totalPages
    }
  };
}

async function getRoomRatingStats(roomId) {
  const db = getDatabase();
  const roomObjId = typeof roomId === 'string' ? new ObjectId(roomId) : roomId;

  const agg = await db.collection(collections.REVIEWS).aggregate([
    { $match: { roomId: roomObjId } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]).toArray();

  if (!agg || agg.length === 0) {
    return { averageRating: 0, reviewCount: 0 };
  }

  const rawAvg = agg[0].avgRating || 0;
  const roundedAvg = Math.round(rawAvg * 10) / 10;
  return {
    averageRating: roundedAvg,
    reviewCount: agg[0].count || 0
  };
}

module.exports = {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getRoomReviews,
  getRoomRatingStats
};
