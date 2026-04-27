// Multi-select for reminder-email offsets. Stored as minutes-before-start
// to keep the backend logic uniform. Toggling sends a fresh sorted array up.
const PRESETS = [
  { label: '5 min before',   value: 5 },
  { label: '15 min before',  value: 15 },
  { label: '30 min before',  value: 30 },
  { label: '1 hour before',  value: 60 },
  { label: '3 hours before', value: 180 },
  { label: '12 hours before',value: 720 },
  { label: '1 day before',   value: 1440 },
  { label: '2 days before',  value: 2880 },
];

export default function ReminderOffsetPicker({ value = [], onChange }) {
  const set = new Set(value);

  function toggle(v) {
    const next = new Set(set);
    if (next.has(v)) next.delete(v); else next.add(v);
    onChange([...next].sort((a, b) => a - b));
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {PRESETS.map(p => {
        const active = set.has(p.value);
        return (
          <label
            key={p.value}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 16,
              border: `1.5px solid ${active ? '#c8773a' : '#e0d5cc'}`,
              background: active ? '#fff3e8' : '#fff',
              color: active ? '#3b1f0f' : '#666',
              fontSize: 13, fontWeight: active ? 600 : 500,
              cursor: 'pointer', userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={() => toggle(p.value)}
              style={{ accentColor: '#c8773a' }}
            />
            {p.label}
          </label>
        );
      })}
    </div>
  );
}
