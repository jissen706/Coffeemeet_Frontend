import { useState } from 'react';

function BaristaSidebar({ baristas, description }) {
  const [hovered, setHovered] = useState(null);

  return (
    <aside className="barista-sidebar">

      {/* Sticky description widget */}
      {description && (
        <div className="sidebar-description-widget">
          <div className="sidebar-title" style={{ marginBottom: 8 }}>About</div>
          <p className="sidebar-description-text">{description}</p>
        </div>
      )}

      {/* Scrollable hosts section */}
      <div className="sidebar-hosts-scroll">
        <div className="sidebar-title">Hosts</div>

        {baristas.length === 0 ? (
          <div className="no-baristas">
            <span>No hosts registered yet.</span>
          </div>
        ) : (
          baristas.map((barista) => {
            const initials = barista.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            const shortBio = barista.bio
              ? barista.bio.length > 60 ? barista.bio.slice(0, 60).trimEnd() + '…' : barista.bio
              : null;

            return (
              <div
                key={barista.id}
                className="barista-card"
                onMouseEnter={() => setHovered(barista.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ position: 'relative' }}
              >
                <div className="barista-card-top">
                  <div className="barista-avatar">{initials}</div>
                  <div className="barista-name">{barista.name}</div>
                </div>

                {shortBio ? (
                  <div className="barista-bio-short">{shortBio}</div>
                ) : (
                  <div className="barista-bio-empty">No bio added</div>
                )}

                <div className="barista-contact">
                  <div className="barista-contact-row">
                    <svg className="contact-icon" style={{ width: 12, height: 12 }} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="4.5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M2 7l7.47 4.67a1 1 0 001.06 0L18 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    <span>{barista.email}</span>
                  </div>
                  {barista.phone_number && (
                    <div className="barista-contact-row">
                      <svg className="contact-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.5 3h2.8l1.2 3.2-1.7 1a9.1 9.1 0 004 4l1-1.7 3.2 1.2V13A1.5 1.5 0 0114.5 14.5C8.4 14.5 5.5 8.4 5.5 5.5A1.5 1.5 0 015.5 3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{barista.phone_number}</span>
                    </div>
                  )}
                </div>

                {/* Full bio popup on hover */}
                {hovered === barista.id && barista.bio && barista.bio.length > 60 && (
                  <div className="barista-bio-popup">
                    <div className="barista-bio-popup-name">{barista.name}</div>
                    <div className="barista-bio-popup-text">{barista.bio}</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

export default BaristaSidebar;
