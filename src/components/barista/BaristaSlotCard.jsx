function BaristaSlotCard({ slot, isOwn }) {
  const { barista, customers = [], start_time, end_time, location, meet_link, max_participants = 1, spots_left } = slot;
  const left = spots_left ?? Math.max(0, max_participants - customers.length);
  const isBooked = left <= 0;
  const isGroup = max_participants > 1;
  const customer = customers[0]; // legacy "first booker" reference for the inline tag

  const initials = barista.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const fmt = (dt) =>
    new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`slot-card${isBooked ? ' booked' : ''}${isOwn ? ' own-slot' : ''}`}>
      <div className={`slot-avatar${isOwn ? ' own-avatar' : ''}`}>{initials}</div>

      <div className="slot-info">
        <div className="slot-barista-name">
          {isOwn ? 'Your Slot' : barista.name}
          {isOwn && customers.length > 0 && (
            <span className="own-booked-tag">
              {isGroup
                ? `${customers.length}/${max_participants} joined`
                : `Booked by ${customer.name}`}
            </span>
          )}
        </div>
        <div className="slot-meta">
          <div className="slot-meta-row">
            <span className="slot-meta-icon">&#8987;</span>
            <span>{fmt(start_time)} &ndash; {fmt(end_time)}</span>
          </div>
          <div className="slot-meta-row">
            <span className="slot-meta-icon">&#128205;</span>
            <span>{location}</span>
          </div>
          {meet_link && (
            <div className="slot-meta-row">
              <span className="slot-meta-icon">🎥</span>
              <a href={meet_link} target="_blank" rel="noreferrer" className="zoom-link">
                Virtual Meeting Link
              </a>
            </div>
          )}
        </div>
      </div>

      <div className={`slot-status-badge ${isBooked ? 'booked' : isOwn ? 'own-open' : 'open'}`}>
        {isBooked ? (isGroup ? 'Full' : 'Booked') : (isGroup ? `${left} left` : 'Open')}
      </div>
    </div>
  );
}

export default BaristaSlotCard;
