import React, { useState, useEffect } from 'react';
import { scoresAPI } from '../api';

const ScoreForm = () => {
  const [scores, setScores] = useState([]);
  const [value, setValue] = useState('');
  const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const data = await scoresAPI.getScores();
      setScores(data);
    } catch (err) {
      console.error('Error fetching scores:', err);
      setError('Failed to retrieve score history.');
    }
  };

  const resetForm = () => {
    setValue('');
    setDate('');
    setEditingId(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const val = parseInt(value, 10);
    if (isNaN(val) || val < 1 || val > 45) {
      setError('Score value must be a whole number between 1 and 45.');
      return;
    }

    if (!date) {
      setError('A play date is required.');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await scoresAPI.updateScore(editingId, val, date);
        setSuccess('Score updated successfully!');
      } else {
        await scoresAPI.addScore(val, date);
        setSuccess('Score added! The oldest score was removed to keep your entries limited to 5.');
      }
      resetForm();
      fetchScores();
    } catch (err) {
      console.error('Error submitting score:', err);
      setError(err.response?.data?.error || 'Failed to submit score. Duplicate dates are not allowed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (score) => {
    setEditingId(score.id);
    setValue(score.value);
    
    // Format UTC ISO string representation to local YYYY-MM-DD
    const isoDate = score.date.substring(0, 10);
    setDate(isoDate);
    
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this score?')) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await scoresAPI.deleteScore(id);
      setSuccess('Score deleted successfully.');
      if (editingId === id) {
        resetForm();
      }
      fetchScores();
    } catch (err) {
      console.error('Error deleting score:', err);
      setError('Failed to delete score entry.');
    }
  };

  return (
    <div style={styles.container}>
      {/* Entry Form */}
      <div className="card" style={styles.formCard}>
        <h3 style={styles.title}>{editingId ? 'Edit Golf Score' : 'Add Golf Score'}</h3>
        <p style={styles.subtext}>
          Submit weekly golf scores. Value must be 1 to 45. GolfDraw stores up to 5 entries. Adding a 6th removes your oldest score.
        </p>

        {error && <div className="badge badge-danger" style={styles.alert}>{error}</div>}
        {success && <div className="badge badge-success" style={styles.alert}>{success}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Score Value (1-45)</label>
            <input
              type="number"
              min="1"
              max="45"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="form-input"
              placeholder="e.g., 27"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Date Played</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div style={styles.btnGroup}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Entry' : 'Add Score Entry'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List display */}
      <div className="card" style={styles.listCard}>
        <h3 style={styles.title}>Active Lottery Numbers ({scores.length}/5)</h3>
        <p style={styles.subtext}>
          These scores represent your tickets in drawings while you are subscribed.
        </p>

        {scores.length === 0 ? (
          <div style={styles.emptyContainer}>
            <span style={styles.emptyIcon}>🏌️</span>
            <p style={styles.emptyText}>No scores registered. Submit a score to begin!</p>
          </div>
        ) : (
          <div className="table-container" style={{ marginTop: '0.5rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date Played</th>
                  <th>Ball Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score) => (
                  <tr key={score.id}>
                    <td>{new Date(score.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}</td>
                    <td>
                      <span className="lottery-ball" style={{ width: '38px', height: '38px', fontSize: '0.95rem' }}>
                        {score.value}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleEdit(score)}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(score.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    marginTop: '1rem',
  },
  formCard: {
    display: 'flex',
    flexDirection: 'column',
  },
  listCard: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    marginBottom: '0.25rem',
  },
  subtext: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
  },
  alert: {
    marginBottom: '1rem',
    width: '100%',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    textAlign: 'center',
    display: 'block',
  },
  form: {
    marginTop: '0.5rem',
  },
  btnGroup: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1.5rem',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    textAlign: 'center',
    flexGrow: 1,
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
  },
};

export default ScoreForm;
