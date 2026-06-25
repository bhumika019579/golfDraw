import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { drawAPI } from '../api';
import DrawResult from '../components/DrawResult';

const Home = () => {
  const [latestDraw, setLatestDraw] = useState(null);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!localStorage.getItem('accessToken');

  useEffect(() => {
    fetchLatestDraw();
  }, []);

  const fetchLatestDraw = async () => {
    try {
      const draw = await drawAPI.getLatestDraw();
      setLatestDraw(draw);
    } catch (err) {
      console.log('No published drawings yet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <span className="badge badge-success" style={{ marginBottom: '1rem', padding: '0.4rem 0.8rem' }}>
            ⛳ The Charity Golf Lottery
          </span>
          <h1 style={styles.heroTitle}>
            Play Golf. <span className="text-gradient">Win Cash.</span> <br />
            Support Noble Causes.
          </h1>
          <p style={styles.heroSubtitle}>
            GolfDraw is a subscription-based golf score lottery. Enter your weekly golf scores, select a charity, and win shares of cash prizes funded by players worldwide.
          </p>
          <div style={styles.ctaGroup}>
            {isLoggedIn ? (
              <Link to="/dashboard" className="btn btn-primary" style={styles.ctaBtn}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary" style={styles.ctaBtn}>
                  Join GolfDraw Now
                </Link>
                <Link to="/charities" className="btn btn-secondary" style={styles.ctaBtn}>
                  Explore Charities
                </Link>
              </>
            )}
          </div>
        </div>
        <div style={styles.heroVisual}>
          <div style={styles.visualCard}>
            <span style={styles.visualIcon}>💰</span>
            <div style={styles.visualDetails}>
              <h4 style={{ margin: 0 }}>Current Jackpot Estimator</h4>
              <p style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '1.8rem', margin: '0.2rem 0' }}>$2,500.00</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Funded by 500+ active golfers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Grid */}
      <section style={styles.highlights}>
        <div style={styles.sectionHeader}>
          <h2>How GolfDraw Works</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Three simple steps to play, win, and make an impact.</p>
        </div>

        <div className="grid grid-cols-3">
          <div className="card" style={styles.stepCard}>
            <div style={styles.stepNum}>1</div>
            <h3>Subscribe & Link Charity</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Subscribe for $5/month. Choose one of our verified charities and determine your contribution percentage (min 10%).
            </p>
          </div>

          <div className="card" style={styles.stepCard}>
            <div style={styles.stepNum}>2</div>
            <h3>Submit Golf Scores</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Log up to 5 golf scores (numbers 1-45). Your entries are stored in the database. Add new ones to overwrite the oldest.
            </p>
          </div>

          <div className="card" style={styles.stepCard}>
            <div style={styles.stepNum}>3</div>
            <h3>Match to Win Prizes</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Each month, we draw 5 random numbers. Match 3, 4, or 5 numbers to claim a split share of the accumulated monthly jackpot!
            </p>
          </div>
        </div>
      </section>

      {/* Latest Drawings Section */}
      <section style={styles.drawSection}>
        <div style={styles.sectionHeader}>
          <h2>Latest Live Results</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Check out the numbers and winners from our most recent draw.</p>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading latest results...</div>
        ) : (
          <div style={styles.drawWrapper}>
            <DrawResult draw={latestDraw} />
          </div>
        )}
      </section>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4rem',
    paddingBottom: '4rem',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    alignItems: 'center',
    gap: '3rem',
    padding: '3rem 0',
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: '3rem',
    lineHeight: '1.15',
    marginBottom: '1.25rem',
  },
  heroSubtitle: {
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    marginBottom: '2rem',
    maxWidth: '500px',
  },
  ctaGroup: {
    display: 'flex',
    gap: '1rem',
    width: '100%',
    flexWrap: 'wrap',
  },
  ctaBtn: {
    padding: '0.85rem 1.75rem',
  },
  heroVisual: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualCard: {
    background: 'linear-gradient(135deg, hsl(220, 18%, 15%) 0%, hsl(220, 18%, 10%) 100%)',
    border: '2px dashed hsla(142, 70%, 45%, 0.3)',
    borderRadius: '24px',
    padding: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    boxShadow: 'var(--shadow-lg)',
    width: '100%',
    maxWidth: '400px',
  },
  visualIcon: {
    fontSize: '3rem',
  },
  visualDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  highlights: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2.5rem',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '0.5rem',
  },
  stepCard: {
    position: 'relative',
    paddingTop: '2.5rem',
  },
  stepNum: {
    position: 'absolute',
    top: '-15px',
    left: '20px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: 'hsl(220, 18%, 8%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: '800',
  },
  drawSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  drawWrapper: {
    maxWidth: '750px',
    width: '100%',
    margin: '0 auto',
  }
};

export default Home;
