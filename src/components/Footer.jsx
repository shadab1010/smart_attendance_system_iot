import { Shield } from 'lucide-react';

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const socialLinks = [
  { name: 'Facebook',  href: 'https://www.facebook.com/shabab.alam.16121',  icon: <FacebookIcon />,  bg: '#1877f2' },
  { name: 'Instagram', href: 'https://www.instagram.com/shadab_iraqe/',      icon: <InstagramIcon />, bg: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)' },
  { name: 'LinkedIn',  href: 'https://www.linkedin.com/in/itsshadab/',        icon: <LinkedInIcon />,  bg: '#0a66c2' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="mt-auto"
      style={{
        borderTop: '1px solid rgba(99,102,241,0.15)',
        background: 'rgba(8,11,20,0.9)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                boxShadow: '0 0 12px rgba(99,102,241,0.3)',
              }}
            >
              <Shield size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#f1f5f9', fontFamily: "'Space Grotesk',sans-serif" }}>
              Smart
            </span>
            <span style={{ fontWeight: 300, fontSize: 14, color: '#475569' }}>Attendance</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            <span className="text-xs mr-1 hidden sm:block" style={{ color: '#475569' }}>Follow us</span>
            {socialLinks.map(s => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                title={s.name}
                className="p-2.5 rounded-full text-white transition-all duration-200 hover:scale-110"
                style={{ background: s.bg, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
              >
                {s.icon}
              </a>
            ))}
          </div>

          {/* Status + copyright */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#10b981' }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#10b981' }} />
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#10b981', fontFamily: "'JetBrains Mono',monospace" }}>
                ONLINE
              </span>
            </div>
            <p style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: '#475569' }}>
              © {year} ·{' '}
              <a
                href="https://www.docuflux.in"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#6366f1' }}
                className="hover:underline"
              >
                DocuFlux Team
              </a>
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
