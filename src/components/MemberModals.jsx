import React, { useState } from 'react';
import { X } from 'lucide-react';
import { C, Field, Btn, inputStyle, todayISO } from '../lib/theme';

export function LedgerModal({ title, type, categories, onClose, onSave }) {
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState(categories[0].key);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [note, setNote] = useState('');
  const save = () => {
    if (!amount) return;
    onSave({ date, type, category, amount: Number(amount), method: type === 'payment' ? method : '', note });
    onClose();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,36,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 55, padding: 16 }} onClick={onClose}>
      <div className="stc-fade" onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: 8, width: 400, maxWidth: '100%' }}>
        <div style={{ padding: 18, borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="stc-serif" style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft }}><X size={18} /></button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Category">
            <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Date"><input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Amount (AED)"><input style={inputStyle} type="number" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          </div>
          {type === 'payment' && <Field label="Method (optional)"><input style={inputStyle} placeholder="Cash / Bank transfer / Careem" value={method} onChange={(e) => setMethod(e.target.value)} /></Field>}
          <Field label="Note (optional)"><input style={inputStyle} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <Btn variant="primary" onClick={save} style={{ marginTop: 4 }}>{type === 'payment' ? 'Record payment' : 'Add charge'}</Btn>
        </div>
      </div>
    </div>
  );
}

export function MemberEditModal({ member, onClose, onSave }) {
  const [form, setForm] = useState({
    name: member?.name || '', companyName: member?.company_name || '',
    email: member?.email || '', phone: member?.phone || '',
  });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,36,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 55, padding: 16 }} onClick={onClose}>
      <div className="stc-fade" onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: 8, width: 420, maxWidth: '100%' }}>
        <div style={{ padding: 18, borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="stc-serif" style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{member ? 'Edit member' : 'Add member'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft }}><X size={18} /></button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Name"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Company name"><input style={inputStyle} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></Field>
          <Field label="Email"><input style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9715XXXXXXXX" /></Field>
          <Btn variant="primary" disabled={!form.name} onClick={() => { onSave(form); onClose(); }} style={{ marginTop: 4 }}>Save</Btn>
        </div>
      </div>
    </div>
  );
}
