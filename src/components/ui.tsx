import { C, F } from '../lib/tokens'

// Black pill button (primary desk action).
export function Pill({
  children, onClick, dark = true, mono = true, size = 10, style, title, disabled, dataTap,
}: {
  children: React.ReactNode; onClick?: () => void; dark?: boolean; mono?: boolean
  size?: number; style?: React.CSSProperties; title?: string; disabled?: boolean; dataTap?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      data-tap={dataTap}
      style={{
        border: dark ? '0' : `1px solid ${C.hair14}`,
        background: dark ? C.ink : C.cream,
        color: dark ? C.cream : C.ink,
        borderRadius: 999, padding: '8px 14px', cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontFamily: mono ? F.mono : F.ui, fontSize: size,
        letterSpacing: mono ? '.12em' : undefined, textTransform: mono ? 'uppercase' : undefined,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function MonoLabel({ children, size = 8.5, spacing = '.16em', color = C.mut42, style }: {
  children: React.ReactNode; size?: number; spacing?: string; color?: string; style?: React.CSSProperties
}) {
  return (
    <div style={{ fontFamily: F.mono, fontSize: size, letterSpacing: spacing, textTransform: 'uppercase', color, ...style }}>
      {children}
    </div>
  )
}

export function Avatar({ init, colour, size = 30 }: { init: string; colour: string; size?: number }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: 999, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: F.mono, fontSize: size * 0.33, color: C.cream,
      background: colour, flex: 'none',
    }}>{init}</span>
  )
}

export const inputStyle: React.CSSProperties = {
  width: '100%', background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 9,
  padding: '10px 12px', fontFamily: F.ui, fontSize: 13, color: C.ink,
}

export const selectStyle: React.CSSProperties = {
  background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 6,
  padding: '6px 8px', fontFamily: F.mono, fontSize: 10, color: C.ink, cursor: 'pointer',
}
