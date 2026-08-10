export function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

export function formatDateVN(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatTimeVN(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateTimeVN(dateInput) {
  if (!dateInput) return '';
  return `${formatTimeVN(dateInput)} ${formatDateVN(dateInput)}`;
}

export function parseISOToLocalMinutes(dateInput) {
  if (!dateInput) return 0;
  const d = new Date(dateInput);
  return d.getHours() * 60 + d.getMinutes();
}

export function createISOFromDateAndTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const dateObj = new Date(`${dateStr}T${timeStr}:00+07:00`);
  if (isNaN(dateObj.getTime())) return null;
  return dateObj.toISOString();
}

export function generateTimeOptions(startHour = 7, endHour = 22, stepMinutes = 30) {
  const options = [];
  for (let min = startHour * 60; min <= endHour * 60; min += stepMinutes) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    options.push({ label: timeStr, value: timeStr });
  }
  return options;
}
