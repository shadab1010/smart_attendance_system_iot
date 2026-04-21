import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import {
  UserPlus, CheckCircle, Database, Radio, Clock, Activity,
  RefreshCw, Cpu, Users, Search, Pencil, Trash2, X, Save,
  ShieldCheck, CreditCard, GraduationCap, Hash, Download, Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, isValid } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

/* ── colour tokens ──────────────────────────────────────── */
const C = {
  surface:   '#0e1220',
  elevated:  '#141829',
  border:    'rgba(99,102,241,0.15)',
  borderSoft:'rgba(255,255,255,0.05)',
  accent:    '#6366f1',
  emerald:   '#10b981',
  rose:      '#f43f5e',
  blue:      '#60a5fa',
  violet:    '#a78bfa',
  textPri:   '#f1f5f9',
  textSec:   '#94a3b8',
  textMuted: '#475569',
};

/* ── small helpers ──────────────────────────────────────── */
const inputClass = {
  display: 'block', width: '100%',
  padding: '10px 14px', fontSize: 14,
  borderRadius: 10, outline: 'none',
  fontFamily: "'Space Grotesk', sans-serif",
};

function Field({ label, icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
        {Icon && <Icon size={13} style={{ color: C.accent }} />}
        {label}
      </label>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   EDIT MODAL
══════════════════════════════════════════════════════════ */
function EditModal({ student, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:          student.name      || '',
    class:         student.class     || '',
    class_UID:     student.class_UID || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ name: form.name, class: form.class, class_UID: form.class_UID })
        .eq('uid', student.uid);
      if (error) throw error;
      toast.success('Student updated!', {
        style: { background: '#0a1a12', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' },
      });
      onSaved({ ...student, ...form });
      onClose();
    } catch (err) {
      toast.error(err.message || 'Update failed.', {
        style: { background: '#1a0a14', color: '#f87171', border: '1px solid rgba(244,63,94,0.3)' },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0"
        style={{ background: 'rgba(4,6,12,0.8)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{   scale: 0.93, opacity: 0, y: 16 }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
        className="relative z-10 w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: '0 0 60px rgba(99,102,241,0.12), 0 24px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* accent bar */}
        <div style={{ height: 2, background: 'linear-gradient(90deg,#4f46e5,#8b5cf6)' }} />

        {/* header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>
              <Pencil size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.textPri, fontFamily: "'Space Grotesk',sans-serif" }}>Edit Student</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>UID: {student.uid}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: 8, borderRadius: 10, background: 'transparent', border: 'none', color: C.textMuted, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.textSec; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted; }}>
            <X size={18} />
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Student Name" icon={Users}>
            <input style={inputClass} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Full name" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Class" icon={GraduationCap}>
              <input style={inputClass} value={form.class} onChange={e => setForm(p => ({ ...p, class: e.target.value }))} placeholder="e.g. BCA" />
            </Field>
            <Field label="Student ID / Roll No" icon={Hash}>
              <input style={inputClass} value={form.class_UID} onChange={e => setForm(p => ({ ...p, class_UID: e.target.value }))} placeholder="e.g. 2024-CS-001" />
            </Field>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.textSec }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: '1px solid rgba(99,102,241,0.3)', color: '#fff', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
              {saving ? (
                <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              ) : <Save size={15} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DELETE CONFIRM MODAL
══════════════════════════════════════════════════════════ */
function DeleteModal({ student, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from('students').delete().eq('uid', student.uid);
      if (error) throw error;
      toast.success(`${student.name} removed.`, {
        style: { background: '#1a0a14', color: '#f87171', border: '1px solid rgba(244,63,94,0.3)' },
      });
      onDeleted(student.uid);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Delete failed.', {
        style: { background: '#1a0a14', color: '#f87171', border: '1px solid rgba(244,63,94,0.3)' },
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0"
        style={{ background: 'rgba(4,6,12,0.8)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{   scale: 0.93, opacity: 0, y: 16 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="relative z-10 w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: C.surface,
          border: '1px solid rgba(244,63,94,0.25)',
          boxShadow: '0 0 60px rgba(244,63,94,0.1), 0 24px 48px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ height: 2, background: 'linear-gradient(90deg,#f43f5e,#fb7185)' }} />
        <div style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trash2 size={24} style={{ color: C.rose }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, color: C.textPri, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 8 }}>
            Delete Student?
          </div>
          <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
            You are about to permanently remove <strong style={{ color: C.textPri }}>{student.name}</strong>.
            This action cannot be undone.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
            <button onClick={onClose}
              style={{ padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.textSec }}>
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting}
              style={{ padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1, background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.35)', color: C.rose, display: 'flex', alignItems: 'center', gap: 7 }}>
              {deleting ? (
                <div style={{ width: 14, height: 14, border: '2px solid rgba(244,63,94,0.3)', borderTop: `2px solid ${C.rose}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              ) : <Trash2 size={14} />}
              {deleting ? 'Deleting…' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [formData,    setFormData]    = useState({ name: '', uid: '', student_class: '', class_UID: '' });
  const [loading,     setLoading]     = useState(false);
  const [liveScans,   setLiveScans]   = useState([]);
  const [isRefreshing,setIsRefreshing]= useState(false);

  // students table
  const [students,     setStudents]     = useState([]);
  const [stuLoading,   setStuLoading]   = useState(true);
  const [stuSearch,    setStuSearch]    = useState('');
  const [stuClassFilter, setStuClassFilter] = useState('all');
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── fetch helpers ─────────────────────────────────────── */
  const fetchLiveScans = async () => {
    const { data, error } = await supabase
      .from('live_scans').select('*').order('time', { ascending: false }).limit(20);
    if (!error && data) setLiveScans(data);
  };

  const fetchStudents = useCallback(async () => {
    setStuLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*');
      if (error) {
        console.error('❌ fetchStudents error:', error);
        toast.error('Could not load students: ' + error.message, {
          style: { background: '#1a0a14', color: '#f87171', border: '1px solid rgba(244,63,94,0.3)' },
        });
      }
      // Always set data (even empty array) so the table renders
      setStudents(data || []);
    } catch (err) {
      console.error('❌ fetchStudents exception:', err);
      setStudents([]);
    } finally {
      setStuLoading(false);
    }
  }, []);

  /* ── realtime ──────────────────────────────────────────── */
  useEffect(() => {
    fetchLiveScans();
    fetchStudents();

    const channel = supabase
      .channel('public:live_scans_admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_scans' }, (payload) => {
        const newUid = payload.new.uid;
        setFormData(prev => ({ ...prev, uid: newUid }));
        toast.custom((t) => (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', color: C.textPri, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <Cpu size={20} style={{ color: C.accent }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>New Hardware Detected</div>
              <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: C.textMuted, marginTop: 2 }}>UID: {newUid}</div>
            </div>
          </div>
        ));
        setLiveScans(prev => [payload.new, ...prev].slice(0, 20));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'live_scans' }, (payload) => {
        setLiveScans(prev => prev.filter(s => s.id !== payload.old.id));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchStudents]);

  /* ── handlers ──────────────────────────────────────────── */
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchLiveScans();
    toast.success('Refreshed', { style: { background: C.surface, color: C.textAccent, border: `1px solid ${C.border}` } });
    setIsRefreshing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const registeredUid = formData.uid.trim().toUpperCase();
    try {
      const { error } = await supabase.from('students').insert([{
        uid: formData.uid, name: formData.name, class: formData.student_class, class_UID: formData.class_UID,
      }]);
      if (error) {
        if (error.code === '23505') throw new Error('A student with this RFID UID already exists.');
        throw error;
      }

      await supabase.from('live_scans').delete().ilike('uid', registeredUid);
      setLiveScans(prev => prev.filter(s => s.uid?.toUpperCase() !== registeredUid));

      toast.success(`${formData.name} registered!`, {
        style: { background: '#0a1a12', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' },
      });
      setFormData({ name: '', uid: '', student_class: '', class_UID: '' });
      fetchStudents(); // refresh roster
    } catch (err) {
      toast.error(err.message || 'Failed to register.', {
        style: { background: '#1a0a14', color: '#f87171', border: '1px solid rgba(244,63,94,0.3)' },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectUid = (uid) => {
    setFormData(prev => ({ ...prev, uid }));
    toast.success(`UID loaded: ${uid}`, {
      style: { background: C.surface, color: C.textPri, border: `1px solid ${C.border}` },
    });
  };

  const handleDownloadExcel = () => {
    if (filteredStudents.length === 0) {
      toast.error('No data to export', { style: { background: C.surface, color: C.textPri, border: `1px solid ${C.border}` } });
      return;
    }

    const exportData = filteredStudents.map((s, idx) => ({
      'S.No': idx + 1,
      'Name': s.name,
      'Class': s.class,
      'Student ID': s.class_UID,
      'RFID UID': s.uid
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    
    // Set column widths
    const wscols = [
      { wch: 6 },  // S.No
      { wch: 25 }, // Name
      { wch: 15 }, // Class
      { wch: 20 }, // Student ID
      { wch: 15 }  // RFID UID
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Registered_Students_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Excel file generated!', { style: { background: C.surface, color: C.textPri, border: `1px solid ${C.border}` } });
  };

  /* ── filtered students ─────────────────────────────────── */
  const uniqueClasses = Array.from(new Set(students.map(s => s.class).filter(Boolean))).sort();

  const filteredStudents = students.filter(s => {
    const q = stuSearch.toLowerCase();
    const matchesSearch = (
      (s.name      || '').toLowerCase().includes(q) ||
      (s.uid       || '').toLowerCase().includes(q) ||
      (s.class     || '').toLowerCase().includes(q) ||
      (s.class_UID || '').toLowerCase().includes(q)
    );
    const matchesClass = stuClassFilter === 'all' || s.class === stuClassFilter;

    return matchesSearch && matchesClass;
  });

  /* ── render ──────────────────────────────────────────────── */
  return (
    <>
      {/* ── Modals ─────────────────────────────────────────── */}
      <AnimatePresence>
        {editTarget   && <EditModal   student={editTarget}   onClose={() => setEditTarget(null)}   onSaved={updated => setStudents(p => p.map(s => s.uid === updated.uid ? updated : s))} />}
        {deleteTarget && <DeleteModal student={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={uid => setStudents(p => p.filter(s => s.uid !== uid))} />}
      </AnimatePresence>

      <div className="space-y-8 fade-up max-w-6xl mx-auto">

        {/* ── Hero Banner ────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-3xl p-8 lg:p-10"
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            boxShadow: '0 0 50px rgba(79,70,229,0.12)',
          }}
        >
          <div className="absolute -left-20 -top-20 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)' }} />
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-150 translate-x-10 -translate-y-10">
            <Database size={200} />
          </div>
          <div className="relative z-10">
            <h1 style={{ fontSize: 34, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", color: C.textPri, marginBottom: 8 }}>
              System <span className="text-gradient">Control</span>
            </h1>
            <p style={{ fontSize: 15, color: C.textSec, maxWidth: 480, lineHeight: 1.6 }}>
              Register new students, link RFID hardware nodes, and manage the entire student roster from here.
            </p>
          </div>
        </div>

        {/* ── Register + Telemetry ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Register Form */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl overflow-hidden h-full" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              {/* card header */}
              <div style={{ padding: '20px 28px', borderBottom: `1px solid ${C.borderSoft}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <UserPlus size={22} style={{ color: C.accent }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: C.textPri, fontFamily: "'Space Grotesk',sans-serif" }}>Register Student</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Register a new student with their RFID card</div>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Student Name" icon={Users}>
                    <input
                      type="text" id="name" name="name" required
                      value={formData.name} onChange={handleInputChange}
                      style={inputClass} placeholder="e.g. John Doe"
                    />
                  </Field>
                  <Field label="Hardware Token UID" icon={CreditCard}>
                    <input
                      type="text" id="uid" name="uid" required
                      value={formData.uid} onChange={handleInputChange}
                      style={{ ...inputClass, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.1em', borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.08)', color: '#a5b4fc' }}
                      placeholder="e.g. A1B2C3D4"
                    />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Class" icon={GraduationCap}>
                    <input
                      type="text" id="student_class" name="student_class" required
                      value={formData.student_class} onChange={handleInputChange}
                      style={inputClass} placeholder="e.g. BCA"
                    />
                  </Field>
                  <Field label="Student ID / Roll No" icon={Hash}>
                    <input
                      type="text" id="class_UID" name="class_UID" required
                      value={formData.class_UID} onChange={handleInputChange}
                      style={inputClass} placeholder="e.g. 2024-CS-001"
                    />
                  </Field>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                  <button
                    type="submit" disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '12px 28px', borderRadius: 12,
                      background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                      border: '1px solid rgba(99,102,241,0.4)',
                      color: '#fff', fontWeight: 700, fontSize: 14,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.65 : 1,
                      boxShadow: '0 0 24px rgba(99,102,241,0.35)',
                      fontFamily: "'Space Grotesk',sans-serif",
                      transition: 'all 0.2s',
                    }}
                  >
                    {loading ? (
                      <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    ) : <CheckCircle size={18} />}
                    {loading ? 'Processing…' : 'Initialize Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Telemetry Log */}
          <div>
            <div
              className="rounded-3xl overflow-hidden flex flex-col"
              style={{ background: C.surface, border: '1px solid rgba(244,63,94,0.15)', maxHeight: 520 }}
            >
              {/* header */}
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 12, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Radio size={18} style={{ color: C.rose, animation: 'pulse 2s infinite' }} />
                    <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: C.rose, animation: 'ping 1s infinite' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.textPri, fontFamily: "'Space Grotesk',sans-serif" }}>Telemetry Log</div>
                    <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "'JetBrains Mono',monospace", marginTop: 1 }}>Unknown hardware</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={handleManualRefresh} disabled={isRefreshing}
                    style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.borderSoft}`, color: C.textMuted, cursor: 'pointer' }}>
                    <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none' }} />
                  </button>
                  <div style={{ padding: '5px 12px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 99, fontSize: 11, fontWeight: 700, color: C.rose, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Activity size={12} /> Live
                  </div>
                </div>
              </div>

              {/* list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {liveScans.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', gap: 12 }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', border: '1.5px dashed rgba(244,63,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Radio size={28} style={{ color: 'rgba(244,63,94,0.35)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec }}>Awaiting Signals…</div>
                      <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: C.textMuted, marginTop: 4 }}>Intercepting unassigned nodes</div>
                    </div>
                  </div>
                ) : liveScans.map((scan, i) => (
                  <div
                    key={scan.id || i}
                    onClick={() => handleSelectUid(scan.uid)}
                    className="group"
                    style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.borderSoft}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; e.currentTarget.style.background = 'rgba(244,63,94,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderSoft; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  >
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: C.rose, borderRadius: '0 3px 3px 0', opacity: 0 }} className="group-hover:opacity-100" />
                    <div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14, color: C.textPri, letterSpacing: '0.08em' }}>{scan.uid}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'JetBrains Mono',monospace", marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={11} />
                        {scan.time && isValid(new Date(scan.time)) ? format(new Date(scan.time), 'HH:mm:ss') : '--:--:--'}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: C.rose }}>
                      Select
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.borderSoft}`, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: C.textMuted }}>Click a UID to auto-fill the form</p>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            REGISTERED STUDENTS TABLE
        ══════════════════════════════════════════════════════ */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
        >
          {/* table header */}
          <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.borderSoft}`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg,rgba(16,185,129,0.18),rgba(6,95,70,0.2))', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} style={{ color: C.emerald }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: C.textPri, fontFamily: "'Space Grotesk',sans-serif" }}>
                  Registered Students
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
                  {filteredStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* class filter */}
              <div style={{ position: 'relative', minWidth: 140 }}>
                <Filter size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
                <select
                  value={stuClassFilter}
                  onChange={e => setStuClassFilter(e.target.value)}
                  style={{ ...inputClass, paddingLeft: 32, fontSize: 13, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, cursor: 'pointer', appearance: 'none' }}
                >
                  <option value="all" style={{ background: C.surface }}>All Classes</option>
                  {uniqueClasses.map(c => (
                    <option key={c} value={c} style={{ background: C.surface }}>{c}</option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.textMuted, fontSize: 10 }}>▼</div>
              </div>

              {/* search */}
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search students…"
                  value={stuSearch}
                  onChange={e => setStuSearch(e.target.value)}
                  style={{ ...inputClass, paddingLeft: 32, width: 200, fontSize: 13 }}
                />
              </div>

              {/* download */}
              <button
                onClick={handleDownloadExcel}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 16px', borderRadius: 10,
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                  color: C.accent, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
              >
                <Download size={14} /> Export
              </button>

              {/* refresh */}
              <button
                onClick={fetchStudents}
                style={{ padding: '9px 11px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, color: C.textSec, cursor: 'pointer' }}
                title="Refresh students"
              >
                <RefreshCw size={14} style={{ animation: stuLoading ? 'spin 0.7s linear infinite' : 'none' }} />
              </button>
            </div>
          </div>

          {/* table body */}
          <div style={{ overflowX: 'auto' }}>
            {stuLoading ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: C.textMuted, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>
                <ShieldCheck size={28} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
                Loading students…
              </div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: C.textMuted }}>
                <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                <p style={{ fontSize: 14 }}>
                  {stuSearch ? `No students match "${stuSearch}"` : 'No students registered yet.'}
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                    {['#', 'Student Name', 'Class', 'Student ID', 'RFID UID', 'Actions'].map(h => (
                      <th key={h} style={{
                        padding: '11px 22px', fontSize: 10, fontWeight: 700,
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
                  {filteredStudents.map((student, idx) => (
                    <tr
                      key={student.id}
                      style={{ borderBottom: `1px solid ${C.borderSoft}`, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* # */}
                      <td style={{ padding: '14px 22px', fontSize: 12, color: C.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                        {idx + 1}
                      </td>

                      {/* Name */}
                      <td style={{ padding: '14px 22px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))`, border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>
                              {(student.name || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: C.textPri }}>{student.name || '—'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td style={{ padding: '14px 22px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                          fontSize: 11, fontWeight: 600,
                          background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
                          color: '#c4b5fd',
                        }}>
                          {student.class || '—'}
                        </span>
                      </td>

                      {/* Student ID */}
                      <td style={{ padding: '14px 22px', fontSize: 12, color: C.textAccent || C.accent, fontFamily: "'JetBrains Mono',monospace" }}>
                        {student.class_UID || '—'}
                      </td>

                      {/* RFID UID */}
                      <td style={{ padding: '14px 22px' }}>
                        <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.06em', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.borderSoft}`, padding: '3px 8px', borderRadius: 6 }}>
                          {student.uid || '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 22px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {/* Edit */}
                          <button
                            onClick={() => setEditTarget(student)}
                            title="Edit student"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                              cursor: 'pointer', transition: 'all 0.15s',
                              background: 'rgba(99,102,241,0.1)',
                              border: '1px solid rgba(99,102,241,0.25)',
                              color: '#a5b4fc',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(99,102,241,0.25)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            <Pencil size={13} /> Edit
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(student)}
                            title="Delete student"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                              cursor: 'pointer', transition: 'all 0.15s',
                              background: 'rgba(244,63,94,0.08)',
                              border: '1px solid rgba(244,63,94,0.2)',
                              color: '#fb7185',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.18)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(244,63,94,0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
