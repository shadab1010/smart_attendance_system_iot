import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  Clock, Calendar, Search, Activity, CreditCard,
  CheckCircle, XCircle, ShieldAlert, Download, Trash2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

/* ── shared colour tokens (dark navy/indigo theme) ─────── */
const C = {
  surface:   '#0e1220',
  elevated:  '#141829',
  border:    'rgba(99,102,241,0.15)',
  borderSoft:'rgba(255,255,255,0.05)',
  accent:    '#6366f1',
  emerald:   '#10b981',
  blue:      '#60a5fa',
  rose:      '#f43f5e',
  textPri:   '#f1f5f9',
  textSec:   '#94a3b8',
  textMuted: '#475569',
  textAccent:'#a5b4fc',
};

export default function Home({ isAdminLoggedIn }) {
  const [attendance,   setAttendance]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const [scanStatus, setScanStatus] = useState('idle');
  const [scanData,   setScanData]   = useState(null);

  /* ── fetch ──────────────────────────────────────────────── */
  const fetchAttendance = async () => {
    try {
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select('*')
        .order('id', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (!attendanceData || attendanceData.length === 0) {
        setAttendance([]);
        return;
      }

      const uids = [...new Set(attendanceData.map(r => r.uid))];
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .in('uid', uids);

      const studentsMap = {};
      studentsData?.forEach(s => { studentsMap[s.uid] = s; });

      const processedLogs = [];
      const openSessions  = {};
      const chrono = [...attendanceData].reverse();

      chrono.forEach(record => {
        const student     = studentsMap[record.uid];
        const recordName  = student ? student.name         : record.name     || 'Anonymous User';
        const recordClass = student ? student.class        : '';
        const recordCUID  = student ? student.class_UID    : record.class_UID || '';

        if (record.entery_time && !record.exist_tiem) {
          openSessions[record.uid] = {
            ...record, name: recordName, student_class: recordClass, class_UID: recordCUID, students: student,
          };
        } else if (record.exist_tiem) {
          if (openSessions[record.uid]) {
            openSessions[record.uid].exist_tiem = record.exist_tiem;
            processedLogs.push(openSessions[record.uid]);
            delete openSessions[record.uid];
          } else {
            processedLogs.push({
              ...record, name: recordName, student_class: recordClass, class_UID: recordCUID, students: student,
            });
          }
        }
      });

      Object.values(openSessions).forEach(s => processedLogs.push(s));
      setAttendance(processedLogs.sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  /* ── realtime ────────────────────────────────────────────── */
  useEffect(() => {
    fetchAttendance();

    const attendanceSub = supabase
      .channel('public:attendance_taps')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, async (payload) => {
        const { data } = await supabase.from('students').select('*').eq('uid', payload.new.uid).single();
        setScanData({ name: data?.name || 'Registered User', uid: payload.new.uid, class: data?.class || '' });
        setScanStatus('entry');
        setTimeout(() => { setScanStatus('idle'); setScanData(null); }, 3500);
        fetchAttendance();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance' }, async (payload) => {
        if (payload.new.exist_tiem) {
          const { data } = await supabase.from('students').select('*').eq('uid', payload.new.uid).single();
          setScanData({ name: data?.name || 'Registered User', uid: payload.new.uid, class: data?.class || '' });
          setScanStatus('leave');
          setTimeout(() => { setScanStatus('idle'); setScanData(null); }, 3500);
          fetchAttendance();
        }
      })
      .subscribe();

    const liveScansSub = supabase
      .channel('public:live_scans_home')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_scans' }, (payload) => {
        setScanData({ uid: payload.new.uid });
        setScanStatus('error');
        setTimeout(() => { setScanStatus('idle'); setScanData(null); }, 3500);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceSub);
      supabase.removeChannel(liveScansSub);
    };
  }, []);

  /* ── filter / group ─────────────────────────────────────── */
  const filteredAttendance = useMemo(() =>
    attendance.filter(r => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        (r.name || '').toLowerCase().includes(q) ||
        (r.uid  || '').toLowerCase().includes(q) ||
        (r.student_class || '').toLowerCase().includes(q) ||
        (r.class_UID     || '').toLowerCase().includes(q);
      const matchDate = selectedDate
        ? r.entery_time && format(new Date(r.entery_time), 'yyyy-MM-dd') === selectedDate
        : true;
      return matchSearch && matchDate;
    }),
  [attendance, searchTerm, selectedDate]);

  const groupedByDay = useMemo(() => {
    const groups = {};
    filteredAttendance.forEach(r => {
      const key = r.entery_time ? format(new Date(r.entery_time), 'yyyy-MM-dd') : 'Unknown Date';
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredAttendance]);

  /* ── excel ──────────────────────────────────────────────── */
  const handleDownloadExcel = () => {
    if (!filteredAttendance.length) {
      toast.error('No data to export!', { style: { background: '#1a0a14', color: '#f87171', border: '1px solid rgba(244,63,94,0.3)' } });
      return;
    }
    const rows = filteredAttendance.map((r, i) => ({
      '#': i + 1,
      'Student Name':  r.name           || 'Unknown',
      'Student ID':    r.class_UID      || '—',
      'Class':         r.student_class  || '—',
      'RFID Card UID': r.uid            || '—',
      'Date':      r.entery_time ? format(new Date(r.entery_time), 'dd/MM/yyyy') : '—',
      'Entry Time': r.entery_time ? format(new Date(r.entery_time), 'HH:mm:ss') : '—',
      'Leave Time': r.exist_tiem  ? format(new Date(r.exist_tiem),  'HH:mm:ss') : '—',
      'Status':     r.exist_tiem  ? 'EXIT' : 'ENTRY',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [6, 22, 14, 10, 18, 14, 14, 14, 10].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    const sheetName = selectedDate ? `Attendance_${selectedDate}` : 'Attendance_All';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${sheetName}.xlsx`);
    toast.success('Excel downloaded!', {
      style: { background: '#0a1a12', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' },
    });
  };

  const handleDeleteDay = async (dateKey) => {
    if (!window.confirm(`Are you sure you want to delete ALL records for ${format(parseISO(dateKey), 'dd MMMM yyyy')}?`)) {
      return;
    }

    try {
      // Calculate local day boundaries and convert to UTC ISO strings
      const localDay = new Date(dateKey + "T00:00:00");
      const startIso = localDay.toISOString();
      
      const nextDay  = new Date(localDay.getTime() + 24 * 60 * 60 * 1000);
      const endIso   = nextDay.toISOString();

      // Delete records where entry falls within the logged day (standard for attendance)
      const { error } = await supabase
        .from('attendance')
        .delete()
        .gte('entery_time', startIso)
        .lt('entery_time', endIso);

      if (error) throw error;

      toast.success(`Records for ${dateKey} deleted successfully`, {
        style: { background: '#1a0a14', color: '#f87171', border: '1px solid rgba(244,63,94,0.3)' }
      });
      
      fetchAttendance();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete records');
    }
  };

  /* ── scanner bg colours ─────────────────────────────────── */
  const scannerGlow = {
    idle:  'rgba(99,102,241,0.15)',
    entry: 'rgba(16,185,129,0.18)',
    leave: 'rgba(96,165,250,0.18)',
    error: 'rgba(244,63,94,0.18)',
  };

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div className="space-y-6 fade-up">

      {/* ── Scanner Prompter ─────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden rounded-3xl flex items-center justify-center"
        style={{
          minHeight: 300,
          background: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* animated glow orb */}
        <div
          className="absolute inset-0 orb-pulse"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${scannerGlow[scanStatus]}, transparent 70%)`,
            transition: 'background 0.8s ease',
          }}
        />

        {/* grid lines decoration */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <AnimatePresence mode="wait">

          {/* IDLE */}
          {scanStatus === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center z-10 px-8 py-12 text-center"
            >
              <div className="relative mb-8">
                <motion.div
                  animate={{ scale: [1, 1.6, 2.2], opacity: [0.5, 0.15, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: C.accent }}
                />
                <div
                  className="relative w-28 h-28 rounded-full flex items-center justify-center z-10"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    boxShadow: `0 0 50px rgba(99,102,241,0.5), 0 0 100px rgba(99,102,241,0.2)`,
                  }}
                >
                  <CreditCard size={48} color="#fff" />
                </div>
              </div>
              <h2
                style={{ fontSize: 30, fontWeight: 800, color: C.textPri, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '-0.5px' }}
              >
                Ready for Scan
              </h2>
              <p
                className="font-mono mt-2"
                style={{ fontSize: 13, color: C.textMuted }}
              >
                System synchronized and listening...
              </p>

              {/* decorative dots */}
              <div className="flex gap-2 mt-6">
                {[0, 0.3, 0.6].map((d, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 1.6, delay: d }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: C.accent }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ENTRY */}
          {scanStatus === 'entry' && (
            <motion.div
              key="entry"
              initial={{ opacity: 0, scale: 0.6, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
              className="flex flex-col items-center justify-center z-10 px-8 py-12 text-center"
            >
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '2px solid #10b981',
                  boxShadow: '0 0 60px rgba(16,185,129,0.4)',
                }}
              >
                <CheckCircle size={56} style={{ color: C.emerald }} />
              </div>
              <div
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', color: C.emerald,
                  fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}
              >
                ENTRY LOGGED
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: C.textPri, fontFamily: "'Space Grotesk',sans-serif" }}>
                {scanData?.name}
              </h2>
              <p style={{ fontSize: 13, color: C.emerald, fontFamily: "'JetBrains Mono',monospace", marginTop: 8, opacity: 0.8 }}>
                {scanData?.class || 'Access Granted'}
              </p>
            </motion.div>
          )}

          {/* LEAVE */}
          {scanStatus === 'leave' && (
            <motion.div
              key="leave"
              initial={{ opacity: 0, scale: 0.6, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
              className="flex flex-col items-center justify-center z-10 px-8 py-12 text-center"
            >
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
                style={{
                  background: 'rgba(96,165,250,0.1)',
                  border: '2px solid #60a5fa',
                  boxShadow: '0 0 60px rgba(96,165,250,0.4)',
                }}
              >
                <Clock size={56} style={{ color: C.blue }} />
              </div>
              <div
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', color: C.blue,
                  fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}
              >
                EXIT LOGGED
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: C.textPri, fontFamily: "'Space Grotesk',sans-serif" }}>
                {scanData?.name}
              </h2>
              <p style={{ fontSize: 13, color: C.blue, fontFamily: "'JetBrains Mono',monospace", marginTop: 8, opacity: 0.8 }}>
                Session Completed
              </p>
            </motion.div>
          )}

          {/* ERROR */}
          {scanStatus === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="flex flex-col items-center justify-center z-10 px-8 py-12 text-center"
            >
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
                style={{
                  background: 'rgba(244,63,94,0.1)',
                  border: '2px solid #f43f5e',
                  boxShadow: '0 0 60px rgba(244,63,94,0.4)',
                }}
              >
                <ShieldAlert size={56} style={{ color: C.rose }} />
              </div>
              <div
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', color: C.rose,
                  fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}
              >
                ACCESS DENIED
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: C.textPri, fontFamily: "'Space Grotesk',sans-serif" }}>
                Unregistered Card
              </h2>
              <p style={{ fontSize: 13, color: C.rose, fontFamily: "'JetBrains Mono',monospace", marginTop: 8, opacity: 0.7 }}>
                UID: {scanData?.uid || '—'}
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Attendance Log ───────────────────────────────── */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Controls */}
        <div
          className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-wrap"
          style={{ borderBottom: `1px solid ${C.borderSoft}` }}
        >
          <div>
            <h2
              style={{ fontSize: 18, fontWeight: 700, color: C.textPri, fontFamily: "'Space Grotesk',sans-serif" }}
            >
              Attendance Log
            </h2>
            <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>
              {filteredAttendance.length} record{filteredAttendance.length !== 1 ? 's' : ''}
              {selectedDate ? ` on ${format(parseISO(selectedDate), 'dd MMM yyyy')}` : ' total'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, width: '100%' }}
                className="sm:w-48"
              />
            </div>

            {/* Date picker */}
            <div className="relative">
              <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.textMuted }} />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{
                  paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
                  fontSize: 13, colorScheme: 'dark',
                }}
              />
            </div>

            {/* Clear */}
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                style={{
                  padding: '8px 12px', fontSize: 12, borderRadius: 10,
                  color: C.textSec, border: `1px solid ${C.border}`,
                  background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.rose; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.textSec; e.currentTarget.style.borderColor = C.border; }}
              >
                Clear
              </button>
            )}

            {/* Export */}
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 font-semibold"
              style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                color: C.emerald,
                border: '1px solid rgba(16,185,129,0.3)',
                background: 'rgba(16,185,129,0.08)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(16,185,129,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <Download size={14} />
              Export Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div style={{ padding: '64px 24px', textAlign: 'center', color: C.textMuted, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>
              <Activity size={28} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              Querying records...
            </div>
          ) : groupedByDay.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center', color: C.textMuted }}>
              <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
              <p style={{ fontSize: 14 }}>
                No records{selectedDate ? ` for ${format(parseISO(selectedDate), 'dd MMM yyyy')}` : ''}.
              </p>
            </div>
          ) : (
            groupedByDay.map(([dateKey, records]) => (
              <div key={dateKey}>
                {/* Day separator */}
                <div
                  className="flex items-center gap-3 px-6 py-3"
                  style={{
                    background: 'rgba(99,102,241,0.06)',
                    borderTop: `1px solid rgba(99,102,241,0.1)`,
                    borderBottom: `1px solid rgba(99,102,241,0.1)`,
                  }}
                >
                  <Calendar size={12} style={{ color: C.textAccent }} />
                  <span
                    style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                      color: C.textAccent, fontFamily: "'JetBrains Mono',monospace" }}
                  >
                    {dateKey === 'Unknown Date' ? 'Unknown Date' : format(parseISO(dateKey), 'EEEE, dd MMMM yyyy')}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: C.textMuted, fontFamily: "'JetBrains Mono',monospace", display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span>{records.length} record{records.length !== 1 ? 's' : ''}</span>
                    {isAdminLoggedIn && (
                      <button
                        onClick={() => handleDeleteDay(dateKey)}
                        title="Delete all records for this day"
                        style={{
                          padding: '4px 8px', borderRadius: 6,
                          background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
                          color: C.rose, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 10, fontWeight: 700, transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.2)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(244,63,94,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <Trash2 size={12} /> Delete Day
                      </button>
                    )}
                  </span>
                </div>

                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                      {['#', 'Student Name', 'Class', 'RFID Card', 'Entry Time', 'Leave Time', 'Status'].map(h => (
                        <th key={h} style={{
                          padding: '10px 24px', fontSize: 10, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.12em',
                          color: C.textMuted, fontFamily: "'JetBrains Mono',monospace",
                          whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, idx) => (
                      <tr
                        key={r.id}
                        className="table-row-hover"
                        style={{ borderBottom: `1px solid ${C.borderSoft}` }}
                      >
                        {/* # */}
                        <td style={{ padding: '14px 24px', fontSize: 12, color: C.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                          {idx + 1}
                        </td>

                        {/* Name */}
                        <td style={{ padding: '14px 24px' }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: C.textPri }}>
                            {r.name || 'Anonymous User'}
                          </div>
                          {r.class_UID && (
                            <div style={{ fontSize: 11, color: C.textAccent, fontFamily: "'JetBrains Mono',monospace", marginTop: 2, opacity: 0.7 }}>
                              🪪 {r.class_UID}
                            </div>
                          )}
                        </td>

                        {/* Class */}
                        <td style={{ padding: '14px 24px' }}>
                          <span
                            style={{
                              display: 'inline-block', padding: '3px 10px',
                              borderRadius: 6, fontSize: 11, fontWeight: 600,
                              background: 'rgba(139,92,246,0.12)',
                              border: '1px solid rgba(139,92,246,0.25)',
                              color: '#c4b5fd',
                            }}
                          >
                            {r.student_class || '—'}
                          </span>
                        </td>

                        {/* RFID */}
                        <td style={{ padding: '14px 24px', fontSize: 11, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>
                          {r.uid}
                        </td>

                        {/* Entry */}
                        <td style={{
                          padding: '14px 24px', fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 13,
                          color: r.entery_time ? C.emerald : C.textMuted,
                          fontWeight: r.entery_time ? 600 : 400,
                        }}>
                          {r.entery_time ? format(new Date(r.entery_time), 'HH:mm:ss') : '——'}
                        </td>

                        {/* Leave */}
                        <td style={{
                          padding: '14px 24px', fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 13,
                          color: r.exist_tiem ? C.blue : C.textMuted,
                          fontWeight: r.exist_tiem ? 600 : 400,
                        }}>
                          {r.exist_tiem ? format(new Date(r.exist_tiem), 'HH:mm:ss') : '——'}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 24px' }}>
                          {r.entery_time && !r.exist_tiem ? (
                            <span style={{
                              display: 'inline-block', padding: '3px 10px', borderRadius: 99,
                              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                              background: 'rgba(16,185,129,0.1)',
                              border: '1px solid rgba(16,185,129,0.3)',
                              color: C.emerald,
                            }}>
                              ENTRY
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-block', padding: '3px 10px', borderRadius: 99,
                              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                              background: 'rgba(96,165,250,0.1)',
                              border: '1px solid rgba(96,165,250,0.3)',
                              color: C.blue,
                            }}>
                              EXIT
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
