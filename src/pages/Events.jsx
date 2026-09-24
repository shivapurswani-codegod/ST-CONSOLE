import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { C, Card, PageHeader, TableHead, Field, Btn, inputStyle, fmt } from '../lib/theme';

export default function Events({ data, actions }) {
  const { events } = data;
  const [form, setForm] = useState({ name: '', date: '', budget: '', note: '' });

  const add = () => {
    if (!form.name || !form.date) return;
    actions.addEvent({ name: form.name, date: form.date, budget: Number(form.budget || 0), note: form.note });
    setForm({ name: '', date: '', budget: '', note: '' });
  };

  const rows = [...events].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="stc-fade">
      <PageHeader title="Events" sub="Monthly chapter events and their allocated budget" />
      <Card style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr auto', gap: 10, alignItems: 'end' }}>
          <Field label="Event name"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Date"><input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Budget (AED)"><input style={inputStyle} type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></Field>
          <Field label="Note"><input style={inputStyle} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          <Btn variant="primary" icon={Plus} onClick={add}>Add event</Btn>
        </div>
      </Card>
      <Card style={{ overflow: 'hidden' }}>
        <TableHead cols={['Date', 'Event', 'Budget', 'Note', '']} />
        {rows.length === 0 && <div className="stc-sans" style={{ padding: 16, fontSize: 13, color: C.inkSoft }}>No events logged yet.</div>}
        {rows.map(e => (
          <div key={e.id} className="stc-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr)) 32px', padding: '10px 14px', borderTop: `1px solid ${C.line}`, alignItems: 'center' }}>
            <div className="stc-sans" style={{ fontSize: 13 }}>{e.date}</div>
            <div className="stc-sans" style={{ fontSize: 13, fontWeight: 600 }}>{e.name}</div>
            <div className="stc-mono" style={{ fontSize: 13, color: C.rust }}>AED {fmt(e.budget)}</div>
            <div className="stc-sans" style={{ fontSize: 13, color: C.inkSoft }}>{e.note}</div>
            <button onClick={() => actions.removeEvent(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft }}><Trash2 size={14} /></button>
          </div>
        ))}
      </Card>
    </div>
  );
}
