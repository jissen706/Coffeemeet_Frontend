import { useState, useMemo } from 'react';
import BaristaTimeRangePicker from './BaristaTimeRangePicker';
import { deleteSlot, editSlot } from '../../api';
import { colorOf } from '../../colors';

const HOUR_START=8,HOUR_END=22,HOURS=14,HOUR_H=80,PX_MIN=HOUR_H/60;
const fmtTime=(dt)=>new Date(dt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
const topOf=(s)=>{const d=new Date(s.start_time);return(d.getHours()*60+d.getMinutes()-HOUR_START*60)*PX_MIN;};
const heightOf=(s)=>Math.max(24,(new Date(s.end_time)-new Date(s.start_time))/60000*PX_MIN);

function layoutSlots(slots){
  const sorted=[...slots].sort((a,b)=>new Date(a.start_time)-new Date(b.start_time));
  const colEnds=[],rows=[];
  for(const slot of sorted){const s=new Date(slot.start_time),e=new Date(slot.end_time);let c=colEnds.findIndex(end=>s>=end);if(c<0)c=colEnds.length;colEnds[c]=e;rows.push({slot,col:c});}
  const n=colEnds.length||1;
  return rows.map(({slot,col})=>({slot,col,n}));
}

export default function BaristaDayTimeline({ date, slots, barista, token, startDate, endDate, onClose, onSlotCreated, onSlotDeleted }) {
  const [showPicker, setShowPicker]     = useState(false);
  const [detailSlot, setDetailSlot]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget,  setEditTarget]    = useState(null); // slot being edited
  const [editLocation, setEditLocation] = useState('');
  const [editMeetLink, setEditMeetLink] = useState('');
  const [editNotes,    setEditNotes]    = useState('');
  const [editSaving,   setEditSaving]   = useState(false);
  const [editError,    setEditError]    = useState('');
  const formatted = new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const ownSlots  = slots.filter(s=>s.barista.id===barista.id);
  const inRange   = (!startDate || date >= startDate) && (!endDate || date <= endDate);
  const openCount = slots.filter(s=>(s.spots_left ?? 0) > 0).length;
  const laid      = useMemo(()=>layoutSlots(slots),[slots]);

  function handlePickerConfirm(newSlots){ newSlots.forEach(s=>onSlotCreated(s)); setShowPicker(false); }

  function openEdit(slot) {
    setEditTarget(slot);
    setEditLocation(slot.location || '');
    setEditMeetLink(slot.meet_link || '');
    setEditNotes(slot.notes || '');
    setEditError('');
  }

  async function handleEditSave() {
    setEditSaving(true);
    setEditError('');
    try {
      const updated = await editSlot(editTarget.id, { location: editLocation, meet_link: editMeetLink || null, notes: editNotes.trim() || null }, token);
      onSlotCreated(updated); // upsert: parent replaces existing slot by id
      if (detailSlot?.id === editTarget.id) setDetailSlot(updated);
      setEditTarget(null);
    } catch (err) {
      setEditError(err.message || 'Failed to save');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    // Optimistic update
    onSlotDeleted(deleteTarget.id);
    if (detailSlot?.id === deleteTarget.id) setDetailSlot(null);
    setDeleteTarget(null);
    try { await deleteSlot(deleteTarget.id, token); } catch { /* already removed from UI */ }
  }

  return (
    <>
      <aside className="day-timeline-panel">
        <div className="tl-header">
          <div>
            <div className="tl-date">{formatted}</div>
            <div className="tl-sub">{ownSlots.length} yours · {openCount} open total</div>
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            {inRange && <button className="tl-create-btn" onClick={()=>setShowPicker(true)}>+ Create</button>}
            {!inRange && <span style={{fontSize:'0.75rem',color:'#999'}}>Outside cafe dates</span>}
            <button className="tl-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Slot detail card */}
        {detailSlot&&(
          <div className="tl-detail-card">
            <div className="tl-detail-row"><span className="tl-detail-label">Host</span><span className="tl-detail-val">{detailSlot.barista.name}</span></div>
            <div className="tl-detail-row"><span className="tl-detail-label">Time</span><span className="tl-detail-val">{fmtTime(detailSlot.start_time)} – {fmtTime(detailSlot.end_time)}</span></div>
            <div className="tl-detail-row"><span className="tl-detail-label">Location</span><span className="tl-detail-val">{detailSlot.location||'—'}</span></div>
            {(() => {
              const cap = detailSlot.max_participants ?? 1;
              const taken = detailSlot.customers?.length ?? 0;
              const status = taken === 0 ? 'Open' : (cap > 1 ? `${taken} of ${cap} joined` : `Booked — ${detailSlot.customers[0].name}`);
              return (
                <div className="tl-detail-row">
                  <span className="tl-detail-label">Status</span>
                  <span className="tl-detail-val">{status}</span>
                </div>
              );
            })()}
            {(detailSlot.customers || []).map(c => (
              <div key={c.id} className="tl-detail-row">
                <span className="tl-detail-label">Participant</span>
                <span className="tl-detail-val">
                  {c.name}
                  {c.email && <> · <a href={`mailto:${c.email}`} style={{ color: '#c8773a' }}>{c.email}</a></>}
                </span>
              </div>
            ))}
            {detailSlot.notes&&<div className="tl-detail-row"><span className="tl-detail-label">Notes</span><span className="tl-detail-val" style={{fontStyle:'italic'}}>{detailSlot.notes}</span></div>}
            <button className="tl-detail-dismiss" onClick={()=>setDetailSlot(null)}>✕ Dismiss</button>
          </div>
        )}

        <div className="tl-scroll">
          <div className="tl-body" style={{height:HOURS*HOUR_H}}>
            {Array.from({length:HOURS+1},(_,i)=>{const h=HOUR_START+i;const label=h>12?`${h-12} PM`:h===12?'12 PM':`${h} AM`;return<div key={i} className="tl-hour" style={{top:i*HOUR_H}}><span className="tl-hour-label">{label}</span><span className="tl-hour-line"/></div>;})}
            {Array.from({length:HOURS},(_,i)=><div key={`h${i}`} className="tl-half" style={{top:(i+0.5)*HOUR_H}}/>)}
            <div className="tl-slots">
              {laid.map(({slot,col,n})=>{
                const isOwn=slot.barista.id===barista.id;
                const isOpen=(slot.customers?.length ?? 0)===0;
                const color=isOwn?'#c8773a':colorOf(slot.barista.id);
                const h=heightOf(slot);
                return(
                  <div key={slot.id}
                    className={`tl-slot${isOpen?' tl-open':' tl-booked'}${isOwn?' tl-own':''}`}
                    style={{
                      top:topOf(slot),height:h,
                      left:`${(col/n)*100}%`,width:`calc(${(1/n)*100}% - 4px)`,
                      background:isOwn?(isOpen?'rgba(200,119,58,0.22)':'rgba(200,119,58,0.12)'):(isOpen?color:`${color}99`),
                      color:isOwn?'#6b3410':'#fff',
                      borderLeftColor:color,
                      cursor:'pointer',
                    }}
                    onClick={()=>setDetailSlot(slot)}
                  >
                    <div className="tl-slot-name">{isOwn?'You':slot.barista.name.split(' ')[0]}</div>
                    {h>=38&&<div className="tl-slot-time">{fmtTime(slot.start_time)}–{fmtTime(slot.end_time)}</div>}
                    {isOwn&&(
                      <>
                        <button
                          className="tl-slot-delete-btn"
                          title="Delete slot"
                          onClick={(e)=>{e.stopPropagation();setDeleteTarget(slot);}}
                        >✕</button>
                        <button
                          className="tl-slot-edit-btn"
                          title="Edit slot"
                          onClick={(e)=>{e.stopPropagation();openEdit(slot);}}
                        >✎</button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* Delete confirmation */}
      {deleteTarget&&(
        <div className="tl-confirm-backdrop">
          <div className="tl-confirm-popup">
            <div className="tl-confirm-title">Delete this slot?</div>
            <div className="tl-confirm-sub">
              {fmtTime(deleteTarget.start_time)}–{fmtTime(deleteTarget.end_time)}
              {(deleteTarget.customers?.length ?? 0) > 0 && <span className="tl-confirm-warn"> · Has {deleteTarget.customers.length} booking{deleteTarget.customers.length === 1 ? '' : 's'}!</span>}
            </div>
            <div className="tl-confirm-actions">
              <button className="tl-confirm-cancel" onClick={()=>setDeleteTarget(null)}>Cancel</button>
              <button className="tl-confirm-ok tl-confirm-delete" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showPicker&&(
        <BaristaTimeRangePicker date={date} existingSlots={slots} barista={barista} token={token} onConfirm={handlePickerConfirm} onCancel={()=>setShowPicker(false)}/>
      )}

      {editTarget&&(
        <div className="tl-confirm-backdrop">
          <div className="tl-confirm-popup" style={{width:320}}>
            <div className="tl-confirm-title">Edit Slot</div>
            <div className="tl-confirm-sub" style={{marginBottom:12}}>
              {fmtTime(editTarget.start_time)}–{fmtTime(editTarget.end_time)}
            </div>
            <div className="form-field" style={{marginBottom:8}}>
              <label className="form-label">Location</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Table 3, Corner Booth"
                value={editLocation}
                onChange={e=>setEditLocation(e.target.value)}
              />
            </div>
            <div className="form-field" style={{marginBottom:8}}>
              <label className="form-label">Virtual Meeting Link <span style={{color:'#aaa',fontWeight:400}}>(optional)</span></label>
              <input
                className="form-input"
                type="url"
                placeholder="https://zoom.us/j/... or meet.google.com/..."
                value={editMeetLink}
                onChange={e=>setEditMeetLink(e.target.value)}
              />
            </div>
            <div className="form-field" style={{marginBottom:8}}>
              <label className="form-label">Notes <span style={{color:'#aaa',fontWeight:400}}>(optional)</span></label>
              <textarea
                className="form-input"
                placeholder="e.g. I'll be wearing a red hoodie, sitting near the window..."
                value={editNotes}
                onChange={e=>setEditNotes(e.target.value)}
                rows={3}
                style={{resize:'vertical'}}
              />
            </div>
            {editError&&<div className="form-error" style={{marginBottom:8}}>{editError}</div>}
            <div className="tl-confirm-actions">
              <button className="tl-confirm-cancel" onClick={()=>setEditTarget(null)} disabled={editSaving}>Cancel</button>
              <button
                className="tl-confirm-ok"
                onClick={handleEditSave}
                disabled={editSaving || !editLocation.trim()}
                style={editLocation.trim() ? {background:'#c8773a',borderColor:'#c8773a',color:'#fff'} : {}}
              >
                {editSaving?'Saving…':'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
