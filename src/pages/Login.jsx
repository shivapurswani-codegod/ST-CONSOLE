import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { C, Field, Btn, inputStyle, FontStyle } from '../lib/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) setErr(error.message);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <FontStyle />
      <div className="stc-fade" style={{ width: 380, maxWidth: '100%', background: C.paper, borderRadius: 8, padding: 32, border: `1px solid ${C.line}` }}>
        <div style={{ height: 3, width: 40, background: C.brass, marginBottom: 18, borderRadius: 2 }} />
        <div className="stc-serif" style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Sign in</div>
        <div className="stc-sans" style={{ fontSize: 13, color: C.inkSoft, marginBottom: 22 }}>BNI Insomniacs — Secretary/Treasurer console</div>
        <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Email"><input style={inputStyle} type="text" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Password"><input style={inputStyle} type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          {err && <div className="stc-sans" style={{ fontSize: 12, color: C.rust }}>{err}</div>}
          <Btn type="submit" variant="primary" disabled={busy} style={{ marginTop: 4, width: '100%' }}>{busy ? 'Signing in…' : 'Sign in'}</Btn>
        </form>
        <div className="stc-sans" style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 16 }}>
          No account yet? Create one for yourself in your Supabase project under Authentication → Users.
        </div>
      </div>
    </div>
  );
}
