function SlotCard({ slot, onBook }) {
  const { barista, customers = [], start_time, end_time, location, max_participants = 1, spots_left } = slot;
  const left = spots_left ?? Math.max(0, max_participants - customers.length);
  const isBooked = left <= 0;
  const isGroup = max_participants > 1;

  const initials = barista.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const fmt = (dt) =>
    new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`slot-card${isBooked ? ' booked' : ''}`}>
      <div className="slot-avatar">{initials}</div>
      <div className="slot-info">
        <div className="slot-barista-name">{barista.name}</div>
        <div className="slot-meta">
          <div className="slot-meta-row">
            <span className="slot-meta-icon">&#8987;</span>
            <span>{fmt(start_time)} &ndash; {fmt(end_time)}</span>
          </div>
          <div className="slot-meta-row">
            <span className="slot-meta-icon">&#128205;</span>
            <span>{location}</span>
          </div>
        </div>
      </div>

      {isBooked ? (
        <div className="slot-status-badge booked">{isGroup ? 'Full' : 'Booked'}</div>
      ) : (
        <button className="slot-book-btn" onClick={() => onBook(slot)}>
          {isGroup ? `Join (${left} left)` : 'Book'}
        </button>
      )}
    </div>
  );
}

export default SlotCard;
