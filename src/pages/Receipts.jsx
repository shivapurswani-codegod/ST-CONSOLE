import React, { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { C, Card, PageHeader, TableHead, Btn, inputStyle, fmt } from '../lib/theme';
import { catLabel } from '../lib/fees';
import { receiptNumber } from '../lib/reports';
import { downloadReceiptPDF } from '../lib/pdf';

export default function Receipts({ data }) {
  const { feeMembers } = data;
  const [search, setSearch] = useState('');

  const payments = useMemo(() => feeMembers.flatMap(m =>
    (m.ledger || []).filter(l => l.type === 'payment').map(l => ({ ...l, member: m }))
  ).sort((a, b) => b.date.localeCompare(a.date)), [feeMembers]);

  const filtered = payments.filter(p => !search || p.member.name.toLowerCase().includes(search.toLowerCase()) || (p.member.company_name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="stc-fade">
      <PageHeader title="Receipts" sub="Every recorded payment, with a downloadable PDF receipt"
        action={
          <div style={{ position: 'relative', width: 220 }}>
            <Search size={14} color={C.inkSoft} style={{ position: 'absolute', left: 9, top: 10 }} />
            <input style={{ ...inputStyle, paddingLeft: 28 }} placeholder="Search member or company" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        } />

      <Card style={{ overflow: 'hidden' }}>
        <TableHead cols={['Date', 'Receipt #', 'Member', 'Category', 'Amount', 'Method', '']} lastColWidth={90} />
        {filtered.length === 0 && <div className="stc-sans" style={{ padding: 16, fontSize: 13, color: C.inkSoft }}>No payments recorded yet.</div>}
        {filtered.map((p, i) => (
          <div key={p.id || i} className="stc-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr)) 90px', padding: '10px 14px', borderTop: `1px solid ${C.line}`, alignItems: 'center' }}>
            <div className="stc-sans" style={{ fontSize: 13 }}>{p.date}</div>
            <div className="stc-mono" style={{ fontSize: 12, color: C.inkSoft }}>{receiptNumber(p)}</div>
            <div className="stc-sans" style={{ fontSize: 13, fontWeight: 600 }}>{p.member.name}</div>
            <div className="stc-sans" style={{ fontSize: 13 }}>{catLabel(p.category)}</div>
            <div className="stc-mono" style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{fmt(p.amount)}</div>
            <div className="stc-sans" style={{ fontSize: 13, color: C.inkSoft }}>{p.method || '—'}</div>
            <button title="Download PDF receipt" onClick={() => downloadReceiptPDF({ member: p.member, entry: p })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.brass, justifySelf: 'end' }}><Download size={14} /></button>
          </div>
        ))}
      </Card>
    </div>
  );
}
