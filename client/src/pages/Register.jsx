import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, charitiesAPI } from '../api';

const Register = () => {
  const navigate = useNavigate();
  const [charities, setCharities] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [charityId, setCharityId] = useState('');
  const [charityPercent, setCharityPercent] = useState(10);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      const data = await charitiesAPI.getCharities();
      setCharities(data);
      if (data.length > 0) {
        setCharityId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching charities for registration:', err);
    }
  };

  // Quick demo login — same logic as Login.jsx
  const performLogin = async (loginEmail, loginPassword) => {
    setError('');
    setLoading(true);
    try {
      const data = await authAPI.login(loginEmail, loginPassword);
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Quick login failed. Please try manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    if (role === 'admin') {
      performLogin('admin@golfdraw.com', 'admin123');
    } else {
      performLogin('john@golfdraw.com', 'sub123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    const percent = parseFloat(charityPercent);
    if (isNaN(percent) || percent < 10) {
      setError('Charity support percentage must be at least 10%.');
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.register(name, email, password, charityId || null, percent);
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.error || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="card" style={styles.registerCard}>

        {/* Header */}
        <div style={styles.header}>
          <span style={styles.logoMark}>⛳</span>
          <h2 style={{ margin: 0 }}>Join GolfDraw</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Create an account or use a demo account to explore the platform.
          </p>
        </div>

        {error && <div className="badge badge-danger" style={styles.alert}>{error}</div>}

        {/* Quick Demo Access */}
        <div style={styles.quickSection}>
          <p style={styles.quickLabel}>Already have an account? Quick Access</p>
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
          <span style={styles.dividerText}>or create a new account</span>
          <span style={styles.dividerLine} />
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Min 6 characters"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Charity to Support *</label>
            {charities.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading charities list...</p>
            ) : (
              <select
                value={charityId}
                onChange={(e) => setCharityId(e.target.value)}
                className="form-input form-select"
                required
              >
                {charities.map((charity) => (
                  <option key={charity.id} value={charity.id}>
                    {charity.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Charity Contribution % (Min 10%) *</label>
            <input
              type="number"
              min="10"
              max="100"
              step="0.5"
              value={charityPercent}
              onChange={(e) => setCharityPercent(e.target.value)}
              className="form-input"
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
              Percentage of your mock subscription fee directed to your chosen charity.
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.25rem', padding: '0.8rem' }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account & Join'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>Already have your own account? </span>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
            Sign In
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
    padding: '2rem 1rem',
  },
  registerCard: {
    maxWidth: '480px',
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

export default Register;
