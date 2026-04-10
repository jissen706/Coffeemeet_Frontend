import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import BaristaSidebar from '../components/BaristaSidebar';
import CalendarGrid from '../components/CalendarGrid';
import DayTimeline from '../components/DayTimeline';
import BookingModal from '../components/BookingModal';
import BookingPage from '../components/BookingPage';
import CelebrationOverlay from '../components/CelebrationOverlay';
import { getCafeByCode, getSlots, getCafeBaristas, createCustomer, bookSlot, cancelBooking, lookupCustomerByEmail } from '../api';

const EXPERTISE_OPTIONS = [
  'Latte Art', 'Cold Brew Master', 'Espresso Expert',
  'Pour Over', 'Aeropress', 'Siphon Brew',
];
function getExpertise(id) {
  return EXPERTISE_OPTIONS[id % EXPERTISE_OPTIONS.length];
}

function CustomerPage() {
  const { joinCode } = useParams();


  const [cafe, setCafe] = useState(null);
  const [slots, setSlots] = useState([]);
  const [baristas, setBaristas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const [modalSlot, setModalSlot] = useState(null);
  const [view, setView] = useState('main');
  const [activeSlot, setActiveSlot] = useState(null);
  const [myBookedDates, setMyBookedDates] = useState(new Set());
  const [myBookedSlotId, setMyBookedSlotId] = useState(
    () => { const v = sessionStorage.getItem('my_booked_slot_id'); return v ? Number(v) : null; }
  );
  const [customerToken, setCustomerToken] = useState(
    () => sessionStorage.getItem('customer_token')
  );

  const [showCancelWidget, setShowCancelWidget] = useState(false);

  // "Find my booking" flow — triggered by "Already booked?" button
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnEmail, setReturnEmail] = useState('');
  const [returnError, setReturnError] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  useEffect(() => {
    if (!joinCode) { setError('No join code in URL'); setLoading(false); return; }
    getCafeByCode(joinCode)
      .then((cafeData) => {
        setCafe(cafeData);
        return Promise.all([
          getSlots(cafeData.id),
          getCafeBaristas(cafeData.id),
        ]);
      })
      .then(([slotsData, baristasData]) => {
        setSlots(slotsData);
        setBaristas(baristasData.map((b) => ({ ...b, expertise: getExpertise(b.id) })));

        // Restore booked session — but clear it if the host already unbooked
        const persistedSlotId = sessionStorage.getItem('my_booked_slot_id');
        if (persistedSlotId) {
          const bookedSlot = slotsData.find(s => s.id === Number(persistedSlotId));
          if (bookedSlot && bookedSlot.customer !== null) {
            const date = new Date(bookedSlot.start_time).toLocaleDateString('en-CA');
            setMyBookedDates(new Set([date]));
            setSelectedDate(date);
          } else {
            sessionStorage.removeItem('my_booked_slot_id');
            sessionStorage.removeItem('customer_token');
            setMyBookedSlotId(null);
            setCustomerToken(null);
          }
        }

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [joinCode]);

  const myBookedSlot = useMemo(() => {
    if (!myBookedSlotId) return null;
    const slot = slots.find(s => s.id === myBookedSlotId);
    // Return null if the slot no longer exists or was unbooked by the host
    return (slot && slot.customer !== null) ? slot : null;
  }, [slots, myBookedSlotId]);

  const slotsByDate = useMemo(() => {
    const map = {};
    for (const slot of slots) {
      const date = new Date(slot.start_time).toLocaleDateString('en-CA');
      if (!map[date]) map[date] = [];
      map[date].push(slot);
    }
    return map;
  }, [slots]);

  function handleBookSlot(slot) { setModalSlot(slot); }

  function handleModalConfirm() {
    setActiveSlot(modalSlot);
    setModalSlot(null);
    setView('booking');
  }

  function handleModalCancel() { setModalSlot(null); }

  async function handleBookingConfirm(customerData) {
    const name = `${customerData.first_name} ${customerData.last_name}`.trim();
    const email = customerData.email.trim();
    const customer = await createCustomer(cafe.id, { name, email });

    // Check if they already have a booking in this cafe
    const existingSlot = slots.find(s => s.customer?.id === customer.user.id);
    if (existingSlot) {
      // Restore their session and show them their booking
      setCustomerToken(customer.access_token);
      sessionStorage.setItem('customer_token', customer.access_token);
      setMyBookedSlotId(existingSlot.id);
      sessionStorage.setItem('my_booked_slot_id', String(existingSlot.id));
      const date = new Date(existingSlot.start_time).toLocaleDateString('en-CA');
      setMyBookedDates(new Set([date]));
      setSelectedDate(date);
      setView('main');
      return;
    }

    // New booking
    const updatedSlot = await bookSlot(activeSlot.id, customer.user.id);
    setCustomerToken(customer.access_token);
    sessionStorage.setItem('customer_token', customer.access_token);
    setSlots((prev) => prev.map((s) => s.id === activeSlot.id ? updatedSlot : s));
    const date = new Date(activeSlot.start_time).toLocaleDateString('en-CA');
    setMyBookedDates((prev) => new Set([...prev, date]));
    setMyBookedSlotId(activeSlot.id);
    sessionStorage.setItem('my_booked_slot_id', String(activeSlot.id));
    setSelectedDate(null);
    setView('celebration');
  }

  async function handleReturnLogin() {
    if (!returnEmail.trim()) { setReturnError('Enter your email'); return; }
    setReturnLoading(true);
    setReturnError('');
    try {
      const customer = await lookupCustomerByEmail(cafe.id, returnEmail.trim());
      const bookedSlot = slots.find(s => s.customer?.id === customer.user.id);
      if (!bookedSlot) {
        setReturnError('No active booking found for this email.');
        return;
      }
      setCustomerToken(customer.access_token);
      sessionStorage.setItem('customer_token', customer.access_token);
      setMyBookedSlotId(bookedSlot.id);
      sessionStorage.setItem('my_booked_slot_id', String(bookedSlot.id));
      const date = new Date(bookedSlot.start_time).toLocaleDateString('en-CA');
      setMyBookedDates(new Set([date]));
      setSelectedDate(date);
      setShowReturnForm(false);
    } catch (err) {
      setReturnError(err.message?.includes('404') ? 'No booking found for this email.' : (err.message || 'Could not find your booking'));
    } finally {
      setReturnLoading(false);
    }
  }

  async function handleCancelBooking(slotId) {
    if (!customerToken) {
      // Token missing — prompt them to re-identify
      setShowReturnForm(true);
      return;
    }
    try {
      const updatedSlot = await cancelBooking(slotId, customerToken);
      setSlots((prev) => prev.map((s) => s.id === slotId ? updatedSlot : s));
    } catch (err) {
      if (err.message?.includes('401') || err.message?.includes('403')) {
        // Token expired — clear it and prompt re-login
        sessionStorage.removeItem('customer_token');
        setCustomerToken(null);
        setShowReturnForm(true);
        return;
      }
      // Optimistic fallback for other errors
      setSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, customer: null } : s));
    }
    const cancelledSlot = slots.find((s) => s.id === slotId);
    if (cancelledSlot) {
      const date = new Date(cancelledSlot.start_time).toLocaleDateString('en-CA');
      setMyBookedDates((prev) => { const next = new Set(prev); next.delete(date); return next; });
    }
    setMyBookedSlotId(null);
    setCustomerToken(null);
    sessionStorage.removeItem('customer_token');
    sessionStorage.removeItem('my_booked_slot_id');
  }

  function handleBookingBack() { setActiveSlot(null); setView('main'); }
  function handleCelebrationDone() { setActiveSlot(null); setView('main'); }

  if (loading) {
    return (
      <div className="loading-screen">
        <span>☕</span>
        Brewing your experience...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <span>Could not connect to the server</span>
        <small>{error}</small>
      </div>
    );
  }

  return (
    <>
      <div className="app">
        <Header
          cafeName={cafe?.name || 'CoffeeMeet'}
          description="Where great conversations brew over better coffee."
          ownerName=""
        />
        <div className="main-layout">
          <BaristaSidebar baristas={baristas} />
          <CalendarGrid
            slots={slots}
            startDate={cafe?.start_date}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            myBookedDates={myBookedDates}
          />
          {selectedDate && (
            <DayTimeline
              date={selectedDate}
              slots={slotsByDate[selectedDate] || []}
              onClose={() => setSelectedDate(null)}
              onBook={handleBookSlot}
              myBookedSlotId={myBookedSlotId}
              myBookedSlot={myBookedSlot}
              onCancelBooking={handleCancelBooking}
            />
          )}
        </div>
      </div>

      {/* Already booked? banner — shown when no active session */}
      {!myBookedSlotId && !showReturnForm && (
        <div style={{ textAlign: 'center', padding: '8px 0 0' }}>
          <button
            onClick={() => setShowReturnForm(true)}
            style={{ background: 'none', border: 'none', color: '#c8773a', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Already made a booking? Click here to manage it
          </button>
        </div>
      )}

      {/* Return login modal */}
      {showReturnForm && (
        <div className="tl-confirm-backdrop">
          <div className="tl-confirm-popup" style={{ width: 340 }}>
            <div className="tl-confirm-title">Access your booking</div>
            <div className="tl-confirm-sub" style={{ marginBottom: 16 }}>Enter the email you used when booking</div>
            <input
              className="form-input"
              type="email"
              placeholder="Your email address"
              value={returnEmail}
              onChange={e => { setReturnEmail(e.target.value); setReturnError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleReturnLogin()}
              style={{ marginBottom: 8 }}
              autoFocus
            />
            {returnError && <div className="form-error" style={{ marginBottom: 8 }}>{returnError}</div>}
            <div className="tl-confirm-actions">
              <button className="tl-confirm-cancel" onClick={() => { setShowReturnForm(false); setReturnError(''); setReturnEmail(''); }}>Cancel</button>
              <button className="tl-confirm-ok" onClick={handleReturnLogin} disabled={returnLoading}>
                {returnLoading ? 'Looking…' : 'Load My Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalSlot && (
        <BookingModal slot={modalSlot} onConfirm={handleModalConfirm} onCancel={handleModalCancel} />
      )}
      {view === 'booking' && activeSlot && (
        <BookingPage
          slot={activeSlot}
          onConfirm={handleBookingConfirm}
          onBack={handleBookingBack}
        />
      )}
      {view === 'celebration' && activeSlot && (
        <CelebrationOverlay slot={activeSlot} onDone={handleCelebrationDone} />
      )}

      {/* Floating "Your Booking" widget — bottom-left corner */}
      {myBookedSlot && view === 'main' && (
        <div className="booking-widget">
          <div className="bw-glow"/>
          <div className="bw-header">
            <span className="bw-star">★</span>
            <span className="bw-title">Your Booking</span>
            <button className="bw-cancel-btn" onClick={() => setShowCancelWidget(true)}>Cancel</button>
          </div>
          <div className="bw-row">
            <span className="bw-label">Date</span>
            <span className="bw-val">{new Date(myBookedSlot.start_time).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</span>
          </div>
          <div className="bw-row">
            <span className="bw-label">Time</span>
            <span className="bw-val">{new Date(myBookedSlot.start_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} – {new Date(myBookedSlot.end_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
          </div>
          <div className="bw-row">
            <span className="bw-label">Host</span>
            <span className="bw-val">{myBookedSlot.barista.name}</span>
          </div>
          <div className="bw-row">
            <span className="bw-label">Location</span>
            <span className="bw-val">{myBookedSlot.location || '—'}</span>
          </div>
          {myBookedSlot.notes && (
            <div className="bw-row bw-notes">
              <span className="bw-label">Notes</span>
              <span className="bw-val" style={{fontStyle:'italic',color:'#a0522d'}}>{myBookedSlot.notes}</span>
            </div>
          )}
          {myBookedSlot.meet_link && (
            <a href={myBookedSlot.meet_link} target="_blank" rel="noopener noreferrer" className="bw-join-btn">
              Join Meeting ↗
            </a>
          )}
        </div>
      )}

      {/* Cancel confirmation from widget */}
      {showCancelWidget && myBookedSlot && (
        <div className="tl-confirm-backdrop">
          <div className="tl-confirm-popup">
            <div className="tl-confirm-title">Cancel your booking?</div>
            <div className="tl-confirm-sub">
              {new Date(myBookedSlot.start_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} – {new Date(myBookedSlot.end_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} with {myBookedSlot.barista.name.split(' ')[0]}
            </div>
            <div className="tl-confirm-actions">
              <button className="tl-confirm-cancel" onClick={() => setShowCancelWidget(false)}>Keep it</button>
              <button className="tl-confirm-ok tl-confirm-delete" onClick={async () => { setShowCancelWidget(false); await handleCancelBooking(myBookedSlot.id); }}>Cancel booking</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CustomerPage;
