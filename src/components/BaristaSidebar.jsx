import { useState } from 'react';

function BaristaSidebar({ baristas }) {
  const [hovered, setHovered] = useState(null);

  return (
    <aside className="barista-sidebar">
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
                  <span className="contact-icon">&#9993;</span>
                  <span>{barista.email}</span>
                </div>
                {barista.phone_number && (
                  <div className="barista-contact-row">
                    <span className="contact-icon">&#128222;</span>
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
    </aside>
  );
}

export default BaristaSidebar;
