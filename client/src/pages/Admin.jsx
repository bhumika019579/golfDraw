import React, { useState, useEffect } from 'react';
import { adminAPI, drawAPI, charitiesAPI } from '../api';
import DrawResult from '../components/DrawResult';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [generalSuccess, setGeneralSuccess] = useState('');

  // Tab 1: Users State
  const [users, setUsers] = useState([]);

  // Tab 2: Draw Engine State
  const [monthInput, setMonthInput] = useState(new Date().toISOString().substring(0, 7));
  const [adminDraw, setAdminDraw] = useState(null);
  const [drawRunning, setDrawRunning] = useState(false);
  const [drawPublishing, setDrawPublishing] = useState(false);

  // Tab 3: Charities Management State
  const [charities, setCharities] = useState([]);
  const [charityName, setCharityName] = useState('');
  const [charityDesc, setCharityDesc] = useState('');
  const [charityImg, setCharityImg] = useState('');
  const [editingCharityId, setEditingCharityId] = useState(null);
  const [charitySaving, setCharitySaving] = useState(false);

  // Tab 4: Winners List State
  const [winners, setWinners] = useState([]);
  const [verifyingWinnerId, setVerifyingWinnerId] = useState(null);

  // Tab 5: All Scores State
  const [allScores, setAllScores] = useState([]);
  const [scoresSearchTerm, setScoresSearchTerm] = useState('');

  // Reload tab content on active tab click
  useEffect(() => {
    setGeneralError('');
    setGeneralSuccess('');
    loadTabContent();
  }, [activeTab]);

  const loadTabContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const list = await adminAPI.getUsers();
        setUsers(list);
      } else if (activeTab === 'draw') {
        // Load latest draw (including unpublished)
        const latest = await drawAPI.getLatestDraw();
        setAdminDraw(latest);
      } else if (activeTab === 'charities') {
        const list = await charitiesAPI.getCharities();
        setCharities(list);
      } else if (activeTab === 'winners') {
        const list = await adminAPI.getWinners();
        setWinners(list);
      } else if (activeTab === 'scores') {
        // Fetch all users with their scores for the admin scores view
        const userList = await adminAPI.getUsers();
        // Flatten all scores from all users into a single list
        const flatScores = [];
        userList.forEach(u => {
          if (u.scores && u.scores.length > 0) {
            u.scores.forEach(s => {
              flatScores.push({
                ...s,
                userName: u.name,
                userEmail: u.email,
                isSubscribed: u.isSubscribed,
              });
            });
          }
        });
        // Sort by date descending
        flatScores.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAllScores(flatScores);
      }
    } catch (err) {
      console.warn('Failed to load tab data. Standard fallback used.', err);
    } finally {
      setLoading(false);
    }
  };

  // Tab 1 Actions: Toggle User Subscription
  const handleToggleSubscription = async (userId, currentStatus) => {
    try {
      await adminAPI.toggleUserSubscription(userId, !currentStatus, 'monthly');
      setGeneralSuccess(`User subscription status updated successfully.`);
      
      // Update local state list
      setUsers(prev => prev.map(u => u.id === userId ? {
        ...u, 
        isSubscribed: !currentStatus,
        subscriptionPlan: !currentStatus ? 'monthly' : null,
        subscriptionDate: !currentStatus ? new Date() : null
      } : u));
    } catch (err) {
      console.error(err);
      setGeneralError('Failed to alter user subscription status.');
    }
  };

  // Tab 2 Actions: Trigger Draw Engine
  const handleRunDraw = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setGeneralSuccess('');
    setDrawRunning(true);

    try {
      const res = await drawAPI.runDraw(monthInput);
      setAdminDraw(res.draw);
      setGeneralSuccess(`Lottery Drawing executed! Drawn: ${res.draw.drawnNumbers.join(', ')}. Rollover jackpot status: ${res.draw.jackpotRolled}`);
    } catch (err) {
      console.error(err);
      setGeneralError(err.response?.data?.error || 'Failed to execute drawing. Draw for this month may already exist.');
    } finally {
      setDrawRunning(false);
    }
  };

  // Tab 2 Actions: Publish Draw
  const handlePublishDraw = async () => {
    if (!adminDraw) return;
    setGeneralError('');
    setGeneralSuccess('');
    setDrawPublishing(true);

    try {
      const res = await adminAPI.publishDraw(adminDraw.id);
      setAdminDraw(res.draw);
      setGeneralSuccess('Drawing results officially published! Subscribers can now view drawings on their dashboards.');
    } catch (err) {
      console.error(err);
      setGeneralError('Failed to publish draw results.');
    } finally {
      setDrawPublishing(false);
    }
  };

  // Tab 3 Actions: Add / Edit Charity CRUD
  const handleCharitySubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setGeneralSuccess('');
    setCharitySaving(true);

    try {
      if (editingCharityId) {
        await charitiesAPI.updateCharity(editingCharityId, charityName, charityDesc, charityImg);
        setGeneralSuccess('Charity updated successfully.');
      } else {
        await charitiesAPI.addCharity(charityName, charityDesc, charityImg);
        setGeneralSuccess('New charity created successfully.');
      }

      // Reset Form and reload
      setCharityName('');
      setCharityDesc('');
      setCharityImg('');
      setEditingCharityId(null);
      
      const list = await charitiesAPI.getCharities();
      setCharities(list);
    } catch (err) {
      console.error(err);
      setGeneralError('Failed to save charity changes.');
    } finally {
      setCharitySaving(false);
    }
  };

  const handleEditCharity = (charity) => {
    setEditingCharityId(charity.id);
    setCharityName(charity.name);
    setCharityDesc(charity.description);
    setCharityImg(charity.imageUrl || '');
  };

  const handleDeleteCharity = async (id) => {
    if (!window.confirm('Are you sure you want to delete this charity? All links in subscriber profiles will clear.')) return;
    setGeneralError('');
    setGeneralSuccess('');
    
    try {
      await charitiesAPI.deleteCharity(id);
      setGeneralSuccess('Charity deleted.');
      setCharities(prev => prev.filter(c => c.id !== id));
      if (editingCharityId === id) {
        setEditingCharityId(null);
        setCharityName('');
        setCharityDesc('');
        setCharityImg('');
      }
    } catch (err) {
      console.error(err);
      setGeneralError('Failed to delete charity.');
    }
  };

  // Tab 4 Actions: Verify Winner Claim Status
  const handleVerifyWinner = async (winnerId, nextStatus) => {
    setGeneralError('');
    setGeneralSuccess('');
    setVerifyingWinnerId(winnerId);

    try {
      await adminAPI.verifyWinner(winnerId, nextStatus);
      setGeneralSuccess(`Winner claim verification updated to: ${nextStatus}`);
      
      // Update local state list
      setWinners(prev => prev.map(w => w.id === winnerId ? { ...w, status: nextStatus } : w));
    } catch (err) {
      console.error(err);
      setGeneralError('Failed to verify winner claim.');
    } finally {
      setVerifyingWinnerId(null);
    }
  };

  return (
    <div style={styles.container}>
      {/* Title */}
      <div style={styles.titleSection}>
        <h1 style={{ marginBottom: 0 }}>Executive Admin Control Panel</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage the GolfDraw ecosystem database, run drawings, and payout winners.</p>
      </div>

      {generalError && <div className="badge badge-danger" style={styles.alert}>{generalError}</div>}
      {generalSuccess && <div className="badge badge-success" style={styles.alert}>{generalSuccess}</div>}

      {/* Navigation Tabs */}
      <div className="tabs-header">
        <button 
          onClick={() => setActiveTab('users')} 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
        >
          👥 User Subscriptions
        </button>
        <button 
          onClick={() => setActiveTab('draw')} 
          className={`tab-btn ${activeTab === 'draw' ? 'active' : ''}`}
        >
          🎲 Draw Engine
        </button>
        <button 
          onClick={() => setActiveTab('charities')} 
          className={`tab-btn ${activeTab === 'charities' ? 'active' : ''}`}
        >
          🏫 Charity Listings
        </button>
        <button 
          onClick={() => setActiveTab('winners')} 
          className={`tab-btn ${activeTab === 'winners' ? 'active' : ''}`}
        >
          🏆 Winners & Payouts
        </button>
        <button 
          onClick={() => setActiveTab('scores')} 
          className={`tab-btn ${activeTab === 'scores' ? 'active' : ''}`}
        >
          ⛳ All User Scores
        </button>
      </div>

      {/* Loading Overlay */}
      {loading ? (
        <div style={styles.loadingBlock}>Loading admin panel data...</div>
      ) : (
        <div style={styles.tabContent}>
          
          {/* Tab 1: User Management */}
          {activeTab === 'users' && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Registered Users DB</h3>
              <div className="table-container" style={{ border: 'none', margin: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Subscriber Name</th>
                      <th>Email</th>
                      <th>System Role</th>
                      <th>Premium Member</th>
                      <th>Linked Charity</th>
                      <th>Stored Scores</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-info'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.isSubscribed ? 'badge-success' : 'badge-danger'}`}>
                            {u.isSubscribed ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{u.charity?.name || <span style={{ color: 'var(--text-muted)' }}>None</span>}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.2rem' }}>
                            {u.scores?.map((s, idx) => (
                              <span key={idx} className="lottery-ball" style={{ width: '22px', height: '22px', fontSize: '0.65rem' }}>
                                {s.value}
                              </span>
                            )) || '0'}
                          </div>
                        </td>
                        <td>
                          {u.role !== 'admin' && (
                            <button 
                              onClick={() => handleToggleSubscription(u.id, u.isSubscribed)}
                              className={`btn btn-sm ${u.isSubscribed ? 'btn-danger' : 'btn-primary'}`}
                            >
                              {u.isSubscribed ? 'Disable Sub' : 'Enable Sub'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Draw Engine execution */}
          {activeTab === 'draw' && (
            <div style={styles.drawGrid}>
              <div className="card" style={styles.drawEngineCard}>
                <h3>Run Monthly Drawing</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Execute a draw of 5 random numbers between 1-45. This matches all active subscribers' scores to compile winners. Carry-over jackpots are calculated automatically.
                </p>

                <form onSubmit={handleRunDraw}>
                  <div className="form-group">
                    <label className="form-label">Draw Period (YYYY-MM)</label>
                    <input 
                      type="month" 
                      value={monthInput}
                      onChange={(e) => setMonthInput(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-accent" 
                    style={{ width: '100%', padding: '0.8rem' }}
                    disabled={drawRunning}
                  >
                    {drawRunning ? 'Running Calculations...' : 'Execute Drawing 🎲'}
                  </button>
                </form>
              </div>

              <div style={styles.drawResultColumn}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>Execution Output</h3>
                  {adminDraw && !adminDraw.published && (
                    <button 
                      onClick={handlePublishDraw} 
                      className="btn btn-primary btn-sm"
                      disabled={drawPublishing}
                    >
                      {drawPublishing ? 'Publishing...' : 'Publish Draw Results 📢'}
                    </button>
                  )}
                </div>
                
                {adminDraw ? (
                  <div>
                    {!adminDraw.published && (
                      <div className="badge badge-warning" style={{ width: '100%', textAlign: 'center', padding: '0.5rem', marginBottom: '1rem', display: 'block' }}>
                        ⚠️ DRAFT MODE: This drawing is not published to subscribers yet. Review results and click "Publish Draw Results".
                      </div>
                    )}
                    <DrawResult draw={adminDraw} />
                  </div>
                ) : (
                  <div className="card" style={styles.noDrawCard}>
                    <p style={{ color: 'var(--text-muted)' }}>No drawing outputs selected. Choose a month and click execute.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Charities Management */}
          {activeTab === 'charities' && (
            <div style={styles.drawGrid}>
              {/* CRUD Form */}
              <div className="card" style={{ height: 'fit-content' }}>
                <h3>{editingCharityId ? 'Edit Charity Partner' : 'Create Charity Partner'}</h3>
                
                <form onSubmit={handleCharitySubmit} style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Charity Name</label>
                    <input 
                      type="text" 
                      value={charityName}
                      onChange={(e) => setCharityName(e.target.value)}
                      className="form-input"
                      placeholder="e.g. Clean Oceans League"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      value={charityDesc}
                      onChange={(e) => setCharityDesc(e.target.value)}
                      className="form-input"
                      placeholder="Explain charity purpose and impact metrics..."
                      style={{ minHeight: '80px', fontFamily: 'inherit' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Logo / Image URL</label>
                    <input 
                      type="url" 
                      value={charityImg}
                      onChange={(e) => setCharityImg(e.target.value)}
                      className="form-input"
                      placeholder="https://example.com/logo.jpg"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={charitySaving}
                    >
                      {charitySaving ? 'Saving...' : editingCharityId ? 'Update Charity' : 'Add Charity'}
                    </button>
                    {editingCharityId && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingCharityId(null);
                          setCharityName('');
                          setCharityDesc('');
                          setCharityImg('');
                        }}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3>Active Charity Listings ({charities.length})</h3>
                {charities.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No charities in database.</p>
                ) : (
                  <div className="table-container" style={{ border: 'none', margin: '1rem 0 0 0' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Name</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {charities.map((c) => (
                          <tr key={c.id}>
                            <td>
                              {c.imageUrl ? (
                                <img src={c.imageUrl} alt={c.name} style={styles.tableCharityImg} />
                              ) : (
                                <span style={{ fontSize: '1.25rem' }}>⛳</span>
                              )}
                            </td>
                            <td style={{ fontWeight: '600' }}>{c.name}</td>
                            <td>
                              <p style={styles.tableCharityDesc}>{c.description}</p>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <button 
                                  onClick={() => handleEditCharity(c)}
                                  className="btn btn-secondary btn-sm"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteCharity(c.id)}
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
          )}

          {/* Tab 4: Winners Claim Review */}
          {activeTab === 'winners' && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Lottery Winner Accounts</h3>
              {winners.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No winners recorded in DB.</p>
              ) : (
                <div className="table-container" style={{ border: 'none', margin: 0 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Draw Period</th>
                        <th>Winner Name</th>
                        <th>Email</th>
                        <th>Matches</th>
                        <th>Prize Split</th>
                        <th>Proof Screenshot</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {winners.map((w) => (
                        <tr key={w.id}>
                          <td style={{ fontWeight: '600' }}>{w.draw?.month}</td>
                          <td>{w.user?.name}</td>
                          <td>{w.user?.email}</td>
                          <td>{w.matchCount} numbers matched</td>
                          <td style={{ fontWeight: '700', color: 'var(--accent)' }}>${w.prizeAmount.toFixed(2)}</td>
                          <td>
                            {w.proofUrl ? (
                              <div style={styles.proofCol}>
                                <a href={w.proofUrl} target="_blank" rel="noopener noreferrer" style={styles.proofLink}>
                                  [View Image]
                                </a>
                                <img src={w.proofUrl} alt="winner proof" style={styles.tableProofThumb} />
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No upload yet</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${
                              w.status === 'paid' ? 'badge-success' : 
                              w.status === 'approved' ? 'badge-info' : 
                              w.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                            }`}>
                              {w.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              {w.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleVerifyWinner(w.id, 'approved')}
                                    className="btn btn-primary btn-sm"
                                    disabled={verifyingWinnerId === w.id}
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    onClick={() => handleVerifyWinner(w.id, 'rejected')}
                                    className="btn btn-danger btn-sm"
                                    disabled={verifyingWinnerId === w.id}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              
                              {w.status === 'approved' && (
                                <button 
                                  onClick={() => handleVerifyWinner(w.id, 'paid')}
                                  className="btn btn-accent btn-sm"
                                  disabled={verifyingWinnerId === w.id}
                                >
                                  Mark Paid
                                </button>
                              )}
                              
                              {(w.status === 'paid' || w.status === 'rejected') && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Completed</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: All User Scores */}
          {activeTab === 'scores' && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h3 style={{ margin: 0 }}>All Submitted Scores ({allScores.length} total entries)</h3>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={scoresSearchTerm}
                  onChange={(e) => setScoresSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ maxWidth: '250px', padding: '0.5rem 0.8rem' }}
                />
              </div>
              {allScores.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No scores have been submitted yet.</p>
              ) : (() => {
                const filtered = scoresSearchTerm
                  ? allScores.filter(s =>
                      s.userName.toLowerCase().includes(scoresSearchTerm.toLowerCase()) ||
                      s.userEmail.toLowerCase().includes(scoresSearchTerm.toLowerCase())
                    )
                  : allScores;
                return (
                  <div className="table-container" style={{ border: 'none', margin: 0 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Lottery Ball</th>
                          <th>Submitted By</th>
                          <th>Email</th>
                          <th>Subscription</th>
                          <th>Date Played</th>
                          <th>Submitted On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s) => (
                          <tr key={s.id}>
                            <td>
                              <span className="lottery-ball" style={{ width: '38px', height: '38px', fontSize: '0.95rem' }}>
                                {s.value}
                              </span>
                            </td>
                            <td style={{ fontWeight: '600' }}>{s.userName}</td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.userEmail}</td>
                            <td>
                              <span className={`badge ${s.isSubscribed ? 'badge-success' : 'badge-danger'}`}>
                                {s.isSubscribed ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>{new Date(s.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filtered.length === 0 && (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No scores match your search.</p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    paddingBottom: '4rem',
  },
  titleSection: {
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1rem',
  },
  alert: {
    width: '100%',
    textAlign: 'center',
    padding: '0.75rem',
    borderRadius: '8px',
    display: 'block',
  },
  loadingBlock: {
    textAlign: 'center',
    padding: '4rem',
    color: 'var(--text-secondary)',
  },
  tabContent: {
    animation: 'fadeIn 0.25s ease-in-out',
  },
  drawGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1.2fr))',
    gap: '1.5rem',
  },
  drawEngineCard: {
    height: 'fit-content',
  },
  drawResultColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  noDrawCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center',
    flexGrow: 1,
  },
  tableCharityImg: {
    width: '45px',
    height: '45px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
  },
  tableCharityDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    maxWidth: '300px',
  },
  proofCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  proofLink: {
    color: 'var(--primary)',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.8rem',
  },
  tableProofThumb: {
    width: '40px',
    height: '30px',
    objectFit: 'cover',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
  }
};

export default Admin;
