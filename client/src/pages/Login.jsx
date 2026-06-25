import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const performLogin = async (loginEmail, loginPassword) => {
    setError('');
    setLoading(true);
    try {
      const data = await authAPI.login(loginEmail, loginPassword);

      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    await performLogin(email, password);
  };

  const handleQuickLogin = async (role) => {
    if (role === 'admin') {
      setEmail('admin@golfdraw.com');
      setPassword('admin123');
      await performLogin('admin@golfdraw.com', 'admin123');
    } else {
      setEmail('john@golfdraw.com');
      setPassword('sub123');
      await performLogin('john@golfdraw.com', 'sub123');
    }
  };

  return (
    <div style={styles.container}>
      <div className="card" style={styles.loginCard}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.logoMark}>⛳</span>
          <h2 style={{ margin: 0 }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Log in to manage your scores, view draws, and track contributions.
          </p>
        </div>

        {error && <div className="badge badge-danger" style={styles.alert}>{error}</div>}

        {/* Quick Access Buttons */}
        <div style={styles.quickSection}>
          <p style={styles.quickLabel}>Quick Access — Demo Accounts</p>
          <div style={styles.quickBtns}>
            <button
              type="button"
              onClick={() => handleQuickLogin('user')}
              disabled={loading}
              style={styles.quickBtnUser}
            >
              <span style={styles.quickIcon}>🏌️</span>
              <div style={styles.quickBtnText}>
                <span style={styles.quickBtnTitle}>Sign in as User</span>
                <span style={styles.quickBtnSub}>john@golfdraw.com</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              disabled={loading}
              style={styles.quickBtnAdmin}
            >
              <span style={styles.quickIcon}>🛡️</span>
              <div style={styles.quickBtnText}>
                <span style={styles.quickBtnTitle}>Sign in as Admin</span>
                <span style={styles.quickBtnSub}>admin@golfdraw.com</span>
              </div>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or sign in manually</span>
          <span style={styles.dividerLine} />
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.8rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>Don't have an account? </span>
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    padding: '1rem',
  },
  loginCard: {
    maxWidth: '460px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    paddingBottom: '0.5rem',
  },
  logoMark: {
    fontSize: '2.5rem',
  },
  alert: {
    width: '100%',
    textAlign: 'center',
    padding: '0.6rem 1rem',
    borderRadius: '6px',
    display: 'block',
  },
  quickSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  quickLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: 0,
    textAlign: 'center',
  },
  quickBtns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  quickBtnUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.9rem 1rem',
    borderRadius: '12px',
    border: '2px solid var(--primary)',
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
  },
  quickBtnAdmin: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.9rem 1rem',
    borderRadius: '12px',
    border: '2px solid var(--accent)',
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
  },
  quickIcon: {
    fontSize: '1.6rem',
    flexShrink: 0,
  },
  quickBtnText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  },
  quickBtnTitle: {
    fontWeight: '700',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  quickBtnSub: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'var(--border-color)',
    display: 'block',
  },
  dividerText: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },
  footer: {
    textAlign: 'center',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginTop: '0.5rem',
  },
};

export default Login;
