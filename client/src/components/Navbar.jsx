import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('accessToken');
  const userString = localStorage.getItem('user');
  let user = null;

  if (userString) {
    try {
      user = JSON.parse(userString);
    } catch (e) {
      console.error(e);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.navbar}>
      <div style={styles.brand}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>⛳</span> 
          <span style={styles.logoText}>Golf<span className="text-gradient">Draw</span></span>
        </Link>
      </div>
      
      <div style={styles.navLinks}>
        <Link 
          to="/charities" 
          style={{
            ...styles.link,
            color: isActive('/charities') ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          Charities
        </Link>
        {user && (
          <>
            <Link 
              to="/dashboard" 
              style={{
                ...styles.link,
                color: isActive('/dashboard') ? 'var(--primary)' : 'var(--text-secondary)'
              }}
            >
              Dashboard
            </Link>
            {user.role === 'admin' && (
              <Link 
                to="/admin" 
                style={{
                  ...styles.linkAdmin,
                  color: isActive('/admin') ? 'var(--accent)' : 'var(--accent)'
                }}
              >
                Admin Panel
              </Link>
            )}
          </>
        )}
      </div>

      <div style={styles.actions}>
        {user ? (
          <div style={styles.userProfile}>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user.name}</span>
              <span style={styles.userRole}>{user.role}</span>
            </div>
            {user.role === 'subscriber' && (
              <span className={`badge ${user.isSubscribed ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.75rem' }}>
                {user.isSubscribed ? 'Premium' : 'Free Account'}
              </span>
            )}
            <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.8rem', marginLeft: '0.5rem' }}>
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'var(--bg-card)',
    borderBottom: '1px solid var(--border-color)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: {
    fontWeight: '800',
    fontSize: '1.4rem',
  },
  logo: {
    textDecoration: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    fontSize: '1.6rem',
  },
  logoText: {
    fontWeight: '800',
    fontFamily: 'var(--font-sans)',
    letterSpacing: '-0.03em',
  },
  navLinks: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
  },
  link: {
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '0.95rem',
    transition: 'var(--transition)',
  },
  linkAdmin: {
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'var(--transition)',
    border: '1px solid hsla(45, 95%, 50%, 0.3)',
    borderRadius: '6px',
    padding: '0.2rem 0.6rem',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    lineHeight: '1.2',
  },
  userName: {
    fontWeight: '600',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  userRole: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'capitalize',
  }
};

export default Navbar;
