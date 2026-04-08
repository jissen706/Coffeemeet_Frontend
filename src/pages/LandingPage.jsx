import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCafeByCode } from '../api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [baristaCode, setBaristaCode] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [baristaError, setBaristaError] = useState('');
  const [customerError, setCustomerError] = useState('');
  const [baristaLoading, setBaristaLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);

  async function handleBaristaGo(e) {
    e.preventDefault();
    const code = baristaCode.trim();
    if (!code) { setBaristaError('Enter a join code'); return; }
    setBaristaLoading(true);
    try {
      await getCafeByCode(code);
      navigate(`/barista?code=${encodeURIComponent(code)}`);
    } catch {
      setBaristaError('Invalid join code — check with your admin');
    } finally {
      setBaristaLoading(false);
    }
  }

  async function handleCustomerGo(e) {
    e.preventDefault();
    const code = customerCode.trim();
    if (!code) { setCustomerError('Enter a join code'); return; }
    setCustomerLoading(true);
    try {
      await getCafeByCode(code);
      navigate(`/cafe/${encodeURIComponent(code)}`);
    } catch {
      setCustomerError('Invalid join code — check with your admin');
    } finally {
      setCustomerLoading(false);
    }
  }

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="landing-logo">☕</div>
        <h1 className="landing-title">CoffeeMeet</h1>
        <p className="landing-subtitle">
          The easiest way to schedule coffee chats for your organization.
        </p>
      </div>

      <div className="landing-cards">
        {/* Owner */}
        <div className="landing-card">
          <div className="landing-card-icon">🏠</div>
          <h2 className="landing-card-title">I'm an Admin</h2>
          <p className="landing-card-desc">
            Create a café, set availability, and share links with your hosts and participants.
          </p>
          <button
            className="landing-card-btn landing-card-btn-primary"
            onClick={() => navigate('/owner')}
          >
            Go to Admin Portal →
          </button>
        </div>

        {/* Barista */}
        <div className="landing-card">
          <div className="landing-card-icon">👋</div>
          <h2 className="landing-card-title">I'm a Host</h2>
          <p className="landing-card-desc">
            Got a join code from your admin? Enter it here to manage your slots.
          </p>
          <form onSubmit={handleBaristaGo} style={{ width: '100%' }}>
            <input
              className={`form-input landing-code-input${baristaError ? ' form-input-error' : ''}`}
              type="text"
              placeholder="Enter join code (e.g. DEMO01)"
              value={baristaCode}
              onChange={(e) => { setBaristaCode(e.target.value.toUpperCase()); setBaristaError(''); }}
            />
            {baristaError && <span className="form-error">{baristaError}</span>}
            <button className="landing-card-btn landing-card-btn-secondary" type="submit" disabled={baristaLoading}>
              {baristaLoading ? 'Checking…' : 'Open Host Dashboard →'}
            </button>
          </form>
        </div>

        {/* Customer */}
        <div className="landing-card">
          <div className="landing-card-icon">📅</div>
          <h2 className="landing-card-title">I'm booking a Coffee Chat</h2>
          <p className="landing-card-desc">
            Have a link or join code from your organization? Enter it here to see available slots.
          </p>
          <form onSubmit={handleCustomerGo} style={{ width: '100%' }}>
            <input
              className={`form-input landing-code-input${customerError ? ' form-input-error' : ''}`}
              type="text"
              placeholder="Enter join code (e.g. DEMO01)"
              value={customerCode}
              onChange={(e) => { setCustomerCode(e.target.value.toUpperCase()); setCustomerError(''); }}
            />
            {customerError && <span className="form-error">{customerError}</span>}
            <button className="landing-card-btn landing-card-btn-secondary" type="submit" disabled={customerLoading}>
              {customerLoading ? 'Checking…' : 'View Available Slots →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
