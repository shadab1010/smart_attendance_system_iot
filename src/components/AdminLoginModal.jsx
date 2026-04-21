import { useState } from 'react';
import { X, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLoginModal({ isOpen, onClose, onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      toast.success('Welcome back, Admin!', {
        style: { background: '#0e1220', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' },
      });
      onLogin();
      setPassword('');
      setError('');
      onClose();
      navigate('/admin');
    } else {
      setError('Invalid password. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0"
            style={{ background: 'rgba(4, 6, 12, 0.75)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            exit={{   scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl"
            style={{
              background: '#0e1220',
              border: '1px solid rgba(99,102,241,0.25)',
              boxShadow: '0 0 60px rgba(99,102,241,0.15), 0 24px 48px rgba(0,0,0,0.6)',
            }}
          >
            {/* Top gradient bar */}
            <div style={{ height: 2, background: 'linear-gradient(90deg,#4f46e5,#8b5cf6,#6366f1)' }} />

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-7">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}
                  >
                    <ShieldCheck size={20} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', fontFamily: "'Space Grotesk',sans-serif" }}>
                      Admin Access
                    </h2>
                    <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Enter your credentials to continue</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: '#475569' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent';            e.currentTarget.style.color = '#475569'; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock size={16} style={{ color: '#475569' }} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      className="block w-full font-mono"
                      style={{
                        paddingLeft: 40,
                        paddingRight: 16,
                        paddingTop: 11,
                        paddingBottom: 11,
                        fontSize: 14,
                        letterSpacing: '0.1em',
                      }}
                      placeholder="••••••••"
                      autoFocus
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-2 flex items-center gap-1.5"
                        style={{ fontSize: 12, color: '#f87171' }}
                      >
                        <AlertCircle size={13} />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center items-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all btn-glow"
                >
                  Sign In
                </button>
              </form>
            </div>

            {/* Footer */}
            <div
              className="px-6 py-4 text-center"
              style={{ borderTop: '1px solid rgba(99,102,241,0.1)', background: 'rgba(0,0,0,0.15)' }}
            >
              <p style={{ fontSize: 11, color: '#334155', fontFamily: "'JetBrains Mono',monospace" }}>
                Secured by Neural Attendance System
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
