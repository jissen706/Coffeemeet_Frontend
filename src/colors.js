// Per-host color palette. Used to keep a host's avatar, calendar dot, and
// timeline slot color visually consistent so customers can scan by host.
export const HOST_COLORS = [
  '#8b4513', '#1a7a40', '#2980b9', '#7b4f9e',
  '#c8773a', '#c0392b', '#2c7873',
];

export function colorOf(id) {
  return HOST_COLORS[id % HOST_COLORS.length];
}

// Lighter tint of a host color, used to fill in calendar day cells when the
// filter for that host is active without overpowering the day's other content.
export function tintOf(id, alpha = 0.18) {
  const c = colorOf(id);
  // c is a 6-char hex like #c8773a. Convert to rgba.
  const r = parseInt(c.slice(1, 3), 16);
  const g = parseInt(c.slice(3, 5), 16);
  const b = parseInt(c.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
