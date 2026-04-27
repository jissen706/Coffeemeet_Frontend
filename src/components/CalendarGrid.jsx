import { useState, useMemo } from 'react';
import DayCell from './DayCell';
import { colorOf } from '../colors';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthDays(year, month) {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, inMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, inMonth: true, dateStr });
  }

  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, inMonth: false });
  }

  return cells;
}

function CalendarGrid({ slots, startDate, selectedDate, onSelectDate, myBookedDates, selectedHostId, manualMode = false, onManualSlotForDate }) {
  const initialMonth = useMemo(() => {
    if (startDate) {
      const d = new Date(startDate);
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [startDate]);

  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  const slotsByDate = useMemo(() => {
    const map = {};
    for (const slot of slots) {
      const date = new Date(slot.start_time).toLocaleDateString('en-CA');
      if (!map[date]) map[date] = [];
      map[date].push(slot);
    }
    return map;
  }, [slots]);

  // Dates where the currently-filtered host has at least one slot.
  const hostDates = useMemo(() => {
    if (selectedHostId == null) return null;
    const set = new Set();
    for (const s of slots) {
      if (s.barista?.id === selectedHostId) {
        set.add(new Date(s.start_time).toLocaleDateString('en-CA'));
      }
    }
    return set;
  }, [slots, selectedHostId]);

  const hostColor = selectedHostId != null ? colorOf(selectedHostId) : null;

  const { year, month } = currentMonth;
  const cells = getMonthDays(year, month);
  const today = new Date().toLocaleDateString('en-CA');

  function prevMonth() {
    setCurrentMonth(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
    onSelectDate(null);
  }

  function nextMonth() {
    setCurrentMonth(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
    onSelectDate(null);
  }

  return (
    <div className={`calendar-section${manualMode ? ' calendar-manual-mode' : ''}`}>
      {manualMode && (
        <div className="manual-mode-banner">
          📅 Manual slot mode — hover any day and click <strong>+ New Manual Slot</strong> to schedule
        </div>
      )}
      <div className="calendar-header">
        <div className="month-nav">
          <button className="nav-btn" onClick={prevMonth}>&#8249;</button>
          <span className="month-title">{MONTH_NAMES[month]} {year}</span>
          <button className="nav-btn" onClick={nextMonth}>&#8250;</button>
        </div>
        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#1a7a40' }} />
            Open slots
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#c0392b' }} />
            Fully booked
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#f7c948' }} />
            Your booking
          </div>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {DAY_LABELS.map((d) => (
            <div key={d} className="weekday-label">{d}</div>
          ))}
        </div>
        <div className="calendar-days">
          {cells.map((cell, i) => {
            const daySlots = cell.dateStr ? (slotsByDate[cell.dateStr] || []) : [];
            const openCount = daySlots.filter((s) => s.status !== 'booked').length;
            const isMyBooking = cell.dateStr ? myBookedDates.has(cell.dateStr) : false;
            const isHostHighlight = hostDates?.has(cell.dateStr) || false;
            return (
              <DayCell
                key={i}
                day={cell.day}
                inMonth={cell.inMonth}
                dateStr={cell.dateStr}
                openCount={openCount}
                totalCount={daySlots.length}
                isSelected={selectedDate === cell.dateStr}
                isToday={cell.dateStr === today}
                isMyBooking={isMyBooking}
                hostHighlightColor={isHostHighlight ? hostColor : null}
                onClick={cell.inMonth ? () => onSelectDate(selectedDate === cell.dateStr ? null : cell.dateStr) : undefined}
                onCreateClick={manualMode && cell.inMonth && onManualSlotForDate
                  ? () => onManualSlotForDate(cell.dateStr)
                  : undefined}
                createLabel="+ New Manual Slot"
              />
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default CalendarGrid;
