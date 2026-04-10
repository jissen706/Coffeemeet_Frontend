import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOwnerCafes, createCafeApi } from '../../api';
import ShareLinksPopup from '../../components/owner/ShareLinksPopup';

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function OwnerDashboard({ token, owner, onLogout }) {
  const navigate = useNavigate();
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', one_slot: true, description: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [shareLinks, setShareLinks] = useState(null);

  useEffect(() => {
    getOwnerCafes(owner.owner_id, token)
      .then(setCafes)
      .catch(() => setCafes([]))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

  async function handleCreateCafe(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.start_date || !form.end_date) {
      setCreateError('All fields are required');
      return;
    }
    if (form.start_date < today) {
      setCreateError('Start date cannot be in the past');
      return;
    }
    if (form.end_date < form.start_date) {
      setCreateError('End date cannot be before start date');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const cafe = await createCafeApi(
        { name: form.name, start_date: form.start_date, end_date: form.end_date, one_slot: form.one_slot, description: form.description.trim() || null },
        token
      );
      setCafes(prev => [...prev, cafe]);
      setShowCreate(false);
      setForm({ name: '', start_date: '', end_date: '', one_slot: true, description: '' });
      setShareLinks(cafe);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="owner-dashboard">
      <div className="owner-dash-header">
        <div className="owner-dash-left">
          <span className="owner-dash-icon">☕</span>
          <div>
            <div className="owner-dash-welcome">Welcome back, {owner.name.split(' ')[0]}!</div>
            <div className="owner-dash-sub">CoffeeMeet Admin Portal</div>
          </div>
        </div>
        <div className="owner-dash-actions">
          <button className="owner-create-btn" onClick={() => setShowCreate(true)}>+ Create Cafe</button>
          <button className="owner-logout-btn" onClick={onLogout}>Log Out</button>
        </div>
      </div>

      <div className="owner-dash-body">
        <div className="owner-section-title">Your Cafes</div>
        {loading ? (
          <div className="owner-loading">Loading cafes…</div>
        ) : cafes.length === 0 ? (
          <div className="owner-empty-state">
            <div className="owner-empty-icon">☕</div>
            <div className="owner-empty-title">No cafes yet</div>
            <div className="owner-empty-sub">Create your first cafe to get started.</div>
            <button className="owner-create-btn" onClick={() => setShowCreate(true)}>+ Create Cafe</button>
          </div>
        ) : (
          <div className="owner-cafe-grid">
            {cafes.map(cafe => (
              <div key={cafe.id} className="owner-cafe-card" onClick={() => navigate(`/owner/cafe/${cafe.id}`)}>
                <div className="owner-cafe-card-name">{cafe.name}</div>
                <div className="owner-cafe-card-dates">{fmtDate(cafe.start_date)} – {fmtDate(cafe.end_date)}</div>
                <div className="owner-cafe-card-code">Host code: <strong>{cafe.join_code}</strong></div>
                <div className="owner-cafe-card-code">Participant code: <strong>{cafe.participant_code}</strong></div>
                <div className="owner-cafe-card-arrow">→</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="owner-modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="owner-modal" onClick={e => e.stopPropagation()}>
            <div className="owner-modal-title">Create a Cafe</div>
            <form onSubmit={handleCreateCafe}>
              <div className="form-field">
                <label className="form-label">Cafe Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Brew & Chat"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="owner-form-row">
                <div className="form-field">
                  <label className="form-label">Start Date</label>
                  <input
                    className="form-input"
                    type="date"
                    min={today}
                    value={form.start_date}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(p => ({
                        ...p,
                        start_date: val,
                        // clear end date if it's now before the new start
                        end_date: p.end_date && p.end_date < val ? '' : p.end_date,
                      }));
                      setCreateError('');
                    }}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">End Date</label>
                  <input
                    className="form-input"
                    type="date"
                    min={form.start_date || today}
                    value={form.end_date}
                    onChange={e => { setForm(p => ({ ...p, end_date: e.target.value })); setCreateError(''); }}
                  />
                </div>
              </div>
              <label className="owner-toggle-label">
                <input
                  type="checkbox"
                  checked={form.one_slot}
                  onChange={e => setForm(p => ({ ...p, one_slot: e.target.checked }))}
                />
                One slot per customer
              </label>
              <div className="form-field" style={{ marginTop: 12 }}>
                <label className="form-label">Description <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
                <textarea
                  className="form-input"
                  placeholder="Rules, expectations, what to bring…"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ resize: 'vertical', minHeight: 72 }}
                />
              </div>
              {createError && <div className="owner-form-error">{createError}</div>}
              <div className="owner-modal-actions">
                <button type="button" className="owner-modal-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="owner-modal-submit" disabled={creating}>
                  {creating ? 'Creating…' : 'Create Cafe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {shareLinks && (
        <ShareLinksPopup cafe={shareLinks} onClose={() => setShareLinks(null)} />
      )}
    </div>
  );
}
