// Design tokens — exact values from the Incenso handoff.
export const C = {
  sand: '#e5dcc9',
  cream: '#FEFEF1',
  creamSunk: '#faf6ea',
  wheat: '#f3ead6',
  wheatDeep: '#f7f2e4',
  arrived: '#f6e7c8',
  paid: '#ece8db',
  off: '#eee9db',
  ink: '#000',
  alert: '#b4462f',
  hair12: 'rgba(0,0,0,.12)',
  hair14: 'rgba(0,0,0,.14)',
  hair09: 'rgba(0,0,0,.09)',
  hair07: 'rgba(0,0,0,.07)',
  mut45: 'rgba(0,0,0,.45)',
  mut42: 'rgba(0,0,0,.42)',
  mut38: 'rgba(0,0,0,.38)',
  mut25: 'rgba(0,0,0,.25)',
  mut16: 'rgba(0,0,0,.16)',
}

export const F = {
  display: "'ALT Gumbo', Georgia, serif",
  ui: "'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
}

// Calendar geometry
export const CAL = { start: 9 * 60, end: 20 * 60, px: 0.95, gutter: 44, gutterM: 38 }

export const label = (size = 8.5, spacing = '.16em'): React.CSSProperties => ({
  fontFamily: F.mono,
  fontSize: size,
  letterSpacing: spacing,
  textTransform: 'uppercase',
  color: C.mut42,
})
