import React, { useState } from 'react';
import { Check, Copy, Mail, MessageCircle, X } from 'lucide-react';
import { C, Field, Btn, Card, inputStyle, fmt } from '../lib/theme';

function buildMessage({ name, reason, amount, settings }) {
  const lines = [
    `Hi ${name || ''},`.trim(),
    '',
    `This is a reminder for your BNI ${reason} payment of AED ${fmt(amount)}.`,
    '',
    'You can pay via:',
  ];
  if (settings.careem_link) lines.push(`• Payment Link: ${settings.careem_link}`);
  if (settings.bank_name || settings.bank_account_number) {
    lines.push(`• Bank Transfer — ${settings.bank_name || 'Bank'}`);
    if (settings.bank_account_name) lines.push(`   A/C Name: ${settings.bank_account_name}`);
    if (settings.bank_account_number) lines.push(`   A/C No: ${settings.bank_account_number}`);
    if (settings.bank_iban) lines.push(`   IBAN: ${settings.bank_iban}`);
  }
  lines.push('', 'Kindly confirm once done. Thank you!');
  return lines.join('\n');
}

export default function PaymentComposer({ initial, settings, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [reason, setReason] = useState(initial?.reason || 'weekly venue fee');
  const [amount, setAmount] = useState(initial?.amount || '');
  const [copied, setCopied] = useState(false);

  const message = buildMessage({ name, reason, amount, settings });
  const copy = async () => {
    try { await navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) {}
  };
  const waLink = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  const mailLink = `mailto:${email}?subject=${encodeURIComponent('BNI ' + reason + ' — payment reminder')}&body=${encodeURIComponent(message)}`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,36,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }} onClick={onClose}>
      <div className="stc-fade stc-scroll" onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: 8, width: 520, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: 20, borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="stc-serif" style={{ fontSize: 17, fontWeight: 600, color: C.ink }}>Draft payment message</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Recipient name"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Amount (AED)"><input style={inputStyle} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
            <Field label="Phone (for WhatsApp, e.g. 9715XXXXXXXX)"><input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            <Field label="Email (for draft)"><input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          </div>
          <Field label="Reason"><input style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          <Field label="Message preview">
            <textarea readOnly value={message} rows={9} style={{ ...inputStyle, resize: 'vertical', fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, lineHeight: 1.5 }} />
          </Field>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn variant="outline" icon={copied ? Check : Copy} onClick={copy}>{copied ? 'Copied' : 'Copy text'}</Btn>
            <a href={waLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <Btn variant="brass" icon={MessageCircle} disabled={!phone}>Open WhatsApp draft</Btn>
            </a>
            <a href={mailLink} style={{ textDecoration: 'none' }}>
              <Btn variant="outline" icon={Mail} disabled={!email}>Open email draft</Btn>
            </a>
          </div>
          {(!settings.careem_link && !settings.bank_account_number) && (
            <div className="stc-sans" style={{ fontSize: 12, color: C.rust, background: C.rustSoft, padding: 8, borderRadius: 4 }}>
              Add your payment link and bank details in Settings so they appear in every message.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
