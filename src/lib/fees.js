export const FEE_CATEGORIES = [
  { key: 'meeting', label: 'Meeting Fee' },
  { key: 'social', label: 'Social Event' },
  { key: 'sponsorship', label: 'Sponsorship' },
];
export const catLabel = (key) => FEE_CATEGORIES.find(c => c.key === key)?.label || key;

export const nextWednesdayAfter = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  while (d.getDay() !== 3) d.setDate(d.getDate() + 1);
  return d;
};

export const wednesdaysThrough = (lastDateStr, todayStr, holidaySet = new Set()) => {
  const out = [];
  let cur = nextWednesdayAfter(lastDateStr);
  const end = new Date(todayStr + 'T00:00:00');
  while (cur <= end) {
    const iso = cur.toISOString().slice(0, 10);
    if (!holidaySet.has(iso)) out.push(iso);
    cur = new Date(cur.getTime() + 7 * 86400000);
  }
  return out;
};

export const categoryBalance = (ledger, category) => (ledger || [])
  .filter(l => l.category === category)
  .reduce((s, l) => s + (l.type === 'charge' ? Number(l.amount) : -Number(l.amount)), 0);

export const totalBalance = (ledger) => (ledger || [])
  .reduce((s, l) => s + (l.type === 'charge' ? Number(l.amount) : -Number(l.amount)), 0);

export const wednesdaysInMonth = (monthStr) => {
  const [y, m] = monthStr.split('-').map(Number);
  const out = [];
  const d = new Date(y, m - 1, 1);
  while (d.getMonth() === m - 1) {
    if (d.getDay() === 3) out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
};
