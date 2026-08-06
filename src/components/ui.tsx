import type { CSSProperties, ReactNode } from 'react'

/** Coloured initials disc used for staff throughout the app. */
export function Disc({ init, bg, size = 19 }: { init: string; bg: string; size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 999, background: bg, color: '#FEFEF1', display: 'grid', placeItems: 'center', fontFamily: "'Geist Mono',monospace", fontSize: size >= 22 ? 9 : 8.5, flex: 'none' }}>
      {init}
    </span>
  )
}

/** Channel / type chip. */
export function Chip({ label, bg, fg, style }: { label: string; bg: string; fg: string; style?: CSSProperties }) {
  return (
    <span style={{ background: bg, color: fg, borderRadius: 4, padding: '2px 5px', fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', ...style }}>
      {label}
    </span>
  )
}

export function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 11, padding: '13px 14px' }}>
      <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>{label}</div>
      <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 26, lineHeight: 1.1, paddingTop: 6 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)', paddingTop: 3 }}>{note}</div>
    </div>
  )
}

/** View wrapper — the standard padding for each screen. */
export function View({ children }: { children: ReactNode }) {
  return <div style={{ padding: '18px 20px 40px' }}>{children}</div>
}

export function Eyebrow({ children, color = 'rgba(0,0,0,.42)', style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.18em', textTransform: 'uppercase', color, ...style }}>
      {children}
    </div>
  )
}
