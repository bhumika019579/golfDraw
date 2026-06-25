import React, { useState, useEffect } from 'react';
import { subscriptionAPI, drawAPI, charitiesAPI, authAPI, adminAPI } from '../api';
import ScoreForm from '../components/ScoreForm';
import DrawResult from '../components/DrawResult';

const Dashboard = () => {
  // User Session State
  const [user, setUser] = useState(null);

  // Dashboard Content State
  const [latestDraw, setLatestDraw] = useState(null);
  const [winnings, setWinnings] = useState([]);
  const [charities, setCharities] = useState([]);

  // Modals & UI Toggles
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [showCharityEdit, setShowCharityEdit] = useState(false);

  // Charity Edit Inputs
  const [editCharityId, setEditCharityId] = useState('');
  const [editPercent, setEditPercent] = useState(10);

  // File upload state (mapping winnerId -> file)
  const [uploadFiles, setUploadFiles] = useState({});
  const [uploadingWinnerId, setUploadingWinnerId] = useState(null);

  // Status & Feedback alerts
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [charityLoading, setCharityLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setEditCharityId(parsed.charityId || '');
      setEditPercent(parsed.charityPercent || 10);
    }
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const plan = params.get('plan');

    if (payment === 'success' && plan) {
      subscriptionAPI.confirm(plan).then((res) => {
        localStorage.setItem('user', JSON.stringify(res.user));
        setUser(res.user);
        setSuccess('Payment successful! You are now a Premium subscriber. 🎉');
        window.history.replaceState({}, '', '/dashboard');
        fetchDashboardData();
      }).catch((err) => {
        console.error(err);
        setError('Payment received but activation failed. Contact support.');
      });
    } else if (payment === 'cancelled') {
      setError('Payment was cancelled.');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const draw = await drawAPI.getLatestDraw();
      setLatestDraw(draw);
    } catch (err) {
      console.log('No published draws available yet.');
    }

    try {
      const wins = await drawAPI.getWinnings();
      setWinnings(wins);
    } catch (err) {
      console.error('Error fetching winnings:', err);
    }

    try {
      const list = await charitiesAPI.getCharities();
      setCharities(list);
    } catch (err) {
      console.error('Error fetching charities:', err);
    }
  };

  const handleSubscribe = async () => {
    setError('');
    setSuccess('');
    setSubLoading(true);

    try {
      const res = await subscriptionAPI.createCheckout(selectedPlan);
      window.location.href = res.url;
    } catch (err) {
      console.error(err);
      setError('Failed to initiate payment. Please try again.');
    } finally {
      setSubLoading(false);
    }
  };

  const handleCharityUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCharityLoading(true);

    const percent = parseFloat(editPercent);
    if (isNaN(percent) || percent < 10) {
      setError('Charity split contribution must be at least 10%.');
      setCharityLoading(false);
      return;
    }

    try {
      const updatedUser = await authAPI.updateProfile(editCharityId, percent);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccess('Charity contribution preferences updated successfully!');
      setShowCharityEdit(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update charity configurations.');
    } finally {
      setCharityLoading(false);
    }
  };

  const handleFileChange = (winnerId, e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFiles(prev => ({ ...prev, [winnerId]: file }));
    }
  };

  const handleUploadProof = async (winnerId) => {
    const file = uploadFiles[winnerId];
    if (!file) {
      alert('Please select an image file first.');
      return;
    }

    setError('');
    setSuccess('');
    setUploadingWinnerId(winnerId);

    try {
      await adminAPI.uploadWinnerProof(winnerId, file);
      setSuccess('Proof image uploaded successfully! Admin will verify soon.');
      setUploadFiles(prev => {
        const copy = { ...prev };
        delete copy[winnerId];
        return copy;
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Proof upload error:', err);
      setError('Failed to upload proof image.');
    } finally {
      setUploadingWinnerId(null);
    }
  };

  if (!user) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading user session...</div>;
  }

  const selectedCharity = charities.find(c => c.id === user.charityId);

  return (
    <div style={styles.container}>
      <div style={styles.titleSection}>
        <h1 style={{ marginBottom: 0 }}>Subscriber Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your numbers, link charities, and check draw payouts.</p>
      </div>

      {error && <div className="badge badge-danger" style={styles.alert}>{error}</div>}
      {success && <div className="badge badge-success" style={styles.alert}>{success}</div>}

      <div style={styles.topSection}>
        <div className="card" style={styles.card}>
          <h3>Subscription Plan</h3>
          {user.isSubscribed ? (
            <div style={styles.subActiveContent}>
              <div style={styles.statusBadgeRow}>
                <span className="badge badge-success">Active Premium Account</span>
                <span style={styles.priceTag}>{user.subscriptionPlan === 'monthly' ? '$5 / Month' : '$50 / Year'}</span>
              </div>
              <p style={styles.subDetail}>
                <strong>Subscribed Since:</strong> {user.subscriptionDate ? new Date(user.subscriptionDate).toLocaleDateString() : 'N/A'}
              </p>
              <p style={styles.subDetail}>Your numbers are officially entered in all monthly lotteries. Good luck!</p>
            </div>
          ) : (
            <div style={styles.subInactiveContent}>
              <div className="badge badge-danger" style={{ marginBottom: '1rem', width: 'fit-content' }}>
                Unsubscribed (Free Account)
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                You are currently not entered in drawings. Subscribe today for $5 to activate your tickets and support your designated charity.
              </p>
              <button onClick={() => setShowSubModal(true)} className="btn btn-primary">
                Subscribe Now
              </button>
            </div>
          )}
        </div>

        <div className="card" style={styles.card}>
          <div style={styles.cardHeaderWithButton}>
            <h3>Linked Charity</h3>
            <button onClick={() => setShowCharityEdit(!showCharityEdit)} className="btn btn-secondary btn-sm">
              {showCharityEdit ? 'Cancel' : 'Change Preference'}
            </button>
          </div>

          {!showCharityEdit ? (
            <div style={styles.charityDisplay}>
              {selectedCharity ? (
                <div style={styles.charityRow}>
                  {selectedCharity.imageUrl && (
                    <img src={selectedCharity.imageUrl} alt={selectedCharity.name} style={styles.charityImg} />
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0' }}>{selectedCharity.name}</h4>
                    <p style={styles.charityDescLimit}>{selectedCharity.description}</p>
                    <span className="badge badge-info" style={{ marginTop: '0.5rem' }}>
                      💝 Contributing: {user.charityPercent}% of subscription fees
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No charity linked. Click "Change Preference" to support a cause.</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleCharityUpdate} style={styles.charityForm}>
              <div className="form-group">
                <label className="form-label">Choose Charity</label>
                <select
                  value={editCharityId}
                  onChange={(e) => setEditCharityId(e.target.value)}
                  className="form-input form-select"
                  required
                >
                  <option value="">-- Select Charity --</option>
                  {charities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contribution Share (Min 10%)</label>
                <input
                  type="number" min="10" max="100" step="0.5"
                  value={editPercent}
                  onChange={(e) => setEditPercent(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={charityLoading}>
                {charityLoading ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div style={styles.sectionHeader}>
        <h2>Your Golf Scores</h2>
      </div>
      <ScoreForm />

      <div style={{ marginTop: '2rem' }}>
        <div style={styles.sectionHeader}>
          <h2>Winnings History</h2>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          {winnings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              No winnings records found. Keep entering scores and checking drawings!
            </p>
          ) : (
            <div className="table-container" style={{ border: 'none', margin: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Draw Period</th>
                    <th>Numbers Matched</th>
                    <th>Prize Awarded</th>
                    <th>Status</th>
                    <th>Proof Screenshot</th>
                  </tr>
                </thead>
                <tbody>
                  {winnings.map((win) => (
                    <tr key={win.id}>
                      <td>{win.draw?.month ? new Date(win.draw.month + '-02').toLocaleDateString(undefined, { year: 'numeric', month: 'long', timeZone: 'UTC' }) : 'N/A'}</td>
                      <td>{win.matchCount} numbers matched</td>
                      <td style={{ fontWeight: '700', color: 'var(--accent)' }}>${win.prizeAmount.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${win.status === 'paid' ? 'badge-success' : win.status === 'approved' ? 'badge-info' : 'badge-warning'}`}>
                          {win.status}
                        </span>
                      </td>
                      <td>
                        {win.proofUrl ? (
                          <div style={styles.proofPreviewRow}>
                            <a href={win.proofUrl} target="_blank" rel="noopener noreferrer" style={styles.proofLink}>
                              [View Uploaded Proof]
                            </a>
                            <img src={win.proofUrl} alt="Winner Proof Preview" style={styles.proofThumb} />
                          </div>
                        ) : win.status === 'pending' ? (
                          <div style={styles.uploadGroup}>
                            <input
                              type="file" accept="image/*"
                              onChange={(e) => handleFileChange(win.id, e)}
                              style={styles.fileInput}
                              id={`file-${win.id}`}
                            />
                            <label htmlFor={`file-${win.id}`} className="btn btn-secondary btn-sm" style={styles.fileLabel}>
                              {uploadFiles[win.id] ? uploadFiles[win.id].name : 'Select File'}
                            </label>
                            <button
                              onClick={() => handleUploadProof(win.id)}
                              className="btn btn-primary btn-sm"
                              disabled={uploadingWinnerId === win.id || !uploadFiles[win.id]}
                            >
                              {uploadingWinnerId === win.id ? 'Uploading...' : 'Submit'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No proof required</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '2.5rem' }}>
        <div style={styles.sectionHeader}>
          <h2>Latest Drawings</h2>
        </div>
        <div style={{ maxWidth: '750px', margin: '0 auto' }}>
          <DrawResult draw={latestDraw} />
        </div>
      </div>

      {showSubModal && (
        <div className="modal-overlay" onClick={() => setShowSubModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={styles.modalWidth}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Activate GolfDraw Premium</h3>
              <button onClick={() => setShowSubModal(false)} style={styles.closeBtn}>&times;</button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Choose your plan and complete payment via Stripe's secure checkout.
            </p>

            <div style={styles.planSelector}>
              <label style={{
                ...styles.planOption,
                borderColor: selectedPlan === 'monthly' ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: selectedPlan === 'monthly' ? 'rgba(34, 197, 94, 0.05)' : 'transparent'
              }}>
                <input type="radio" name="plan" value="monthly" checked={selectedPlan === 'monthly'}
                  onChange={() => setSelectedPlan('monthly')} style={{ marginRight: '0.5rem' }} />
                <div>
                  <div style={{ fontWeight: '600' }}>Monthly Premium</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>$5.00 / month</div>
                </div>
              </label>

              <label style={{
                ...styles.planOption,
                borderColor: selectedPlan === 'yearly' ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: selectedPlan === 'yearly' ? 'rgba(34, 197, 94, 0.05)' : 'transparent'
              }}>
                <input type="radio" name="plan" value="yearly" checked={selectedPlan === 'yearly'}
                  onChange={() => setSelectedPlan('yearly')} style={{ marginRight: '0.5rem' }} />
                <div>
                  <div style={{ fontWeight: '600' }}>Yearly Premium</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>$50.00 / year (Save 16%)</div>
                </div>
              </label>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '0.5rem' }}>
              🔒 You will be redirected to Stripe's secure checkout page.
            </p>

            <button
              onClick={handleSubscribe}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }}
              disabled={subLoading}
            >
              {subLoading ? 'Redirecting to Stripe...' : 'Pay Now & Subscribe'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' },
  titleSection: { borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' },
  alert: { width: '100%', textAlign: 'center', padding: '0.75rem', borderRadius: '8px', display: 'block' },
  topSection: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' },
  card: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' },
  cardHeaderWithButton: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  subActiveContent: { display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', justifyContent: 'center' },
  statusBadgeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  priceTag: { fontWeight: '700', fontSize: '1.1rem', color: 'var(--primary)' },
  subDetail: { fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 },
  subInactiveContent: { display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' },
  charityDisplay: { display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' },
  charityRow: { display: 'flex', gap: '1.25rem', alignItems: 'center' },
  charityImg: { width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-color)' },
  charityDescLimit: { fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  charityForm: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' },
  sectionHeader: { borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '1rem' },
  modalWidth: { maxWidth: '480px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' },
  planSelector: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' },
  planOption: { display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem 1rem', cursor: 'pointer', transition: 'var(--transition)' },
  uploadGroup: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  fileInput: { display: 'none' },
  fileLabel: { padding: '0.4rem 0.8rem', fontSize: '0.85rem', textOverflow: 'ellipsis', maxWidth: '120px', overflow: 'hidden', whiteSpace: 'nowrap', display: 'inline-block' },
  proofPreviewRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  proofLink: { color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' },
  proofThumb: { width: '45px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }
};

export default Dashboard;