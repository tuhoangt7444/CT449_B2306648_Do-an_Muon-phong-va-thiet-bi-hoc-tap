export function formatRating(rating) {
  if (rating === undefined || rating === null || isNaN(rating) || Number(rating) === 0) {
    return 'Chưa có đánh giá';
  }
  return Number(rating).toFixed(1);
}

export function formatCapacity(capacity) {
  if (!capacity && capacity !== 0) return 'N/A';
  return `${capacity} chỗ ngồi`;
}
