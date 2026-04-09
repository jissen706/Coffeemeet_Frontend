import { useState, useMemo } from 'react';
import { editSlot, cancelBooking } from '../../api';

const fmtTime = (dt) => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDate = (dt) => new Date(dt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export default function HostSlotsSidebar({ slots, barista, token, onSlotUpdated, onSlotUnbooked }) {
  const [editTarget,   setEditTarget]   = useState(null);
  const [editLocation, setEditLocation] = useState('');
  const [editMeetLink, setEditMeetLink] = useState('');
  const [editSaving,   setEditSaving]   = useState(false);
  const [editError,    setEditError]    = useState('');

  const [unbookTarget, setUnbookTarget] = useState(null);
  const [unbooking,    setUnbooking]    = useState(false);

  const bookedSlots = useMemo(() =>
    slots
      .filter(s => {
        const isMySlot = Number(s.barista.id) === Number(barista.id)
          || s.barista.email === barista.email;
        return isMySlot && s.customer != null;
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
    [slots, barista.id, barista.email]
  );

  function openEdit(slot) {
    setEditTarget(slot);
    setEditLocation(slot.location || '');
    setEditMeetLink(slot.meet_link || '');
    setEditError('');
  }

  async function handleEditSave() {
    setEditSaving(true);
    setEditError('');
    try {
      const updated = await editSlot(editTarget.id, { location: editLocation, meet_link: editMeetLink || null }, token);
      onSlotUpdated(updated);
      setEditTarget(null);
    } catch (err) {
      setEditError(err.message || 'Failed to save');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleUnbookConfirm() {
    setUnbooking(true);
    try {
      const updated = await cancelBooking(unbookTarget.id, token);
      onSlotUnbooked(updated);
    } catch {
      // optimistic fallback
      onSlotUnbooked({ ...unbookTarget, customer: null, status: 'open', meet_link: null });
    } finally {
      setUnbooking(false);
      setUnbookTarget(null);
    }
  }

  return (
    <>
      <aside className="host-slots-sidebar">
        <div className="sidebar-title">Your Bookings</div>

        {bookedSlots.length === 0 ? (
          <div className="hss-empty">No bookings yet.<br/>Your booked slots will appear here.</div>
        ) : (
          bookedSlots.map(slot => (
            <div key={slot.id} className="hss-card">
              <div className="hss-card-date">{fmtDate(slot.start_time)}</div>
              <div className="hss-card-time">{fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}</div>

              <div className="hss-divider"/>

              <div className="hss-row">
                <span className="hss-label">Participant</span>
                <span className="hss-val">{slot.customer.name}</span>
              </div>
              <div className="hss-row">
                <span className="hss-label">Email</span>
                <a href={`mailto:${slot.customer.email}`} className="hss-email">{slot.customer.email}</a>
              </div>
              <div className="hss-row">
                <span className="hss-label">Location</span>
                <span className="hss-val">{slot.location || '—'}</span>
              </div>

              {slot.meet_link && (
                <a href={slot.meet_link} target="_blank" rel="noopener noreferrer" className="hss-join-btn">
                  Join Meeting ↗
                </a>
              )}

              <div className="hss-actions">
                <button className="hss-edit-btn" onClick={() => openEdit(slot)}>✎ Edit</button>
                <button className="hss-unbook-btn" onClick={() => setUnbookTarget(slot)}>Cancel Booking</button>
              </div>
            </div>
          ))
        )}
      </aside>

      {/* Edit modal */}
      {editTarget && (
        <div className="tl-confirm-backdrop">
          <div className="tl-confirm-popup" style={{ width: 320 }}>
            <div className="tl-confirm-title">Edit Slot</div>
            <div className="tl-confirm-sub" style={{ marginBottom: 12 }}>
              {fmtDate(editTarget.start_time)} · {fmtTime(editTarget.start_time)}–{fmtTime(editTarget.end_time)}
            </div>
            <div className="form-field" style={{ marginBottom: 8 }}>
              <label className="form-label">Location</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Table 3, Corner Booth"
                value={editLocation}
                onChange={e => setEditLocation(e.target.value)}
              />
            </div>
            <div className="form-field" style={{ marginBottom: 8 }}>
              <label className="form-label">Virtual Meeting Link <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
              <input
                className="form-input"
                type="url"
                placeholder="https://zoom.us/j/... or meet.google.com/..."
                value={editMeetLink}
                onChange={e => setEditMeetLink(e.target.value)}
              />
            </div>
            {editError && <div className="form-error" style={{ marginBottom: 8 }}>{editError}</div>}
            <div className="tl-confirm-actions">
              <button className="tl-confirm-cancel" onClick={() => setEditTarget(null)} disabled={editSaving}>Cancel</button>
              <button
                className="tl-confirm-ok"
                onClick={handleEditSave}
                disabled={editSaving || !editLocation.trim()}
                style={editLocation.trim() ? { background: '#c8773a', borderColor: '#c8773a', color: '#fff' } : {}}
              >
                {editSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unbook confirmation */}
      {unbookTarget && (
        <div className="tl-confirm-backdrop">
          <div className="tl-confirm-popup">
            <div className="tl-confirm-title">Cancel this booking?</div>
            <div className="tl-confirm-sub">
              {unbookTarget.customer?.name} · {fmtTime(unbookTarget.start_time)}–{fmtTime(unbookTarget.end_time)}
            </div>
            <div className="tl-confirm-actions">
              <button className="tl-confirm-cancel" onClick={() => setUnbookTarget(null)} disabled={unbooking}>Keep it</button>
              <button className="tl-confirm-ok tl-confirm-delete" onClick={handleUnbookConfirm} disabled={unbooking}>
                {unbooking ? 'Cancelling…' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
