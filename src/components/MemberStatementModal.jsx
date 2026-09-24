import React from 'react';
import { Download, X } from 'lucide-react';
import { C, Btn, fmt } from '../lib/theme';
import { catLabel } from '../lib/fees';
import { downloadMemberStatementPDF } from '../lib/pdf';

export default function MemberStatementModal({ member, onClose }) {
  const sorted = [...(member.ledger || [])].sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  const rows = sorted.map(l => {
    running += l.type === 'charge' ? Number(l.amount) : -Number(l.amount);
    return { ...l, running };
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,36,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 55, padding: 16 }} onClick={onClose}>
      <div className="stc-fade stc-scroll" onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: 8, width: 640, maxWidth: '100%', maxHeight: '85vh', overflow: 'auto' }}>
        <div style={{ padding: 18, borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="stc-serif" style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{member.name} — statement</div>
            <div className="stc-sans" style={{ fontSize: 12, color: C.inkSoft }}>{member.company_name}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Btn variant="outline" icon={Download} onClick={() => downloadMemberStatementPDF({ member, ledger: member.ledger })}>PDF</Btn>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft }}><X size={18} /></button>
          </div>
        </div>
        <div style={{ padding: '4px 18px 18px' }}>
          {rows.length === 0 && <div className="stc-sans" style={{ fontSize: 13, color: C.inkSoft, padding: '16px 0' }}>No transactions yet.</div>}
          {rows.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.5fr) minmax(0,1fr)', fontSize: 12 }}>
              {['Date', 'Type', 'Category', 'Amount', 'Note', 'Running'].map(h => (
                <div key={h} className="stc-sans" style={{ fontWeight: 700, color: C.inkSoft, textTransform: 'uppercase', fontSize: 10.5, padding: '8px 6px', borderBottom: `1px solid ${C.line}` }}>{h}</div>
              ))}
              {rows.map((l, i) => (
                <React.Fragment key={l.id || i}>
                  <div className="stc-sans" style={{ padding: '7px 6px', borderTop: `1px solid ${C.line}` }}>{l.date}</div>
                  <div className="stc-sans" style={{ padding: '7px 6px', borderTop: `1px solid ${C.line}`, color: l.type === 'charge' ? C.rust : C.green }}>{l.type === 'charge' ? 'Charge' : 'Payment'}</div>
                  <div className="stc-sans" style={{ padding: '7px 6px', borderTop: `1px solid ${C.line}` }}>{catLabel(l.category)}</div>
                  <div className="stc-mono" style={{ padding: '7px 6px', borderTop: `1px solid ${C.line}` }}>{fmt(l.amount)}</div>
                  <div className="stc-sans" style={{ padding: '7px 6px', borderTop: `1px solid ${C.line}`, color: C.inkSoft }}>{l.note}</div>
                  <div className="stc-mono" style={{ padding: '7px 6px', borderTop: `1px solid ${C.line}`, fontWeight: 700 }}>{fmt(l.running)}</div>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
