import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCafeByCode, getCafeByHostCode } from '../api';

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
      await getCafeByHostCode(code);
      navigate(`/barista?code=${encodeURIComponent(code)}`);
    } catch {
      setBaristaError('Invalid host code — check with your admin');
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
        {/* Admin */}
        <div className="landing-card">
          <div className="landing-card-icon">
            {/* Dashboard/grid icon */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="14" height="14" rx="3" fill="#c8773a" opacity="0.85"/>
              <rect x="22" y="4" width="14" height="14" rx="3" fill="#c8773a" opacity="0.5"/>
              <rect x="4" y="22" width="14" height="14" rx="3" fill="#c8773a" opacity="0.5"/>
              <rect x="22" y="22" width="14" height="14" rx="3" fill="#c8773a" opacity="0.85"/>
            </svg>
          </div>
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

        {/* Host */}
        <div className="landing-card">
          <div className="landing-card-icon">
            {/* Person with clock/availability icon */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="12" r="7" fill="#c8773a" opacity="0.85"/>
              <path d="M2 34 C2 26 10 22 16 22 C19 22 22 23 24 25" stroke="#c8773a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <circle cx="30" cy="30" r="8" fill="#3d1a08" stroke="#c8773a" strokeWidth="2"/>
              <path d="M30 26 L30 30 L33 32" stroke="#c8773a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="landing-card-title">I'm a Host</h2>
          <p className="landing-card-desc">
            Got a join code from your admin? Enter it here to manage your slots.
          </p>
          <form onSubmit={handleBaristaGo} style={{ width: '100%' }}>
            <input
              className={`form-input landing-code-input${baristaError ? ' form-input-error' : ''}`}
              type="text"
              placeholder="Enter host code (e.g. DEMO01)"
              value={baristaCode}
              onChange={(e) => { setBaristaCode(e.target.value.toUpperCase()); setBaristaError(''); }}
            />
            {baristaError && <span className="form-error">{baristaError}</span>}
            <button className="landing-card-btn landing-card-btn-secondary" type="submit" disabled={baristaLoading}>
              {baristaLoading ? 'Checking…' : 'Open Host Dashboard →'}
            </button>
          </form>
        </div>

        {/* Participant */}
        <div className="landing-card">
          <div className="landing-card-icon">
            {/* Calendar with checkmark */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="8" width="32" height="28" rx="4" fill="#3d1a08" stroke="#c8773a" strokeWidth="2"/>
              <rect x="4" y="8" width="32" height="10" rx="4" fill="#c8773a" opacity="0.7"/>
              <line x1="13" y1="4" x2="13" y2="12" stroke="#c8773a" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="27" y1="4" x2="27" y2="12" stroke="#c8773a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M13 26 L17 30 L27 22" stroke="#c8773a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="landing-card-title">I'm booking a Coffee Chat</h2>
          <p className="landing-card-desc">
            Have a link or join code from your organization? Enter it here to see available slots.
          </p>
          <form onSubmit={handleCustomerGo} style={{ width: '100%' }}>
            <input
              className={`form-input landing-code-input${customerError ? ' form-input-error' : ''}`}
              type="text"
              placeholder="Enter participant code (e.g. DEMO01)"
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

      {/* Penn footer */}
      <div className="landing-penn-footer">
        <svg className="landing-penn-logo" width="28" height="32" viewBox="0 0 80 92" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Shield outline */}
          <path d="M4 4 H76 V54 Q76 82 40 90 Q4 82 4 54 Z" fill="#011F5B"/>
          {/* Crimson top bar */}
          <path d="M4 4 H76 V26 H4 Z" fill="#990000"/>
          {/* Shield border */}
          <path d="M4 4 H76 V54 Q76 82 40 90 Q4 82 4 54 Z" fill="none" stroke="#fff" strokeWidth="1.5"/>
          {/* White chevron */}
          <path d="M4 52 L40 28 L76 52" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round"/>
          {/* Three white circles */}
          <circle cx="24" cy="65" r="7" fill="#fff"/>
          <circle cx="40" cy="65" r="7" fill="#fff"/>
          <circle cx="56" cy="65" r="7" fill="#fff"/>
          {/* Books on top bar (left) */}
          <rect x="12" y="9" width="8" height="10" rx="1" fill="#fff" opacity="0.9"/>
          <line x1="16" y1="9" x2="16" y2="19" stroke="#990000" strokeWidth="1"/>
          {/* Books on top bar (right) */}
          <rect x="60" y="9" width="8" height="10" rx="1" fill="#fff" opacity="0.9"/>
          <line x1="64" y1="9" x2="64" y2="19" stroke="#990000" strokeWidth="1"/>
          {/* Motto scroll */}
          <path d="M8 86 Q40 92 72 86" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.5"/>
        </svg>
        <span>Created by Penn Engineering Student</span>
      </div>
    </div>
  );
}
