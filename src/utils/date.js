export function parseLocalDate(value) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`);
}

export function formatDateInput(date) {
  if (!date) return '';
  const value = typeof date === 'string' ? parseLocalDate(date) : new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateInput, amount) {
  const date = typeof dateInput === 'string' ? parseLocalDate(dateInput) : new Date(dateInput);
  date.setDate(date.getDate() + amount);
  return date;
}

export function todayInput() {
  return formatDateInput(new Date());
}

export function diffInDays(dateA, dateB) {
  const a = parseLocalDate(dateA);
  const b = parseLocalDate(dateB);
  if (!a || !b) return 0;
  const day = 24 * 60 * 60 * 1000;
  return Math.round((a - b) / day);
}

export function formatHumanDate(value, options = {}) {
  const date = parseLocalDate(value);
  if (!date) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    ...options,
  }).format(date);
}

export function formatFullDate(value) {
  const date = parseLocalDate(value);
  if (!date) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function getRelativeLabel(date, releaseDate) {
  const offset = diffInDays(date, releaseDate);
  if (offset === 0) return 'Dia do lançamento';
  if (offset < 0) return `${Math.abs(offset)} dias antes`;
  return `${offset} dias depois`;
}

export function getLastFridayOfMonth(baseDateInput = new Date()) {
  const base = typeof baseDateInput === 'string' && baseDateInput ? parseLocalDate(baseDateInput) : new Date(baseDateInput);
  const year = base.getFullYear();
  const month = base.getMonth();
  const lastDay = new Date(year, month + 1, 0);
  const friday = 5;
  const diff = (lastDay.getDay() - friday + 7) % 7;
  lastDay.setDate(lastDay.getDate() - diff);
  return formatDateInput(lastDay);
}
