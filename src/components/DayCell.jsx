function DayCell({ day, inMonth, dateStr, openCount, totalCount, isSelected, isToday, isMyBooking, ownSlotCount = 0, hostHighlightColor = null, onClick, onCreateClick, createLabel = '+ Create Slots' }) {
  if (!inMonth) {
    return (
      <div className="day-cell other-month">
        <span className="day-number">{day}</span>
      </div>
    );
  }

  let badgeClass = null;
  let badgeLabel = null;
  if (totalCount > 0 && !isMyBooking) {
    badgeClass = openCount === 0 ? 'zero-slots' : 'has-slots';
    badgeLabel = openCount === 0 ? '0 open' : `${openCount} open`;
  }

  // When a host filter is active, days the host is available get a colored
  // ring and a faint tint of that host's color.
  const highlightStyle = hostHighlightColor
    ? {
        boxShadow: `inset 0 0 0 2px ${hostHighlightColor}`,
        background: `${hostHighlightColor}1F`, // ~12% alpha
      }
    : undefined;

  return (
    <div
      className={[
        'day-cell',
        isSelected  ? 'selected'   : '',
        isToday     ? 'today'      : '',
        isMyBooking ? 'my-booking' : '',
        hostHighlightColor ? 'host-highlight' : '',
        onCreateClick ? 'has-create' : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      style={highlightStyle}
    >
      <span className="day-number">{day}</span>

      {hostHighlightColor && (
        <span
          className="host-highlight-dot"
          style={{ background: hostHighlightColor }}
        />
      )}

      {isMyBooking && (
        <span className="my-booking-badge">★ Your spot</span>
      )}
      {ownSlotCount > 0 && (
        <span className="slot-count-badge own-slots">{ownSlotCount} yours</span>
      )}
      {badgeLabel && (
        <span className={`slot-count-badge ${badgeClass}`}>{badgeLabel}</span>
      )}
      {onCreateClick && (
        <button
          className="barista-cell-create-btn"
          onClick={(e) => { e.stopPropagation(); onCreateClick(); }}
        >
          {createLabel}
        </button>
      )}
    </div>
  );
}

export default DayCell;
