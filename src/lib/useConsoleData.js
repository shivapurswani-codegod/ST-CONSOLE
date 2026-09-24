import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { addMonths, meetingsInMonth, monthsFromTo } from './reports';
import { todayISO } from './theme';

export function useConsoleData(enabled) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [settings, setSettings] = useState(null);
  const [venueEntries, setVenueEntries] = useState([]);
  const [events, setEvents] = useState([]);
  const [miscEntries, setMiscEntries] = useState([]);
  const [renewalMembers, setRenewalMembers] = useState([]);
  const [feeMembers, setFeeMembers] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const accruedRef = useRef(false);

  const fetchAll = useCallback(async () => {
    // allSettled + a hard finally guarantee this never hangs forever on the
    // loading spinner, even if one table/query genuinely fails.
    const results = await Promise.allSettled([
      supabase.from('settings').select('*').eq('id', 1).single(),
      supabase.from('venue_entries').select('*').order('date', { ascending: false }),
      supabase.from('events').select('*').order('date', { ascending: false }),
      supabase.from('misc_entries').select('*').order('date', { ascending: false }),
      supabase.from('renewal_members').select('*').order('renewal_date', { ascending: true }),
      supabase.from('fee_members').select('*'),
      supabase.from('fee_ledger').select('*'),
      supabase.from('holidays').select('*').order('date', { ascending: true }),
    ]);
    const [s, v, e, mi, rm, fm, fl, hol] = results.map(r => r.status === 'fulfilled' ? r.value : { data: null, error: r.reason });

    const firstError = results.map(r => r.status === 'fulfilled' ? r.value.error : r.reason).find(Boolean);
    if (firstError) {
      // eslint-disable-next-line no-console
      console.error('Console data load error:', firstError);
      setLoadError(firstError.message || String(firstError));
    } else {
      setLoadError(null);
    }

    setSettings(s?.data || null);
    setVenueEntries(v?.data || []);
    setEvents(e?.data || []);
    setMiscEntries(mi?.data || []);
    setRenewalMembers(rm?.data || []);
    setHolidays(hol?.data || []);
    const ledgerByMember = {};
    (fl?.data || []).forEach(l => { (ledgerByMember[l.member_id] ||= []).push(l); });
    setFeeMembers((fm?.data || []).map(m => ({ ...m, ledger: ledgerByMember[m.id] || [] })));
    setLoading(false);
    return { feeMembers: fm?.data || [], settings: s?.data || null, holidays: hol?.data || [] };
  }, []);

  // Only start loading data once we know for certain the user is authenticated —
  // firing this before the session is confirmed causes every request to be
  // silently rejected (0 rows), which then never retries on its own.
  useEffect(() => {
    if (!enabled) return;
    fetchAll();
  }, [enabled, fetchAll]);

  // Catch up monthly meeting-fee accrual once, right after the first load.
  // Bills one lump-sum charge per missed month = (Wednesdays in that month − holidays) × weekly fee.
  useEffect(() => {
    if (loading || accruedRef.current || !settings) return;
    accruedRef.current = true;
    (async () => {
      const currentMonth = todayISO().slice(0, 7);
      let changed = false;
      for (const m of feeMembers) {
        if (!m.active) continue;
        const lastMonth = m.last_accrual_date ? m.last_accrual_date.slice(0, 7) : currentMonth;
        const startMonth = addMonths(lastMonth, 1);
        if (startMonth > currentMonth) continue; // already billed through the current month
        const monthsToBill = monthsFromTo(startMonth, currentMonth);
        for (const monthStr of monthsToBill) {
          const info = meetingsInMonth(monthStr, holidays);
          if (info.effective > 0) {
            changed = true;
            await supabase.from('fee_ledger').insert({
              member_id: m.id, date: `${monthStr}-01`, type: 'charge', category: 'meeting',
              amount: info.effective * settings.weekly_fee_per_member,
              note: `Meeting fee — ${info.effective} meeting${info.effective === 1 ? '' : 's'}`,
            });
          }
        }
        await supabase.from('fee_members').update({ last_accrual_date: `${currentMonth}-01` }).eq('id', m.id);
      }
      if (changed) fetchAll();
    })();
    // eslint-disable-next-line
  }, [loading, settings]);

  // ---- mutations (each refetches to keep everything consistent) ----

  const addVenueEntry = async (entry) => { await supabase.from('venue_entries').insert(entry); await fetchAll(); };
  const removeVenueEntry = async (id) => { await supabase.from('venue_entries').delete().eq('id', id); await fetchAll(); };

  const addEvent = async (entry) => { await supabase.from('events').insert(entry); await fetchAll(); };
  const removeEvent = async (id) => { await supabase.from('events').delete().eq('id', id); await fetchAll(); };

  const addMisc = async (entry) => { await supabase.from('misc_entries').insert(entry); await fetchAll(); };
  const removeMisc = async (id) => { await supabase.from('misc_entries').delete().eq('id', id); await fetchAll(); };

  const addRenewalMember = async (entry) => { await supabase.from('renewal_members').insert(entry); await fetchAll(); };
  const removeRenewalMember = async (id) => { await supabase.from('renewal_members').delete().eq('id', id); await fetchAll(); };

  const updateSettings = async (patch) => { await supabase.from('settings').update(patch).eq('id', 1); await fetchAll(); };

  const addFeeMember = async (member) => {
    const prevMonthStart = `${addMonths(todayISO().slice(0, 7), -1)}-01`;
    await supabase.from('fee_members').insert({ ...member, last_accrual_date: prevMonthStart });
    await fetchAll();
  };
  const updateFeeMember = async (id, patch) => { await supabase.from('fee_members').update(patch).eq('id', id); await fetchAll(); };
  const removeFeeMember = async (id) => { await supabase.from('fee_members').delete().eq('id', id); await fetchAll(); };
  const toggleFeeMemberActive = async (m) => { await updateFeeMember(m.id, { active: !m.active, last_accrual_date: `${todayISO().slice(0, 7)}-01` }); };
  const addLedgerEntry = async (memberId, entry) => { await supabase.from('fee_ledger').insert({ ...entry, member_id: memberId }); await fetchAll(); };

  const bulkUpsertFeeMembers = async (rows) => {
    let added = 0, updated = 0;
    for (const row of rows) {
      const email = (row.email || '').trim().toLowerCase();
      const existing = email ? feeMembers.find(m => (m.email || '').trim().toLowerCase() === email) : null;
      if (existing) {
        await supabase.from('fee_members').update({ name: row.name, company_name: row.companyName, phone: row.phone, active: row.active }).eq('id', existing.id);
        updated++;
      } else {
        const { data: created } = await supabase.from('fee_members').insert({
          name: row.name, company_name: row.companyName, email: row.email, phone: row.phone, active: row.active,
          last_accrual_date: `${addMonths(todayISO().slice(0, 7), -1)}-01`,
        }).select().single();
        if (created && row.openingCharges?.length) {
          await supabase.from('fee_ledger').insert(row.openingCharges.map(c => ({ ...c, member_id: created.id })));
        }
        added++;
      }
    }
    await fetchAll();
    return { added, updated };
  };

  const addHoliday = async (holiday) => {
    const { error } = await supabase.from('holidays').insert(holiday);
    if (error) return { error };
    await fetchAll();
    return { error: null };
  };
  const removeHoliday = async (id) => { await supabase.from('holidays').delete().eq('id', id); await fetchAll(); };

  return {
    loading, loadError, settings, venueEntries, events, miscEntries, renewalMembers, feeMembers, holidays, refetch: fetchAll,
    addVenueEntry, removeVenueEntry, addEvent, removeEvent, addMisc, removeMisc,
    addRenewalMember, removeRenewalMember, updateSettings, addFeeMember, updateFeeMember,
    removeFeeMember, toggleFeeMemberActive, addLedgerEntry, bulkUpsertFeeMembers, addHoliday, removeHoliday,
  };
}
