import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { C, Card, PageHeader, TableHead, Field, Btn, inputStyle, fmt, todayISO } from '../lib/theme';

export default function Venue({ data, actions }) {
  const { settings, venueEntries } = data;
  const [form, setForm] = useState({ date: todayISO(), attendance: '', visitors: 0, note: '' });

  const add = () => {
    if (!form.date) return;
    actions.addVenueEntry({ date: form.date, attendance: Number(form.attendance || 0), visitors: Number(form.visitors || 0), note: form.note });
    setForm({ date: todayISO(), attendance: '', visitors: 0, note: '' });
  };

  const rows = [...venueEntries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="stc-fade">
      <PageHeader title="Venue Fee" sub={`Venue paid AED ${settings.venue_paid_per_attendee}/attendee · visitor fee AED ${settings.visitor_fee} (member fees are tracked on the Members page)`} />

      <Card style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 10 }}>
          <Field label="Meeting date"><input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Attendance (paid to venue)"><input style={inputStyle} type="number" value={form.attendance} onChange={(e) => setForm({ ...form, attendance: e.target.value })} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <Field label="Visitors"><input style={inputStyle} type="number" value={form.visitors} onChange={(e) => setForm({ ...form, visitors: e.target.value })} /></Field>
          <Field label="Note"><input style={inputStyle} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          <Btn variant="primary" icon={Plus} onClick={add}>Add week</Btn>
        </div>
      </Card>

      <Card style={{ overflow: 'hidden' }}>
        <TableHead cols={['Date', 'Attendance', 'Visitors', 'Visitor fee income', 'Paid to venue', 'Net', '']} />
        {rows.length === 0 && <div className="stc-sans" style={{ padding: 16, fontSize: 13, color: C.inkSoft }}>No weeks logged yet.</div>}
        {rows.map(e => {
          const collected = e.visitors * settings.visitor_fee;
          const paid = e.attendance * settings.venue_paid_per_attendee;
          return (
            <div key={e.id} className="stc-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr)) 32px', padding: '10px 14px', borderTop: `1px solid ${C.line}`, alignItems: 'center' }}>
              <div className="stc-sans" style={{ fontSize: 13 }}>{e.date}</div>
              <div className="stc-mono" style={{ fontSize: 13 }}>{e.attendance}</div>
              <div className="stc-mono" style={{ fontSize: 13 }}>{e.visitors}</div>
              <div className="stc-mono" style={{ fontSize: 13, color: C.green }}>{fmt(collected)}</div>
              <div className="stc-mono" style={{ fontSize: 13, color: C.rust }}>{fmt(paid)}</div>
              <div className="stc-mono" style={{ fontSize: 13, fontWeight: 700 }}>{fmt(collected - paid)}</div>
              <button onClick={() => actions.removeVenueEntry(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft }}><Trash2 size={14} /></button>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
