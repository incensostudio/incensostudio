import { useEffect } from 'react'
import { C } from '../lib/tokens'
import { useNarrow } from '../lib/useNarrow'

export function Drawer({
  width = 430, onClose, children,
}: { width?: number; onClose: () => void; children: React.ReactNode }) {
  const narrow = useNarrow()
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 40,
        display: 'flex', justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          width: narrow ? '100%' : width, maxWidth: '100%', height: '100%',
          background: C.cream, boxShadow: '-8px 0 40px rgba(0,0,0,.14)',
          animation: 'drawerIn .28s ease', display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  )
}
