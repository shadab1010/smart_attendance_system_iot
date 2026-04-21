import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, X, ShieldCheck, Cpu } from 'lucide-react';
import AdminLoginModal from './AdminLoginModal';

export default function Header({ isAdminLoggedIn, setIsAdminLoggedIn }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    navigate('/');
  };

  return (
    <>
      <header
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(8, 11, 20, 0.85)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, #4f46e5, #8b5cf6, #6366f1)' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[68px]">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group" style={{ textDecoration: 'none' }}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  boxShadow: '0 0 18px rgba(99,102,241,0.4)',
                }}
              >
                <ShieldCheck size={19} color="#fff" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-none">
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: '-0.5px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: '#f1f5f9',
                  }}
                >
                  Smart
                  <span style={{ fontWeight: 300, color: '#94a3b8' }}>Attendance</span>
                </span>
                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    marginTop: 2,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#6366f1',
                  }}
                >
                  RFID Smart System
                </span>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-3">

              {/* Live pulse */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: '#10b981' }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-1.5 w-1.5"
                    style={{ background: '#10b981' }}
                  />
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    color: '#10b981',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  LIVE
                </span>
              </div>

              {isAdminLoggedIn ? (
                <>
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{ color: '#94a3b8', textDecoration: 'none' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                      e.currentTarget.style.color = '#a5b4fc';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }}
                  >
                    <Cpu size={15} />
                    System Control
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{
                      color: '#f87171',
                      border: '1px solid rgba(248,113,113,0.2)',
                      background: 'rgba(244,63,94,0.08)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 btn-glow"
                >
                  <User size={15} />
                  Admin Login →
                </button>
              )}
            </div>

            {/* Mobile button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl transition-colors"
                style={{ color: '#94a3b8' }}
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden border-t"
            style={{
              borderColor: 'rgba(99,102,241,0.15)',
              background: 'rgba(8,11,20,0.97)',
            }}
          >
            <div className="px-4 py-3 space-y-1">
              {isAdminLoggedIn ? (
                <>
                  <Link
                    to="/admin"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ color: '#94a3b8', textDecoration: 'none' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Cpu size={16} style={{ color: '#6366f1' }} />
                    System Control
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium"
                    style={{ color: '#f87171' }}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-semibold text-white justify-center btn-glow"
                >
                  <User size={16} />
                  Admin Login →
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={() => setIsAdminLoggedIn(true)}
      />
    </>
  );
}
