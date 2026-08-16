export function formatRating(rating) {
  if (rating === undefined || rating === null || isNaN(rating) || Number(rating) === 0) {
    return 'Chưa có đánh giá';
  }
  return Number(rating).toFixed(1);
}

export function formatCapacity(capacity, capacitySource, observedMinimumCapacity) {
  if (capacitySource === 'official' || (capacity !== undefined && capacity !== null && Number(capacity) > 0)) {
    return `${capacity} người`;
  }
  if (capacitySource === 'observed_minimum' || (observedMinimumCapacity !== undefined && observedMinimumCapacity !== null && Number(observedMinimumCapacity) > 0)) {
    return `Ít nhất ${observedMinimumCapacity} (Quan sát)`;
  }
  return 'Chưa xác minh';
}
