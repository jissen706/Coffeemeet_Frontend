import { useState, useEffect, useMemo, useRef } from 'react';
import { createManualSlot } from '../../api';

// --- time grid constants (mirrors BaristaTimeRangePicker) ---
const START_HOUR    = 7;
const END_HOUR      = 22;
const BLOCK_MIN     = 15;
const TOTAL_BLOCKS  = ((END_HOUR - START_HOUR) * 60) / BLOCK_MIN;
const BLOCK_H       = 18;

const blockToMins = (i) => START_HOUR * 60 + i * BLOCK_MIN;
const minsToHHMM  = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const minsFmt     = (m) => {
  const h = Math.floor(m / 60), min = m % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
};
const hhmmToMins  = (s) => {
  const [h, m] = s.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};
const slotToBlockRange = (slot) => {
  const s  = new Date(slot.start_time);
  const e  = new Date(slot.end_time);
  const sM = s.getHours() * 60 + s.getMinutes();
  const eM = e.getHours() * 60 + e.getMinutes();
  return {
    start: (sM - START_HOUR * 60) / BLOCK_MIN,
    end:   (eM - START_HOUR * 60) / BLOCK_MIN,
  };
};

// --- email-autocomplete input ---
function EmailAutocomplete({ value, onChange, options, placeholder, exclude = [], onPick }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options.slice(0, 6);
    return options
      .filter(o => !exclude.includes(o.email))
      .filter(o => o.email.toLowerCase().includes(q) || o.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [value, options, exclude]);

  function pick(opt) {
    onPick?.(opt);
    setOpen(false);
  }

  function handleKey(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && matches[active]) { e.preventDefault(); pick(matches[active]); }
    else if (e.key === 'Escape') { setOpen(false); }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        className="form-input"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKey}
      />
      {open && matches.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#fff', border: '1px solid #e0d5cc', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', marginTop: 2,
          maxHeight: 220, overflowY: 'auto',
        }}>
          {matches.map((opt, i) => (
            <div
              key={opt.id}
              onMouseDown={(e) => { e.preventDefault(); pick(opt); }}
              onMouseEnter={() => setActive(i)}
              style={{
                padding: '8px 12px', cursor: 'pointer',
                background: i === active ? '#fff3e8' : 'transparent',
                borderBottom: i < matches.length - 1 ? '1px solid #f0e4d2' : 'none',
              }}
            >
              <div style={{ fontWeight: 600, color: '#3b1f0f', fontSize: 14 }}>{opt.name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{opt.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManualSlotCreator({
  date,
  cafeId,
  cafe,
  token,
  hosts,
  participants,
  existingSlotsForDate,
  onSlotCreated,
  onClose,
}) {
  const cap = cafe?.max_participants ?? 1;

  // --- form state ---
  const [hostInput, setHostInput] = useState('');
  const [hostId, setHostId] = useState(null);

  const [participantInput, setParticipantInput] = useState('');
  const [pickedParticipants, setPickedParticipants] = useState([]); // [{id,name,email}]

  const [location, setLocation] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [notes, setNotes] = useState('');

  // --- time selection: drag OR manual ---
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startManual, setStartManual] = useState('09:00');
  const [endManual, setEndManual]     = useState('09:30');
  const lastSourceRef = useRef('manual'); // which input is authoritative

  // Drag → manual sync
  useEffect(() => {
    if (dragStart === null || dragCurrent === null) return;
    const lo = Math.min(dragStart, dragCurrent);
    const hi = Math.max(dragStart, dragCurrent);
    setStartManual(minsToHHMM(blockToMins(lo)));
    setEndManual(minsToHHMM(blockToMins(hi + 1)));
    lastSourceRef.current = 'drag';
  }, [dragStart, dragCurrent]);

  // End drag globally
  useEffect(() => {
    const up = () => setIsDragging(false);
    document.addEventListener('mouseup', up);
    return () => document.removeEventListener('mouseup', up);
  }, []);

  // Escape closes
  useEffect(() => {
    const key = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [onClose]);

  function handleManualTimeChange(setter, value) {
    setter(value);
    lastSourceRef.current = 'manual';
    setDragStart(null);
    setDragCurrent(null);
  }

  // --- success state ---
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [createdSlot, setCreatedSlot] = useState(null);

  function resetForm() {
    setHostInput('');
    setHostId(null);
    setParticipantInput('');
    setPickedParticipants([]);
    setLocation('');
    setMeetLink('');
    setNotes('');
    setDragStart(null);
    setDragCurrent(null);
    setStartManual('09:00');
    setEndManual('09:30');
    setSubmitErr('');
    setCreatedSlot(null);
  }

  function pickHost(opt) {
    setHostId(opt.id);
    setHostInput(opt.email);
  }

  function pickParticipant(opt) {
    if (pickedParticipants.length >= cap) return;
    if (pickedParticipants.find(p => p.id === opt.id)) return;
    setPickedParticipants([...pickedParticipants, opt]);
    setParticipantInput('');
  }

  function removeParticipant(id) {
    setPickedParticipants(pickedParticipants.filter(p => p.id !== id));
  }

  async function handleSubmit() {
    setSubmitErr('');

    if (!hostId) { setSubmitErr('Pick a host from the suggestions'); return; }
    if (pickedParticipants.length === 0) { setSubmitErr('Add at least one participant'); return; }
    if (!location.trim()) { setSubmitErr('Location is required'); return; }

    const startMins = hhmmToMins(startManual);
    const endMins = hhmmToMins(endManual);
    if (startMins == null || endMins == null) { setSubmitErr('Invalid time'); return; }
    if (endMins <= startMins) { setSubmitErr('End time must be after start time'); return; }

    const payload = {
      cafe_id: cafeId,
      barista_id: hostId,
      customer_ids: pickedParticipants.map(p => p.id),
      start_time: `${date}T${startManual}:00`,
      end_time:   `${date}T${endManual}:00`,
      location: location.trim(),
      meet_link: meetLink.trim() || null,
      notes: notes.trim() || null,
    };

    setSubmitting(true);
    try {
      const slot = await createManualSlot(payload, token);
      onSlotCreated(slot);
      setCreatedSlot(slot);
    } catch (err) {
      setSubmitErr(err.message || 'Failed to create slot');
    } finally {
      setSubmitting(false);
    }
  }

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const existingRanges = (existingSlotsForDate || []).map(slotToBlockRange);

  // --- success view ---
  if (createdSlot) {
    const fmtT = (dt) => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="tpicker-backdrop" onClick={onClose}>
        <div className="tpicker-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
          <div className="tpicker-header">
            <div>
              <div className="tpicker-title">Slot created ✓</div>
              <div className="tpicker-sub">Confirmation emails are on their way.</div>
            </div>
            <button className="time-picker-close" onClick={onClose}>✕</button>
          </div>
          <div style={{ padding: '24px 28px' }}>
            <div style={{ background: '#fdf8f4', border: '1px solid #ede0d4', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{formattedDate}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#3b1f0f', marginBottom: 8 }}>
                {fmtT(createdSlot.start_time)} – {fmtT(createdSlot.end_time)}
              </div>
              <div style={{ fontSize: 14, color: '#555' }}>
                <strong>{createdSlot.barista.name}</strong> · {createdSlot.location}
              </div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>
                {createdSlot.customers.length} participant{createdSlot.customers.length !== 1 ? 's' : ''}: {createdSlot.customers.map(c => c.name).join(', ')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="tpicker-confirm-btn"
                style={{ flex: 1 }}
                onClick={resetForm}
              >+ Create another slot</button>
              <button
                className="tl-confirm-cancel"
                style={{ flex: 1 }}
                onClick={onClose}
              >Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tpicker-backdrop" onClick={onClose}>
      <div className="tpicker-modal" onClick={e => e.stopPropagation()}>

        <div className="tpicker-header">
          <div>
            <div className="tpicker-title">Create Manual Slot</div>
            <div className="tpicker-sub">{formattedDate}</div>
          </div>
          <button className="time-picker-close" onClick={onClose}>✕</button>
        </div>

        <div className="tpicker-body">

          {/* Left: drag time grid */}
          <div className="tpicker-grid-col">
            <div className="tpicker-grid-hint">Drag to pick a time — or enter it manually on the right</div>
            <div className="tpicker-grid-scroll">
              <div
                className="tpicker-grid"
                style={{ height: TOTAL_BLOCKS * BLOCK_H }}
              >
                {existingRanges.map(({ start, end }, i) => {
                  if (end <= 0 || start >= TOTAL_BLOCKS) return null;
                  const cStart = Math.max(0, start);
                  const cEnd   = Math.min(TOTAL_BLOCKS, end);
                  return (
                    <div
                      key={i}
                      className="tpicker-existing"
                      style={{ top: cStart * BLOCK_H, height: (cEnd - cStart) * BLOCK_H }}
                    />
                  );
                })}

                {dragStart !== null && dragCurrent !== null && (
                  <div
                    className="tpicker-selection"
                    style={{
                      top: Math.min(dragStart, dragCurrent) * BLOCK_H,
                      height: (Math.abs(dragStart - dragCurrent) + 1) * BLOCK_H,
                    }}
                  >
                    <div className="tpicker-sel-label">
                      <span className="tpicker-sel-time">
                        {minsFmt(blockToMins(Math.min(dragStart, dragCurrent)))} – {minsFmt(blockToMins(Math.max(dragStart, dragCurrent) + 1))}
                      </span>
                    </div>
                  </div>
                )}

                {Array.from({ length: TOTAL_BLOCKS }, (_, i) => {
                  const isHour = i % 4 === 0;
                  const isHalf = i % 2 === 0 && !isHour;
                  return (
                    <div
                      key={i}
                      className={['tpicker-row', isHour ? 'is-hour' : isHalf ? 'is-half' : ''].filter(Boolean).join(' ')}
                      style={{ height: BLOCK_H }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setDragStart(i);
                        setDragCurrent(i);
                        setIsDragging(true);
                      }}
                      onMouseEnter={() => { if (isDragging) setDragCurrent(i); }}
                    >
                      {isHour && (
                        <span className="tpicker-row-label">{minsFmt(blockToMins(i))}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="tpicker-controls-col">

            <div className="tpicker-fields">

              {/* Manual time inputs */}
              <div className="owner-form-row">
                <div className="form-field">
                  <label className="form-label">Start</label>
                  <input
                    className="form-input"
                    type="time"
                    value={startManual}
                    onChange={(e) => handleManualTimeChange(setStartManual, e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">End</label>
                  <input
                    className="form-input"
                    type="time"
                    value={endManual}
                    onChange={(e) => handleManualTimeChange(setEndManual, e.target.value)}
                  />
                </div>
              </div>

              {/* Host autocomplete */}
              <div className="form-field">
                <label className="form-label">Host</label>
                <EmailAutocomplete
                  value={hostInput}
                  onChange={(v) => { setHostInput(v); setHostId(null); }}
                  options={hosts}
                  placeholder="Type a host name or email…"
                  onPick={pickHost}
                />
              </div>

              {/* Participants autocomplete (multi) */}
              <div className="form-field">
                <label className="form-label">
                  Participants <span className="form-label-optional">({pickedParticipants.length}/{cap})</span>
                </label>
                {pickedParticipants.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {pickedParticipants.map(p => (
                      <span key={p.id} style={{
                        background: '#fff3e8', border: '1px solid #c8773a', borderRadius: 16,
                        padding: '4px 10px', fontSize: 12, display: 'inline-flex',
                        alignItems: 'center', gap: 6, color: '#3b1f0f',
                      }}>
                        {p.name}
                        <button
                          type="button"
                          onClick={() => removeParticipant(p.id)}
                          style={{ background: 'none', border: 'none', color: '#c8773a', cursor: 'pointer', padding: 0, fontSize: 14 }}
                        >✕</button>
                      </span>
                    ))}
                  </div>
                )}
                {pickedParticipants.length < cap && (
                  <EmailAutocomplete
                    value={participantInput}
                    onChange={setParticipantInput}
                    options={participants}
                    exclude={pickedParticipants.map(p => p.email)}
                    placeholder="Type a participant name or email…"
                    onPick={pickParticipant}
                  />
                )}
              </div>

              <div className="form-field">
                <label className="form-label">Location</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Table 3, Corner Booth"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Virtual Meeting Link <span className="form-label-optional">(optional)</span>
                </label>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://zoom.us/j/... or meet.google.com/..."
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Notes / Reason <span className="form-label-optional">(included in confirmation email)</span>
                </label>
                <textarea
                  className="form-input"
                  placeholder="e.g. Rescheduled because the original time conflicted"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {submitErr && <div className="form-error" style={{ marginBottom: 8 }}>{submitErr}</div>}
            <button
              className="tpicker-confirm-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Creating…' : 'Create Slot & Send Emails'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
