import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { C, Btn } from '../lib/theme';

export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', variant = 'danger', onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,36,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }} onClick={onCancel}>
      <div className="stc-fade" onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: 8, width: 380, maxWidth: '100%', padding: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
          <AlertTriangle size={20} color={C.rust} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="stc-serif" style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{title}</div>
            <div className="stc-sans" style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>{message}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant={variant} onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}
