import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { C, Card, PageHeader, TableHead, Field, Btn, inputStyle, fmt, todayISO } from '../lib/theme';

export default function Misc({ data, actions }) {
  const { miscEntries } = data;
  const [form, setForm] = useState({ date: todayISO(), type: 'debit', amount: '', note: '' });

  const add = () => {
    if (!form.amount) return;
    actions.addMisc({ date: form.date, type: form.type, amount: Number(form.amount), note: form.note });
    setForm({ date: todayISO(), type: 'debit', amount: '', note: '' });
  };

  const rows = [...miscEntries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="stc-fade">
      <PageHeader title="Miscellaneous" sub="One-off debits or credits to the chapter kitty" />
      <Card style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr auto', gap: 10, alignItems: 'end' }}>
          <Field label="Date"><input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Type">
            <select style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
          </Field>
          <Field label="Amount (AED)"><input style={inputStyle} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
          <Field label="Note"><input style={inputStyle} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          <Btn variant="primary" icon={Plus} onClick={add}>Add entry</Btn>
        </div>
      </Card>
      <Card style={{ overflow: 'hidden' }}>
        <TableHead cols={['Date', 'Type', 'Amount', 'Note', '']} />
        {rows.length === 0 && <div className="stc-sans" style={{ padding: 16, fontSize: 13, color: C.inkSoft }}>No entries yet.</div>}
        {rows.map(e => (
          <div key={e.id} className="stc-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr)) 32px', padding: '10px 14px', borderTop: `1px solid ${C.line}`, alignItems: 'center' }}>
            <div className="stc-sans" style={{ fontSize: 13 }}>{e.date}</div>
            <div className="stc-sans" style={{ fontSize: 13, textTransform: 'capitalize' }}>{e.type}</div>
            <div className="stc-mono" style={{ fontSize: 13, fontWeight: 700, color: e.type === 'credit' ? C.green : C.rust }}>{e.type === 'credit' ? '+' : '-'}{fmt(e.amount)}</div>
            <div className="stc-sans" style={{ fontSize: 13, color: C.inkSoft }}>{e.note}</div>
            <button onClick={() => actions.removeMisc(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft }}><Trash2 size={14} /></button>
          </div>
        ))}
      </Card>
    </div>
  );
}
