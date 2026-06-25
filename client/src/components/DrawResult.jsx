import React from 'react';

const DrawResult = ({ draw }) => {
  if (!draw) {
    return (
      <div className="card" style={styles.noDrawCard}>
        <span style={styles.golfClubIcon}>🏌️‍♂️</span>
        <h4 style={{ marginBottom: '0.25rem' }}>No Active Draw Result</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Check back later for the current month's official lottery numbers and winner lists!
        </p>
      </div>
    );
  }

  // Convert "2026-06" style date format to "June 2026"
  const formatMonth = (monthStr) => {
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(year, parseInt(month) - 1, 1);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    } catch (e) {
      return monthStr;
    }
  };

  return (
    <div className="card" style={styles.card}>
      <div style={styles.header}>
        <div>
          <span className="badge badge-warning" style={{ marginBottom: '0.5rem' }}>Latest Official Results</span>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 0 }}>Draw Period: {formatMonth(draw.month)}</h2>
        </div>
        <div style={styles.poolInfo}>
          <div style={styles.poolLabel}>Total Contribution Pool</div>
          <div style={styles.poolValue}>${draw.totalPool.toFixed(2)}</div>
        </div>
      </div>

      {/* Drawn Numbers Section */}
      <div style={styles.ballSection}>
        <div style={styles.ballsContainer}>
          {draw.drawnNumbers.map((num, i) => (
            <div key={i} className="lottery-ball">
              {num}
            </div>
          ))}
        </div>
      </div>

      {/* Rollover Alert Banner */}
      {draw.jackpotRolled && (
        <div className="badge badge-danger" style={styles.rolloverAlert}>
          ⚠️ JACKPOT ROLLED OVER! No participant matched 5 numbers. The Tier-1 jackpot rolls over to the next drawing.
        </div>
      )}

      {/* Tier Pools Display */}
      <div style={styles.tiersGrid}>
        <div style={styles.tierCard}>
          <div style={styles.tierHeader}>
            <span style={styles.tierTitle1}>🥇 Tier 1 (Match 5)</span>
            <span style={styles.tierValue}>${draw.jackpotPool.toFixed(2)}</span>
          </div>
          <p style={styles.tierDesc}>40% of pool + carry-over jackpot</p>
        </div>
        
        <div style={styles.tierCard}>
          <div style={styles.tierHeader}>
            <span style={styles.tierTitle2}>🥈 Tier 2 (Match 4)</span>
            <span style={styles.tierValue}>${draw.matchFour.toFixed(2)}</span>
          </div>
          <p style={styles.tierDesc}>35% of drawing pool</p>
        </div>

        <div style={styles.tierCard}>
          <div style={styles.tierHeader}>
            <span style={styles.tierTitle3}>🥉 Tier 3 (Match 3)</span>
            <span style={styles.tierValue}>${draw.matchThree.toFixed(2)}</span>
          </div>
          <p style={styles.tierDesc}>25% of drawing pool</p>
        </div>
      </div>

      {/* Draw Winners Detail */}
      {draw.winners && draw.winners.length > 0 ? (
        <div style={styles.winnersSection}>
          <h4 style={styles.winnersTitle}>Draw Winners ({draw.winners.length})</h4>
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table className="data-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Subscriber</th>
                  <th>Matching Balls</th>
                  <th>Share Amount</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {draw.winners.map((winner) => (
                  <tr key={winner.id}>
                    <td>{winner.user?.name || 'Anonymous'}</td>
                    <td>{winner.matchCount} numbers matched</td>
                    <td style={{ fontWeight: '700', color: 'var(--accent)' }}>${winner.prizeAmount.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${
                        winner.status === 'paid' ? 'badge-success' : 
                        winner.status === 'approved' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {winner.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={styles.noWinnersText}>No subscribers matched 3 or more balls in this drawing.</div>
      )}
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  noDrawCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2rem',
    textAlign: 'center',
    backgroundColor: 'var(--bg-card)',
  },
  golfClubIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1rem',
  },
  poolInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  poolLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  poolValue: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--primary)',
  },
  ballSection: {
    display: 'flex',
    justifyContent: 'center',
    padding: '1.5rem 0',
    backgroundColor: 'hsl(220, 18%, 10%)',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
  },
  ballsContainer: {
    display: 'flex',
    gap: '1rem',
  },
  rolloverAlert: {
    width: '100%',
    textAlign: 'center',
    padding: '0.75rem',
    fontSize: '0.85rem',
    borderRadius: '8px',
    display: 'block',
  },
  tiersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  tierCard: {
    backgroundColor: 'hsl(220, 18%, 10%)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '1rem',
  },
  tierHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.25rem',
  },
  tierTitle1: {
    fontWeight: '600',
    color: 'var(--accent)',
    fontSize: '0.9rem',
  },
  tierTitle2: {
    fontWeight: '600',
    color: 'hsl(0, 0%, 90%)',
    fontSize: '0.9rem',
  },
  tierTitle3: {
    fontWeight: '600',
    color: 'hsl(25, 40%, 65%)',
    fontSize: '0.9rem',
  },
  tierValue: {
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  tierDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  winnersSection: {
    marginTop: '0.5rem',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '1rem',
    backgroundColor: 'hsl(220, 18%, 10%)',
  },
  winnersTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.5rem',
    color: 'var(--text-primary)',
  },
  noWinnersText: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    padding: '0.5rem 0',
  }
};

export default DrawResult;
