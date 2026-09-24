import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Check, Download, Plus, Trash2 } from 'lucide-react';
import { C, Card, PageHeader, Field, Btn, inputStyle, todayISO } from '../lib/theme';
import { categoryBalance, totalBalance } from '../lib/fees';

export default function Settings({ data, actions }) {
  const { settings, venueEntries, events, miscEntries, feeMembers, holidays } = data;
  const [holidayForm, setHolidayForm] = useState({ date: '', note: '' });
  const [holidayErr, setHolidayErr] = useState('');
  const addHoliday = async () => {
    if (!holidayForm.date) return;
    const { error } = await actions.addHoliday({ date: holidayForm.date, note: holidayForm.note });
    if (error) {
      setHolidayErr(error.message.includes('does not exist')
        ? 'The "holidays" table doesn\u2019t exist in your Supabase database yet — run the extra SQL snippet you were given for this feature, then try again.'
        : error.message);
    } else {
      setHolidayErr('');
      setHolidayForm({ date: '', note: '' });
    }
  };
  const [s, setS] = useState(settings);
  const [savedTick, setSavedTick] = useState(false);
  const saveSettings = () => {
    actions.updateSettings({
      weekly_fee_per_member: Number(s.weekly_fee_per_member), venue_paid_per_attendee: Number(s.venue_paid_per_attendee),
      visitor_fee: Number(s.visitor_fee), renewal_fee: Number(s.renewal_fee), active_members: Number(s.active_members),
      careem_link: s.careem_link, bank_name: s.bank_name, bank_account_name: s.bank_account_name,
      bank_account_number: s.bank_account_number, bank_iban: s.bank_iban,
    });
    setSavedTick(true); setTimeout(() => setSavedTick(false), 1200);
  };

  const [kittyInitial, setKittyInitial] = useState(settings.kitty_initial);
  const [kittySaved, setKittySaved] = useState(false);
  const saveKitty = () => { actions.updateSettings({ kitty_initial: Number(kittyInitial) }); setKittySaved(true); setTimeout(() => setKittySaved(false), 1200); };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const venueSheet = venueEntries.map(e => ({
      Date: e.date, Attendance: e.attendance, Visitors: e.visitors,
      'Visitor fee income': e.visitors * s.visitor_fee, 'Paid to venue': e.attendance * s.venue_paid_per_attendee, Note: e.note,
    }));
    const eventsSheet = events.map(e => ({ Date: e.date, Event: e.name, Budget: e.budget, Note: e.note }));
    const membersSheet = feeMembers.map(m => ({
      Name: m.name, 'Company Name': m.company_name, Email: m.email, Phone: m.phone, Status: m.active ? 'Active' : 'Disabled',
      'Meeting Fee Due': categoryBalance(m.ledger, 'meeting'), 'Social Event Due': categoryBalance(m.ledger, 'social'), 'Sponsorship Due': categoryBalance(m.ledger, 'sponsorship'), 'Total Due': totalBalance(m.ledger),
    }));
    const miscSheet = miscEntries.map(e => ({ Date: e.date, Type: e.type, Amount: e.amount, Note: e.note }));
    const summarySheet = [
      { Field: 'Starting kitty amount', Value: settings.kitty_initial },
      { Field: 'Weekly fee per member', Value: s.weekly_fee_per_member },
      { Field: 'Paid to venue per attendee', Value: s.venue_paid_per_attendee },
      { Field: 'Visitor fee', Value: s.visitor_fee },
      { Field: 'Renewal fee', Value: s.renewal_fee },
      { Field: 'Active members', Value: s.active_members },
      { Field: 'Payment link', Value: s.careem_link },
      { Field: 'Bank name', Value: s.bank_name },
      { Field: 'Account name', Value: s.bank_account_name },
      { Field: 'Account number', Value: s.bank_account_number },
      { Field: 'IBAN', Value: s.bank_iban },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summarySheet), 'Summary & Settings');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(venueSheet), 'Venue Fee');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eventsSheet), 'Events');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(membersSheet), 'Member Fees');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(miscSheet), 'Miscellaneous');
    XLSX.writeFile(wb, `st-console-report-${todayISO()}.xlsx`);
  };

  return (
    <div className="stc-fade" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <PageHeader title="Settings" sub="Fees, payment details, and reporting" />

      <Card style={{ padding: 18 }}>
        <div className="stc-serif" style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: C.ink }}>Fees & estimates</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Weekly fee per member (AED)"><input style={inputStyle} type="number" value={s.weekly_fee_per_member} onChange={(e) => setS({ ...s, weekly_fee_per_member: Number(e.target.value) })} /></Field>
          <Field label="Paid to venue per attendee (AED)"><input style={inputStyle} type="number" value={s.venue_paid_per_attendee} onChange={(e) => setS({ ...s, venue_paid_per_attendee: Number(e.target.value) })} /></Field>
          <Field label="Visitor fee (AED)"><input style={inputStyle} type="number" value={s.visitor_fee} onChange={(e) => setS({ ...s, visitor_fee: Number(e.target.value) })} /></Field>
          <Field label="Renewal fee (AED)"><input style={inputStyle} type="number" value={s.renewal_fee} onChange={(e) => setS({ ...s, renewal_fee: Number(e.target.value) })} /></Field>
          <Field label="Active members (for weekly estimate)"><input style={inputStyle} type="number" value={s.active_members} onChange={(e) => setS({ ...s, active_members: Number(e.target.value) })} /></Field>
        </div>
      </Card>

      <Card style={{ padding: 18 }}>
        <div className="stc-serif" style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: C.ink }}>Payment details</div>
        <div className="stc-sans" style={{ fontSize: 12, color: C.inkSoft, marginBottom: 10 }}>These appear automatically in every payment message draft.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Payment link"><input style={inputStyle} value={s.careem_link} onChange={(e) => setS({ ...s, careem_link: e.target.value })} /></Field>
          <Field label="Bank name"><input style={inputStyle} value={s.bank_name} onChange={(e) => setS({ ...s, bank_name: e.target.value })} /></Field>
          <Field label="Account name"><input style={inputStyle} value={s.bank_account_name} onChange={(e) => setS({ ...s, bank_account_name: e.target.value })} /></Field>
          <Field label="Account number"><input style={inputStyle} value={s.bank_account_number} onChange={(e) => setS({ ...s, bank_account_number: e.target.value })} /></Field>
          <Field label="IBAN"><input style={inputStyle} value={s.bank_iban} onChange={(e) => setS({ ...s, bank_iban: e.target.value })} /></Field>
        </div>
      </Card>

      <Btn variant="primary" icon={savedTick ? Check : undefined} onClick={saveSettings} style={{ alignSelf: 'flex-start' }}>{savedTick ? 'Saved' : 'Save settings'}</Btn>

      <Card style={{ padding: 18 }}>
        <div className="stc-serif" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: C.ink }}>Starting kitty balance</div>
        <div className="stc-sans" style={{ fontSize: 12, color: C.inkSoft, marginBottom: 12 }}>
          This is the base amount the running balance is calculated from. Change it if the original entry was wrong, or after reconciling with actual bank/cash records.
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
          <Field label="Amount (AED)"><input style={{ ...inputStyle, width: 180 }} type="number" value={kittyInitial} onChange={(e) => setKittyInitial(e.target.value)} /></Field>
          <Btn variant="outline" icon={kittySaved ? Check : undefined} onClick={saveKitty}>{kittySaved ? 'Saved' : 'Update'}</Btn>
        </div>
      </Card>

      <Card style={{ padding: 18 }}>
        <div className="stc-serif" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: C.ink }}>Holidays</div>
        <div className="stc-sans" style={{ fontSize: 12, color: C.inkSoft, marginBottom: 14 }}>
          Mark dates with no meeting (e.g. public holidays). The meeting-fee accrual skips these Wednesdays entirely — no charge gets posted for that date, for any member.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, alignItems: 'end', marginBottom: 14 }}>
          <Field label="Date"><input style={inputStyle} type="date" value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} /></Field>
          <Field label="Note (optional)"><input style={inputStyle} placeholder="e.g. National Day" value={holidayForm.note} onChange={(e) => setHolidayForm({ ...holidayForm, note: e.target.value })} /></Field>
          <Btn variant="primary" icon={Plus} onClick={addHoliday}>Add</Btn>
        </div>
        {holidayErr && <div className="stc-sans" style={{ fontSize: 12, color: C.rust, marginBottom: 10 }}>{holidayErr}</div>}
        {holidays.length === 0 && <div className="stc-sans" style={{ fontSize: 12.5, color: C.inkSoft }}>No holidays marked yet.</div>}
        {holidays.map(h => (
          <div key={h.id} className="stc-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 4px', borderTop: `1px solid ${C.line}` }}>
            <div className="stc-sans" style={{ fontSize: 13 }}>{h.date} {h.note && <span style={{ color: C.inkSoft }}>— {h.note}</span>}</div>
            <button onClick={() => actions.removeHoliday(h.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft }}><Trash2 size={14} /></button>
          </div>
        ))}
      </Card>

      <Card style={{ padding: 18 }}>
        <div className="stc-serif" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: C.ink }}>Reporting & handover</div>
        <div className="stc-sans" style={{ fontSize: 12, color: C.inkSoft, marginBottom: 14 }}>
          Download a full Excel report any time. Since your data now lives in a real database, handing the role to another member is simpler than before — just create them a login in Supabase (Authentication → Add user) so they can sign in to this same console; there's nothing to import or transfer.
        </div>
        <Btn variant="brass" icon={Download} onClick={exportExcel}>Download Excel report</Btn>
      </Card>
    </div>
  );
}
