import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_DATA_URI } from './logo';
import { fmt } from './theme';
import { catLabel } from './fees';
import { receiptNumber } from './reports';

function header(doc, title, sub) {
  try { doc.addImage(LOGO_DATA_URI, 'PNG', 165, 10, 30, 30); } catch (e) {}
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('BNI Insomniacs', 14, 20);
  doc.setFontSize(12);
  doc.text(title, 14, 28);
  if (sub) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(sub, 14, 34);
    doc.setTextColor(0, 0, 0);
  }
  return 46;
}

export function downloadLiveSnapshotPDF({ rows }) {
  const doc = new jsPDF();
  const startY = header(doc, 'Members — Current Outstanding', 'Live balances as of today');
  autoTable(doc, {
    startY,
    head: [['Name', 'Company', 'Meeting', 'Social', 'Sponsorship', 'Total due', 'Status']],
    body: rows.map(r => [r.name, r.company || '', `AED ${fmt(r.meeting)}`, `AED ${fmt(r.social)}`, `AED ${fmt(r.sponsorship)}`, `AED ${fmt(r.total)}`, r.status]),
    headStyles: { fillColor: [28, 36, 48] },
    styles: { fontSize: 9 },
  });
  doc.save(`st-console-members-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function downloadMonthlyReportPDF({ monthLabelText, rows, settings }) {
  const doc = new jsPDF();
  const startY = header(doc, `Outstanding Report — ${monthLabelText}`, 'Opening balance + charges − payments this month = closing balance');
  autoTable(doc, {
    startY,
    head: [['Name', 'Company', 'Opening', 'Charged', 'Paid', 'Closing']],
    body: rows.map(r => [r.name, r.company || '', `AED ${fmt(r.opening)}`, `AED ${fmt(r.charged)}`, `AED ${fmt(r.paid)}`, `AED ${fmt(r.closing)}`]),
    headStyles: { fillColor: [28, 36, 48] },
    styles: { fontSize: 9 },
  });
  doc.save(`st-console-outstanding-${monthLabelText.replace(' ', '-')}.pdf`);
}

export function downloadReceiptPDF({ member, entry, settings }) {
  const doc = new jsPDF();
  const startY = header(doc, 'Payment Receipt', receiptNumber(entry));
  doc.setFontSize(11);
  let y = startY + 6;
  const line = (label, value) => { doc.setFont('helvetica', 'bold'); doc.text(label, 14, y); doc.setFont('helvetica', 'normal'); doc.text(String(value ?? ''), 60, y); y += 8; };
  line('Date:', entry.date);
  line('Received from:', member.name);
  if (member.company_name) line('Company:', member.company_name);
  line('Category:', catLabel(entry.category));
  line('Amount:', `AED ${fmt(entry.amount)}`);
  if (entry.method) line('Method:', entry.method);
  if (entry.note) line('Note:', entry.note);
  y += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.text('Thank you for your payment.', 14, y);
  doc.save(`receipt-${receiptNumber(entry)}.pdf`);
}

export function downloadMemberStatementPDF({ member, ledger }) {
  const doc = new jsPDF();
  const startY = header(doc, `Member Statement — ${member.name}`, member.company_name || '');
  const sorted = [...(ledger || [])].sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  const body = sorted.map(l => {
    running += l.type === 'charge' ? Number(l.amount) : -Number(l.amount);
    return [l.date, l.type === 'charge' ? 'Charge' : 'Payment', catLabel(l.category), `AED ${fmt(l.amount)}`, l.note || '', `AED ${fmt(running)}`];
  });
  autoTable(doc, {
    startY,
    head: [['Date', 'Type', 'Category', 'Amount', 'Note', 'Running balance']],
    body,
    headStyles: { fillColor: [28, 36, 48] },
    styles: { fontSize: 9 },
  });
  doc.save(`statement-${member.name.replace(/\s+/g, '-')}.pdf`);
}
