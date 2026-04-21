import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 24px',
          background: '#0e1220',
          color: '#f1f5f9',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          borderRadius: '24px',
          border: '1px solid rgba(244,63,94,0.2)',
          margin: '20px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(244,63,94,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', fontFamily: "'Space Grotesk', sans-serif" }}>
            Something went wrong
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '400px', marginBottom: '24px', lineHeight: '1.6' }}>
            An unexpected error occurred in this section of the application. Our team has been notified.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: 'white',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79,70,229,0.3)'
            }}
          >
            Reload Page
          </button>
          
          <details style={{ marginTop: '32px', textAlign: 'left', width: '100%', maxWidth: '600px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', fontSize: '12px', color: '#64748b' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>View technical details</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono', monospace" }}>
              {this.state.error && this.state.error.toString()}
              {"\n"}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
