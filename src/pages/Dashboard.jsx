import React from 'react';
import { ArrowDownRight, ArrowUpRight, MessageCircle } from 'lucide-react';
import { C, Card, PageHeader, StatCard, LedgerTape, fmt, todayISO, daysBetween } from '../lib/theme';
import { catLabel, totalBalance } from '../lib/fees';

export default function Dashboard({ data, kitty, setView, setComposer }) {
  const { settings, venueEntries, events, miscEntries, renewalMembers, feeMembers } = data;

  const weeklyEstimate = settings.active_members * settings.weekly_fee_per_member;
  const upcomingEvents = events.filter(e => e.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const upcomingRenewals = renewalMembers
    .map(m => ({ ...m, days: m.renewal_date ? daysBetween(m.renewal_date) : null }))
    .filter(m => m.days !== null && m.days >= 0 && m.days <= 60)
    .sort((a, b) => a.days - b.days);
  const newMembers = renewalMembers.filter(m => m.join_date && daysBetween(m.join_date) >= -30 && daysBetween(m.join_date) <= 0);
  const totalOutstanding = feeMembers.reduce((s, m) => s + Math.max(0, totalBalance(m.ledger)), 0);

  const feed = [
    ...venueEntries.map(e => ({ date: e.date, label: `Venue — ${e.attendance || 0} attendance, ${e.visitors || 0} visitors`, amt: (e.visitors || 0) * settings.visitor_fee - (e.attendance || 0) * settings.venue_paid_per_attendee })),
    ...feeMembers.flatMap(m => (m.ledger || []).filter(l => l.type === 'payment').map(l => ({ date: l.date, label: `${m.name} — ${catLabel(l.category)} payment`, amt: Number(l.amount) }))),
    ...events.map(e => ({ date: e.date, label: `Event — ${e.name}`, amt: -Number(e.budget || 0) })),
    ...miscEntries.map(e => ({ date: e.date, label: e.note || 'Miscellaneous', amt: e.type === 'credit' ? Number(e.amount) : -Number(e.amount) })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <div className="stc-fade">
      <PageHeader title="Dashboard" sub="Chapter kitty overview" />
      <div style={{ maxWidth: 420, marginBottom: 22 }}><LedgerTape balance={kitty} /></div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Members outstanding" value={`AED ${fmt(totalOutstanding)}`} hint={`${feeMembers.filter(m => totalBalance(m.ledger) > 0).length} with a balance due`} onClick={() => setView('members')} />
        <StatCard label="Venue fee / week (est.)" value={`AED ${fmt(weeklyEstimate)}`} hint={`${settings.active_members} active members`} onClick={() => setView('venue')} />
        <StatCard label="Upcoming events" value={upcomingEvents.length} hint={upcomingEvents[0] ? `Next: ${upcomingEvents[0].name}` : 'None scheduled'} onClick={() => setView('events')} />
        <StatCard label="Renewals due (60d)" value={upcomingRenewals.length} hint={upcomingRenewals[0] ? `${upcomingRenewals[0].name} in ${upcomingRenewals[0].days}d` : 'None due'} onClick={() => setView('renewals')} />
        <StatCard label="New members (30d)" value={newMembers.length} hint="Recently joined" onClick={() => setView('renewals')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
        <Card style={{ padding: 18 }}>
          <div className="stc-serif" style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: C.ink }}>Recent activity</div>
          {feed.length === 0 && <div className="stc-sans" style={{ fontSize: 13, color: C.inkSoft }}>No entries yet.</div>}
          {feed.map((f, i) => (
            <div key={i} className="stc-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 4px', borderTop: i ? `1px solid ${C.line}` : 'none' }}>
              <div className="stc-sans" style={{ fontSize: 13, color: C.ink }}>{f.label}<div style={{ fontSize: 11, color: C.inkSoft }}>{f.date}</div></div>
              <div className="stc-mono" style={{ fontSize: 13, fontWeight: 700, color: f.amt >= 0 ? C.green : C.rust, display: 'flex', alignItems: 'center', gap: 3 }}>
                {f.amt >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} AED {fmt(Math.abs(f.amt))}
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ padding: 18 }}>
          <div className="stc-serif" style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: C.ink }}>Renewals due soon</div>
          {upcomingRenewals.length === 0 && <div className="stc-sans" style={{ fontSize: 13, color: C.inkSoft }}>Nothing due in the next 60 days.</div>}
          {upcomingRenewals.slice(0, 5).map(m => (
            <div key={m.id} className="stc-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px' }}>
              <div className="stc-sans" style={{ fontSize: 13, color: C.ink }}>{m.name}<div style={{ fontSize: 11, color: C.inkSoft }}>due in {m.days}d</div></div>
              <button onClick={() => setComposer({ name: m.name, phone: m.phone, email: m.email, reason: 'membership renewal', amount: settings.renewal_fee })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink }}><MessageCircle size={14} /></button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
