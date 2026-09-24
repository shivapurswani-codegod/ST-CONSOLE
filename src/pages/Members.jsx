import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { Ban, CalendarClock, CreditCard, Download, FileSpreadsheet, Image as ImageIcon, MessageCircle, Pencil, Plus, Power, ScrollText, Search, Trash2, Upload, UserPlus } from 'lucide-react';
import { C, Card, PageHeader, StatCard, TableHead, Btn, inputStyle, fmt, todayISO } from '../lib/theme';
import { FEE_CATEGORIES, categoryBalance, totalBalance } from '../lib/fees';
import { LedgerModal, MemberEditModal } from '../components/MemberModals';
import MemberStatementModal from '../components/MemberStatementModal';
import ConfirmModal from '../components/ConfirmModal';
import { currentMonthStr, memberMonthSnapshot, meetingsInMonth, monthLabel } from '../lib/reports';
import { downloadLiveSnapshotPDF, downloadMonthlyReportPDF } from '../lib/pdf';

const FILTERS = ['All', 'Active', 'Disabled', 'Overdue'];

export default function Members({ data, actions, setComposer }) {
  const members = data.feeMembers;
  const holidays = data.holidays || [];
  const [mode, setMode] = useState('current'); // 'current' | 'YYYY-MM'
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [ledgerModal, setLedgerModal] = useState(null);
  const [statementMemberId, setStatementMemberId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'disable' | 'delete', member }
  const [uploadMsg, setUploadMsg] = useState('');
  const fileRef = useRef(null);
  const tableRef = useRef(null);

  const isMonthMode = mode !== 'current';

  const saveMember = (form) => {
    if (editing && editing !== 'new') {
      actions.updateFeeMember(editing.id, { name: form.name, company_name: form.companyName, email: form.email, phone: form.phone });
    } else {
      actions.addFeeMember({ name: form.name, company_name: form.companyName, email: form.email, phone: form.phone, active: true });
    }
  };

  // Balances for the table + exports: live totals in 'current' mode, or that month's closing balance.
  const rows = useMemo(() => members.map(m => {
    if (isMonthMode) {
      const snap = memberMonthSnapshot(m.ledger, mode);
      return {
        member: m, meeting: snap.byCategory.meeting.closing, social: snap.byCategory.social.closing,
        sponsorship: snap.byCategory.sponsorship.closing, total: snap.closing,
      };
    }
    return {
      member: m, meeting: categoryBalance(m.ledger, 'meeting'), social: categoryBalance(m.ledger, 'social'),
      sponsorship: categoryBalance(m.ledger, 'sponsorship'), total: totalBalance(m.ledger),
    };
  }), [members, mode, isMonthMode]);

  const filtered = rows.filter(r => {
    const m = r.member;
    if (filter === 'Active' && !m.active) return false;
    if (filter === 'Disabled' && m.active) return false;
    if (filter === 'Overdue' && r.total <= 0) return false;
    if (search && !(`${m.name} ${m.company_name || ''}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }).sort((a, b) => b.total - a.total);

  const totalOutstanding = rows.reduce((s, r) => s + Math.max(0, r.total), 0);
  const collectMonth = isMonthMode ? mode : todayISO().slice(0, 7);
  const collectedThisMonth = members.reduce((s, m) => s + (m.ledger || []).filter(l => l.type === 'payment' && l.date.slice(0, 7) === collectMonth).reduce((a, l) => a + Number(l.amount), 0), 0);
  const overdueCount = rows.filter(r => r.total > 0).length;

  const meetingInfo = isMonthMode ? meetingsInMonth(mode, holidays) : meetingsInMonth(todayISO().slice(0, 7), holidays);

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const templateRows = [{
      Name: 'Jane Doe', 'Company Name': 'Acme Trading', Email: 'jane@acme.com', Phone: '9715XXXXXXXX', Status: 'Active',
      'Opening Meeting Fee Due': 0, 'Opening Social Fee Due': 0, 'Opening Sponsorship Due': 0,
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(templateRows), 'Members');
    XLSX.writeFile(wb, 'st-console-members-template.xlsx');
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const sheetRows = rows.map(r => ({
      Name: r.member.name, 'Company Name': r.member.company_name || '', Email: r.member.email || '', Phone: r.member.phone || '',
      Status: r.member.active ? 'Active' : 'Disabled',
      'Meeting Fee': r.meeting, 'Social Event': r.social, Sponsorship: r.sponsorship, 'Total Due': r.total,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetRows), isMonthMode ? monthLabel(mode) : 'Current');
    XLSX.writeFile(wb, `st-console-members-${isMonthMode ? mode : todayISO()}.xlsx`);
  };

  const exportPDF = () => {
    if (isMonthMode) {
      const reportRows = rows.map(r => {
        const snap = memberMonthSnapshot(r.member.ledger, mode);
        return { name: r.member.name, company: r.member.company_name, ...snap };
      });
      downloadMonthlyReportPDF({ monthLabelText: monthLabel(mode), rows: reportRows });
    } else {
      downloadLiveSnapshotPDF({ rows: rows.map(r => ({ name: r.member.name, company: r.member.company_name, meeting: r.meeting, social: r.social, sponsorship: r.sponsorship, total: r.total, status: r.member.active ? 'Active' : 'Disabled' })) });
    }
  };

  const exportImage = async () => {
    if (!tableRef.current) return;
    const canvas = await html2canvas(tableRef.current, { backgroundColor: '#FFFFFF', scale: 2 });
    const link = document.createElement('a');
    link.download = `st-console-members-${isMonthMode ? mode : todayISO()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet);
        const uploadRows = rawRows.map(row => {
          const name = String(row.Name || row.name || '').trim();
          const companyName = String(row['Company Name'] || row.CompanyName || row.company || '').trim();
          const email = String(row.Email || row.email || '').trim();
          const phone = String(row.Phone || row.phone || '').trim();
          const status = String(row.Status || row.status || 'Active').trim().toLowerCase();
          const active = status !== 'disabled';
          const openMeeting = Number(row['Opening Meeting Fee Due'] || 0);
          const openSocial = Number(row['Opening Social Fee Due'] || 0);
          const openSponsor = Number(row['Opening Sponsorship Due'] || 0);
          const openingCharges = [
            openMeeting > 0 ? { date: todayISO(), type: 'charge', category: 'meeting', amount: openMeeting, note: 'Opening balance import' } : null,
            openSocial > 0 ? { date: todayISO(), type: 'charge', category: 'social', amount: openSocial, note: 'Opening balance import' } : null,
            openSponsor > 0 ? { date: todayISO(), type: 'charge', category: 'sponsorship', amount: openSponsor, note: 'Opening balance import' } : null,
          ].filter(Boolean);
          return { name, companyName, email, phone, active, openingCharges };
        }).filter(r => r.name);
        const { added, updated } = await actions.bulkUpsertFeeMembers(uploadRows);
        setUploadMsg(`Imported: ${added} added, ${updated} updated.`);
      } catch (err) {
        setUploadMsg('Could not read that file — please use the downloaded template.');
      }
      setTimeout(() => setUploadMsg(''), 4000);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="stc-fade">
      <PageHeader title="Members" sub="Meeting, social event, and sponsorship fees per member"
        action={<Btn variant="primary" icon={UserPlus} onClick={() => setEditing('new')}>Add member</Btn>} />

      <Card style={{ padding: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setMode('current')} className="stc-sans stc-btn"
            style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: `1px solid ${!isMonthMode ? C.brass : C.line}`, background: !isMonthMode ? C.brassSoft : 'transparent', color: !isMonthMode ? C.brassDeep : C.inkSoft }}>
            Current
          </button>
          <input type="month" style={{ ...inputStyle, width: 160 }} value={isMonthMode ? mode : ''} onChange={(e) => e.target.value && setMode(e.target.value)} />
          <div className="stc-sans" style={{ fontSize: 12, color: C.inkSoft, marginLeft: 4 }}>
            <CalendarClock size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
            {meetingInfo.effective} meeting{meetingInfo.effective === 1 ? '' : 's'} {isMonthMode ? `in ${monthLabel(mode)}` : 'this month'}
            {meetingInfo.excluded > 0 && ` (${meetingInfo.excluded} holiday${meetingInfo.excluded === 1 ? '' : 's'} excluded)`}
          </div>
          <div style={{ flex: 1 }} />
          <Btn variant="outline" icon={Download} onClick={exportExcel}>Excel</Btn>
          <Btn variant="outline" icon={Download} onClick={exportPDF}>PDF</Btn>
          <Btn variant="brass" icon={ImageIcon} onClick={exportImage}>Image</Btn>
        </div>
        {isMonthMode && (
          <div className="stc-sans" style={{ fontSize: 12, color: C.inkSoft, marginTop: 8 }}>
            Showing balances as of the end of {monthLabel(mode)} (opening + that month's charges − that month's payments).
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        <StatCard label={isMonthMode ? `Outstanding — ${monthLabel(mode)}` : 'Total outstanding'} value={`AED ${fmt(totalOutstanding)}`} />
        <StatCard label={isMonthMode ? `Collected — ${monthLabel(mode)}` : 'Collected this month'} value={`AED ${fmt(collectedThisMonth)}`} />
        <StatCard label="Members overdue" value={overdueCount} />
      </div>

      <Card style={{ padding: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Btn variant="outline" icon={FileSpreadsheet} onClick={downloadTemplate}>Download upload template</Btn>
          <Btn variant="outline" icon={Upload} onClick={() => fileRef.current?.click()}>Bulk upload (Excel)</Btn>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleBulkUpload} style={{ display: 'none' }} />
        </div>
        {uploadMsg && <div className="stc-sans" style={{ fontSize: 12, color: C.green, marginTop: 8 }}>{uploadMsg}</div>}
      </Card>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className="stc-sans stc-btn"
            style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: `1px solid ${filter === f ? C.brass : C.line}`, background: filter === f ? C.brassSoft : 'transparent', color: filter === f ? C.brassDeep : C.inkSoft }}>
            {f}
          </button>
        ))}
        <div style={{ position: 'relative', marginLeft: 'auto', width: 220 }}>
          <Search size={14} color={C.inkSoft} style={{ position: 'absolute', left: 9, top: 10 }} />
          <input style={{ ...inputStyle, paddingLeft: 28, width: '100%' }} placeholder="Search name or company" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card style={{ overflow: 'hidden' }} ref={tableRef}>
        <TableHead cols={['Name', 'Company', 'Meeting', 'Social', 'Sponsorship', 'Total due', 'Status', '']} lastColWidth={144} />
        {filtered.length === 0 && <div className="stc-sans" style={{ padding: 16, fontSize: 13, color: C.inkSoft }}>No members match this view.</div>}
        {filtered.map(r => {
          const m = r.member;
          return (
            <div key={m.id} className="stc-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr)) 144px', padding: '10px 14px', borderTop: `1px solid ${C.line}`, alignItems: 'center' }}>
              <div className="stc-sans" style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
              <div className="stc-sans" style={{ fontSize: 13, color: C.inkSoft }}>{m.company_name}</div>
              <div className="stc-mono" style={{ fontSize: 13 }}>{fmt(r.meeting)}</div>
              <div className="stc-mono" style={{ fontSize: 13 }}>{fmt(r.social)}</div>
              <div className="stc-mono" style={{ fontSize: 13 }}>{fmt(r.sponsorship)}</div>
              <div className="stc-mono" style={{ fontSize: 13, fontWeight: 700, color: r.total > 0 ? C.rust : C.green }}>{fmt(r.total)}</div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: m.active ? C.green : C.inkSoft, background: m.active ? C.greenSoft : C.paperDim, padding: '3px 8px', borderRadius: 20 }}>{m.active ? 'Active' : 'Disabled'}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                <button title="View statement" onClick={() => setStatementMemberId(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink }}><ScrollText size={14} /></button>
                <button title="Record payment" onClick={() => setLedgerModal({ member: m, type: 'payment' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.green }}><CreditCard size={14} /></button>
                <button title="Add charge" onClick={() => setLedgerModal({ member: m, type: 'charge' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.brass }}><Plus size={14} /></button>
                <button title="Message" onClick={() => setComposer({ name: m.name, phone: m.phone, email: m.email, reason: 'outstanding balance', amount: Math.max(0, r.total) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink }}><MessageCircle size={14} /></button>
                <button title="Edit" onClick={() => setEditing(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft }}><Pencil size={14} /></button>
                <button title={m.active ? 'Disable' : 'Enable'} onClick={() => m.active ? setConfirmAction({ type: 'disable', member: m }) : actions.toggleFeeMemberActive(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: m.active ? C.rust : C.green }}>{m.active ? <Ban size={14} /> : <Power size={14} />}</button>
                <button title="Remove" onClick={() => setConfirmAction({ type: 'delete', member: m })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft }}><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
      </Card>

      {editing && <MemberEditModal member={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={saveMember} />}
      {statementMemberId && (() => {
        const m = members.find(mm => mm.id === statementMemberId);
        return m ? <MemberStatementModal member={m} onClose={() => setStatementMemberId(null)} /> : null;
      })()}
      {ledgerModal && (
        <LedgerModal
          title={`${ledgerModal.type === 'payment' ? 'Record payment' : 'Add charge'} — ${ledgerModal.member.name}`}
          type={ledgerModal.type}
          categories={FEE_CATEGORIES}
          onClose={() => setLedgerModal(null)}
          onSave={(entry) => actions.addLedgerEntry(ledgerModal.member.id, entry)}
        />
      )}
      {confirmAction && confirmAction.type === 'disable' && (
        <ConfirmModal
          title="Disable this member?"
          message={`${confirmAction.member.name} will stop accruing meeting fees from now on. Their existing balance stays as-is — you can re-enable them any time.`}
          confirmLabel="Disable"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => { actions.toggleFeeMemberActive(confirmAction.member); setConfirmAction(null); }}
        />
      )}
      {confirmAction && confirmAction.type === 'delete' && (
        <ConfirmModal
          title="Delete this member?"
          message={`This permanently removes ${confirmAction.member.name} and their entire fee history (charges, payments, receipts). This can't be undone.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => { actions.removeFeeMember(confirmAction.member.id); setConfirmAction(null); }}
        />
      )}
    </div>
  );
}
