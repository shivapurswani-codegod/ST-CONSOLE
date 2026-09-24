import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import { C, FontStyle } from './lib/theme';
import { totalBalance } from './lib/fees';
import { LOGO_DATA_URI } from './lib/logo';
import { useConsoleData } from './lib/useConsoleData';
import Sidebar from './components/Sidebar';
import PaymentComposer from './components/PaymentComposer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Venue from './pages/Venue';
import Members from './pages/Members';
import Receipts from './pages/Receipts';
import Events from './pages/Events';
import Renewals from './pages/Renewals';
import Misc from './pages/Misc';
import Settings from './pages/Settings';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out
  const [view, setView] = useState('dashboard');
  const [composer, setComposer] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  const console_ = useConsoleData(!!session);

  const kitty = useMemo(() => {
    if (!console_.settings) return 0;
    const venueNet = console_.venueEntries.reduce((s, e) =>
      s + Number(e.visitors) * console_.settings.visitor_fee - Number(e.attendance) * console_.settings.venue_paid_per_attendee, 0);
    const memberPayments = console_.feeMembers.reduce((s, m) => s + (m.ledger || []).filter(l => l.type === 'payment').reduce((a, l) => a + Number(l.amount), 0), 0);
    const eventsSpend = console_.events.reduce((s, e) => s + Number(e.budget || 0), 0);
    const miscNet = console_.miscEntries.reduce((s, e) => s + (e.type === 'credit' ? Number(e.amount) : -Number(e.amount)), 0);
    return Number(console_.settings.kitty_initial) + venueNet + memberPayments - eventsSpend + miscNet;
  }, [console_]);

  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.paper }}>
        <FontStyle />
        <Loader2 size={22} color={C.inkSoft} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) return <Login />;

  if (console_.loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.paper }}>
        <FontStyle />
        <Loader2 size={22} color={C.inkSoft} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!console_.settings) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.paper, padding: 24 }}>
        <FontStyle />
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div className="stc-serif" style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Couldn't load the console</div>
          <div className="stc-sans" style={{ fontSize: 13, color: C.inkSoft, marginBottom: 16 }}>
            {console_.loadError || 'The database connection failed.'}
          </div>
          <button onClick={() => console_.refetch()} className="stc-sans"
            style={{ padding: '9px 16px', borderRadius: 4, background: C.ink, color: C.paper, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const data = {
    settings: console_.settings, venueEntries: console_.venueEntries, events: console_.events,
    miscEntries: console_.miscEntries, renewalMembers: console_.renewalMembers, feeMembers: console_.feeMembers,
    holidays: console_.holidays,
  };
  const actions = console_;

  const pages = {
    dashboard: <Dashboard data={data} kitty={kitty} setView={setView} setComposer={setComposer} />,
    venue: <Venue data={data} actions={actions} />,
    members: <Members data={data} actions={actions} setComposer={setComposer} />,
    receipts: <Receipts data={data} />,
    events: <Events data={data} actions={actions} />,
    renewals: <Renewals data={data} actions={actions} setComposer={setComposer} />,
    misc: <Misc data={data} actions={actions} />,
    settings: <Settings data={data} actions={actions} />,
  };

  return (
    <div style={{ minHeight: '100vh', background: C.paper, display: 'flex', position: 'relative' }}>
      <FontStyle />
      <img src={LOGO_DATA_URI} alt="BNI Insomniacs" style={{ position: 'absolute', top: 14, right: 18, width: '2cm', height: '2cm', objectFit: 'contain', zIndex: 40 }} />
      {composer && <PaymentComposer initial={composer} settings={console_.settings} onClose={() => setComposer(null)} />}
      <Sidebar view={view} setView={setView} />
      <div className="stc-scroll" style={{ flex: 1, padding: '96px 28px 28px 28px', overflow: 'auto' }}>
        {pages[view]}
      </div>
    </div>
  );
}
