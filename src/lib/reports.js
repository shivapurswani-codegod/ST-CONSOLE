import { FEE_CATEGORIES, wednesdaysInMonth } from './fees';

// 'YYYY-MM' -> { start: 'YYYY-MM-01', end: 'YYYY-MM-DD' (last day) }
export function monthRange(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const start = `${monthStr}-01`;
  const lastDay = new Date(y, m, 0).getDate(); // day 0 of next month = last day of this month
  const end = `${monthStr}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export function currentMonthStr() {
  return new Date().toISOString().slice(0, 7);
}

export function monthLabel(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

// Opening balance (everything before the month) + this month's charges/payments = closing balance.
// Returned per category and as a total, for one member.
export function memberMonthSnapshot(ledger, monthStr) {
  const { start, end } = monthRange(monthStr);
  const byCategory = {};
  let opening = 0, charged = 0, paid = 0;

  FEE_CATEGORIES.forEach(({ key }) => {
    const entries = (ledger || []).filter(l => l.category === key);
    const o = entries.filter(l => l.date < start).reduce((s, l) => s + (l.type === 'charge' ? Number(l.amount) : -Number(l.amount)), 0);
    const c = entries.filter(l => l.date >= start && l.date <= end && l.type === 'charge').reduce((s, l) => s + Number(l.amount), 0);
    const p = entries.filter(l => l.date >= start && l.date <= end && l.type === 'payment').reduce((s, l) => s + Number(l.amount), 0);
    byCategory[key] = { opening: o, charged: c, paid: p, closing: o + c - p };
    opening += o; charged += c; paid += p;
  });

  return { opening, charged, paid, closing: opening + charged - paid, byCategory };
}

export function receiptNumber(entry) {
  return `RCPT-${(entry.date || '').replace(/-/g, '')}-${String(entry.id || '').slice(0, 6).toUpperCase()}`;
}

// Meetings actually held in a month = Wednesdays in that month minus marked holidays.
export function meetingsInMonth(monthStr, holidays) {
  const wednesdays = wednesdaysInMonth(monthStr);
  const holidaySet = new Set((holidays || []).map(h => h.date));
  const excluded = wednesdays.filter(d => holidaySet.has(d));
  return { total: wednesdays.length, excluded: excluded.length, effective: wednesdays.length - excluded.length, excludedDates: excluded };
}

export function addMonths(monthStr, n) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return d.toISOString().slice(0, 7);
}

export function monthsFromTo(start, end) {
  const out = [];
  let cur = start;
  while (cur <= end) { out.push(cur); cur = addMonths(cur, 1); }
  return out;
}
