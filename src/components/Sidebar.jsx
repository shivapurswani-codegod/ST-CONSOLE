import React from 'react';
import { Wallet, Landmark, CreditCard, CalendarDays, Users, Receipt, ShieldCheck, LogOut, ReceiptText } from 'lucide-react';
import { C } from '../lib/theme';
import { supabase } from '../supabaseClient';

export const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: Wallet },
  { key: 'venue', label: 'Venue Fee', icon: Landmark },
  { key: 'members', label: 'Members', icon: CreditCard },
  { key: 'receipts', label: 'Receipts', icon: ReceiptText },
  { key: 'events', label: 'Events', icon: CalendarDays },
  { key: 'renewals', label: 'Renewals', icon: Users },
  { key: 'misc', label: 'Miscellaneous', icon: Receipt },
  { key: 'settings', label: 'Settings', icon: ShieldCheck },
];

export default function Sidebar({ view, setView }) {
  return (
    <div style={{ width: 208, borderRight: `1px solid ${C.line}`, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
      <div className="stc-serif" style={{ fontSize: 18, fontWeight: 700, color: C.ink, padding: '4px 10px 18px' }}>ST Console</div>
      {NAV.map(n => (
        <button key={n.key} onClick={() => setView(n.key)} className="stc-navitem stc-sans"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 4, border: 'none',
            background: view === n.key ? C.brassSoft : 'transparent', color: view === n.key ? C.brassDeep : C.ink,
            fontSize: 13.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
          }}>
          <n.icon size={15} /> {n.label}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button onClick={() => supabase.auth.signOut()} className="stc-navitem stc-sans"
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 4, border: 'none', background: 'transparent', color: C.inkSoft, fontSize: 13, cursor: 'pointer' }}>
        <LogOut size={15} /> Sign out
      </button>
    </div>
  );
}
