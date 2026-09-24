import React, { useState } from 'react';
import { MessageCircle, Plus, Trash2 } from 'lucide-react';
import { C, Card, PageHeader, TableHead, Field, Btn, inputStyle, daysBetween } from '../lib/theme';

export default function Renewals({ data, actions, setComposer }) {
  const { renewalMembers, settings } = data;
  const [form, setForm] = useState({ name: '', phone: '', email: '', renewal_date: '', join_date: '' });

  const add = () => {
    if (!form.name) return;
    actions.addRenewalMember({ ...form });
    setForm({ name: '', phone: '', email: '', renewal_date: '', join_date: '' });
  };

  const rows = [...renewalMembers].sort((a, b) => (a.renewal_date || '').localeCompare(b.renewal_date || ''));

  return (
    <div className="stc-fade">
      <PageHeader title="Renewals & Members" sub="Members are flagged 60 days ahead of their renewal date" />
      <Card style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <Field label="Name"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Phone"><input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9715XXXXXXXX" /></Field>
          <Field label="Email"><input style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Renewal date"><input style={inputStyle} type="date" value={form.renewal_date} onChange={(e) => setForm({ ...form, renewal_date: e.target.value })} /></Field>
          <Field label="Join date"><input style={inputStyle} type="date" value={form.join_date} onChange={(e) => setForm({ ...form, join_date: e.target.value })} /></Field>
          <Btn variant="primary" icon={Plus} onClick={add}>Add member</Btn>
        </div>
      </Card>
      <Card style={{ overflow: 'hidden' }}>
        <TableHead cols={['Name', 'Phone', 'Email', 'Renewal', 'Status', '']} />
        {rows.length === 0 && <div className="stc-sans" style={{ padding: 16, fontSize: 13, color: C.inkSoft }}>No members added yet.</div>}
        {rows.map(m => {
          const days = m.renewal_date ? daysBetween(m.renewal_date) : null;
          const due = days !== null && days >= 0 && days <= 60;
          const overdue = days !== null && days < 0;
          return (
            <div key={m.id} className="stc-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr)) 32px', padding: '10px 14px', borderTop: `1px solid ${C.line}`, alignItems: 'center' }}>
              <div className="stc-sans" style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
              <div className="stc-sans" style={{ fontSize: 13, color: C.inkSoft }}>{m.phone}</div>
              <div className="stc-sans" style={{ fontSize: 13, color: C.inkSoft }}>{m.email}</div>
              <div className="stc-mono" style={{ fontSize: 13 }}>{m.renewal_date || '—'}</div>
              <div>
                {overdue && <span style={{ fontSize: 11, fontWeight: 700, color: C.rust, background: C.rustSoft, padding: '3px 8px', borderRadius: 20 }}>Overdue</span>}
                {due && !overdue && <span style={{ fontSize: 11, fontWeight: 700, color: C.brassDeep, background: C.brassSoft, padding: '3px 8px', borderRadius: 20 }}>Due in {days}d</span>}
                {!due && !overdue && days !== null && <span style={{ fontSize: 11, color: C.inkSoft }}>OK</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                {(due || overdue) && <button onClick={() => setComposer({ name: m.name, phone: m.phone, email: m.email, reason: 'membership renewal', amount: settings.renewal_fee })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.brass }}><MessageCircle size={14} /></button>}
                <button onClick={() => actions.removeRenewalMember(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft }}><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
