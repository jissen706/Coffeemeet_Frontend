import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCafeByCode, getSlots, lookupCustomerByEmail } from '../api';

function BookingAccessPage() {
  const { participantCode } = useParams();
  const navigate = useNavigate();

  const [cafe, setCafe] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingCafe, setLoadingCafe] = useState(true);
  const [cafeError, setCafeError] = useState(null);

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!participantCode) { setCafeError('Invalid link'); setLoadingCafe(false); return; }
    getCafeByCode(participantCode)
      .then((cafeData) => {
        setCafe(cafeData);
        return getSlots(cafeData.id);
      })
      .then((slotsData) => {
        setSlots(slotsData);
        setLoadingCafe(false);
      })
      .catch(() => {
        setCafeError('This link appears to be invalid or expired.');
        setLoadingCafe(false);
      });
  }, [participantCode]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address'); return; }
    setSubmitting(true);
    setError('');
    try {
      const customer = await lookupCustomerByEmail(cafe.id, email.trim());
      const bookedSlot = slots.find(s =>
        (s.customers || []).some(c => c.id === customer.user.id)
      );
      // Store session for CustomerPage to pick up
      sessionStorage.setItem('customer_token', customer.access_token);
      if (bookedSlot) {
        sessionStorage.setItem('my_booked_slot_id', String(bookedSlot.id));
      }
      navigate(`/cafe/${participantCode}`);
    } catch (err) {
      if (err.message?.includes('404') || err.message?.toLowerCase().includes('no booking')) {
        setError('No booking found for this email. Please check the email you used when signing up, or visit the café page to make a new booking.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingCafe) {
    return (
      <div className="loading-screen">
        <span>☕</span>
        Brewing your experience...
      </div>
    );
  }

  if (cafeError) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>☕</div>
          <div style={styles.brand}>CoffeeMeet</div>
          <p style={{ color: '#c0392b', textAlign: 'center', marginTop: 16 }}>{cafeError}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>☕</div>
        <div style={styles.brand}>CoffeeMeet</div>
        {cafe && <div style={styles.cafeName}>{cafe.name}</div>}

        <h2 style={styles.heading}>Access your booking</h2>
        <p style={styles.sub}>Enter the email address you used when you signed up</p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            style={styles.input}
            autoFocus
          />
          {error && (
            <div style={styles.error}>{error}</div>
          )}
          <button type="submit" style={styles.btn} disabled={submitting}>
            {submitting ? 'Looking up…' : 'Load my booking →'}
          </button>
        </form>

        <button
          onClick={() => navigate(`/cafe/${participantCode}`)}
          style={styles.backLink}
        >
          Go to café page to make a new booking
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f0eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    padding: '48px 40px',
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logo: {
    fontSize: 40,
    marginBottom: 4,
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    color: '#3b1f0f',
    marginBottom: 4,
  },
  cafeName: {
    fontSize: 14,
    color: '#c8773a',
    fontWeight: 600,
    marginBottom: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: 700,
    color: '#3b1f0f',
    margin: '0 0 8px',
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: '#888',
    margin: '0 0 24px',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 15,
    border: '1.5px solid #e0d5cc',
    borderRadius: 8,
    outline: 'none',
    marginBottom: 12,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: '#3b1f0f',
  },
  error: {
    background: '#fff3f0',
    border: '1px solid #f5c0b0',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#c0392b',
    marginBottom: 12,
    lineHeight: 1.5,
  },
  btn: {
    width: '100%',
    padding: '13px',
    background: '#c8773a',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginBottom: 16,
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'inherit',
    padding: 0,
  },
};

export default BookingAccessPage;
