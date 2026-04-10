function Header({ cafeName, description, ownerName, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <span className="header-icon">☕</span>
        <div>
          <div className="cafe-name">{cafeName}</div>
          <div className="cafe-tagline">{description}</div>
        </div>
      </div>
      <div className="header-right" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
        {ownerName && <div className="owner-name">{ownerName}</div>}
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#f5e6d0',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: '0.72rem',
              cursor: 'pointer',
            }}
          >
            Log Out
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
