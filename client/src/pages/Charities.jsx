import React, { useState, useEffect } from 'react';
import { charitiesAPI } from '../api';

const Charities = () => {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      const data = await charitiesAPI.getCharities();
      setCharities(data);
    } catch (err) {
      console.error('Error retrieving charities:', err);
      setError('Could not retrieve charities list. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span className="badge badge-success" style={{ marginBottom: '0.5rem', padding: '0.35rem 0.75rem' }}>
          Impact Partnerships
        </span>
        <h1 style={styles.title}>Partner Charities</h1>
        <p style={styles.subtitle}>
          GolfDraw is proud to back non-profits driving environmental conservancy, education, and youth sports. A percentage of your mock subscription is donated monthly.
        </p>
      </div>

      {error && <div className="badge badge-danger" style={styles.alert}>{error}</div>}

      {loading ? (
        <div style={styles.loadingState}>Loading partner charities...</div>
      ) : charities.length === 0 ? (
        <div style={styles.emptyState}>
          <span>🍃</span>
          <p>No charity partners registered yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3">
          {charities.map((charity) => (
            <div key={charity.id} className="card" style={styles.charityCard}>
              <div style={styles.imageWrapper}>
                {charity.imageUrl ? (
                  <img src={charity.imageUrl} alt={charity.name} style={styles.cardImage} />
                ) : (
                  <div style={styles.imagePlaceholder}>⛳</div>
                )}
              </div>
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{charity.name}</h3>
                <p style={styles.cardDesc}>{charity.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    paddingBottom: '4rem',
  },
  header: {
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto 3rem auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '0.75rem',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1.05rem',
    lineHeight: '1.5',
  },
  alert: {
    width: '100%',
    textAlign: 'center',
    padding: '0.75rem',
    marginBottom: '2rem',
    borderRadius: '8px',
    display: 'block',
  },
  loadingState: {
    textAlign: 'center',
    padding: '4rem',
    color: 'var(--text-secondary)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '4rem',
    color: 'var(--text-muted)',
    fontSize: '1.2rem',
    gap: '0.5rem',
  },
  charityCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    overflow: 'hidden',
  },
  imageWrapper: {
    height: '180px',
    backgroundColor: 'hsl(220, 18%, 10%)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'var(--transition)',
  },
  imagePlaceholder: {
    fontSize: '3rem',
    opacity: 0.25,
  },
  cardBody: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  cardTitle: {
    fontSize: '1.2rem',
    margin: 0,
  },
  cardDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    lineHeight: '1.45',
  }
};

export default Charities;
