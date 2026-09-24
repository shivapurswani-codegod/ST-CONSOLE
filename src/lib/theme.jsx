import React, { useEffect, useState } from 'react';

export const C = {
  paper: '#FAF8F3',
  paperDim: '#F1EDE3',
  card: '#FFFFFF',
  ink: '#1C2430',
  inkSoft: '#5B6470',
  brass: '#9C7B24',
  brassDeep: '#7C6019',
  brassSoft: '#EFE4C6',
  green: '#2F6B4F',
  greenSoft: '#E4EEE8',
  rust: '#A8432F',
  rustSoft: '#F3E4E0',
  line: '#DFD9C9',
};

export const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0; background: ${C.paper}; }
    .stc-serif { font-family: 'Lora', serif; }
    .stc-sans { font-family: 'Inter', sans-serif; }
    .stc-mono { font-family: 'JetBrains Mono', monospace; }
    input, select, textarea, button { font-family: 'Inter', sans-serif; }
    .stc-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .stc-scroll::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 3px; }
    .stc-navitem:hover { background: ${C.paperDim}; }
    .stc-row:hover { background: ${C.paperDim}; }
    @keyframes stc-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .stc-fade { animation: stc-fade 0.25s ease-out; }
    .stc-btn { transition: filter 0.15s ease, transform 0.1s ease; }
    .stc-btn:active { transform: scale(0.98); }
  `}</style>
);

export const inputStyle = {
  border: `1px solid ${C.line}`,
  borderRadius: 4,
  padding: '8px 10px',
  fontSize: 14,
  color: C.ink,
  background: C.paper,
  outline: 'none',
  width: '100%',
};

export const Field = ({ label, children }) => (
  <label className="stc-sans" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: C.inkSoft, fontWeight: 600 }}>
    {label}
    {children}
  </label>
);

export const Btn = ({ children, onClick, variant = 'primary', icon: Icon, style, type = 'button', disabled, title }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center',
    padding: '9px 14px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
    border: '1px solid transparent', opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { background: C.ink, color: C.paper },
    brass: { background: C.brass, color: '#fff' },
    outline: { background: 'transparent', color: C.ink, border: `1px solid ${C.line}` },
    danger: { background: 'transparent', color: C.rust, border: `1px solid ${C.rustSoft}` },
    ghost: { background: 'transparent', color: C.inkSoft },
  };
  return (
    <button type={type} title={title} disabled={disabled} onClick={onClick} className="stc-sans stc-btn" style={{ ...base, ...variants[variant], ...style }}>
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
};

export const Card = React.forwardRef(({ children, style }, ref) => (
  <div ref={ref} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 6, ...style }}>{children}</div>
));

export function PageHeader({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
      <div>
        <div className="stc-serif" style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>{title}</div>
        {sub && <div className="stc-sans" style={{ fontSize: 13, color: C.inkSoft, marginTop: 3 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, onClick }) {
  return (
    <Card style={{ padding: 16, cursor: onClick ? 'pointer' : 'default' }}>
      <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="stc-sans" style={{ fontSize: 11.5, color: C.inkSoft, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div className="stc-mono" style={{ fontSize: 22, fontWeight: 700, color: C.ink }}>{value}</div>
        {hint && <div className="stc-sans" style={{ fontSize: 12, color: C.inkSoft }}>{hint}</div>}
      </div>
    </Card>
  );
}

export function TableHead({ cols, lastColWidth = 32 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols.length - 1},minmax(0,1fr)) ${lastColWidth}px`, padding: '10px 14px', background: C.paperDim, borderBottom: `1px solid ${C.line}` }}>
      {cols.map((c, i) => <div key={i} className="stc-sans" style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4 }}>{c}</div>)}
    </div>
  );
}

export function LedgerTape({ balance }) {
  const [display, setDisplay] = useState(balance);
  useEffect(() => {
    const start = display, end = balance, dur = 500, t0 = performance.now();
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setDisplay(start + (end - start) * p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [balance]);

  return (
    <div style={{ background: C.ink, borderRadius: 8, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `repeating-linear-gradient(90deg, ${C.brass} 0 10px, transparent 10px 18px)` }} />
      <div className="stc-sans" style={{ fontSize: 11, letterSpacing: 1.2, color: '#9AA5B1', textTransform: 'uppercase', marginBottom: 6 }}>Chapter kitty balance</div>
      <div className="stc-mono" style={{ fontSize: 40, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>
        AED {fmt(display)}
      </div>
    </div>
  );
}

export const fmt = (n) => (Number(n) || 0).toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const daysBetween = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const t = new Date(todayISO() + 'T00:00:00');
  return Math.round((d - t) / 86400000);
};
