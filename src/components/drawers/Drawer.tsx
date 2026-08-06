import type { ReactNode } from 'react'
import { CloseIcon } from '../icons'

/** Right-hand drawer with backdrop. Backdrop click closes. */
export function Drawer({ width, onClose, children, z = 61 }: { width: number | string; onClose: () => void; children: ReactNode; z?: number }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.28)', zIndex: z - 1 }} />
      <div
        style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width, background: '#FEFEF1', zIndex: z, overflowY: 'auto', animation: 'drawerIn .22s ease', boxShadow: '-8px 0 40px rgba(0,0,0,.14)' }}
      >
        {children}
      </div>
    </>
  )
}

/** Centered modal with backdrop. */
export function Modal({ width, onClose, children, z = 61 }: { width: number | string; onClose: () => void; children: ReactNode; z?: number }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.32)', zIndex: z - 1, display: 'grid', placeItems: 'center' }}>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ width, maxHeight: '88vh', overflowY: 'auto', background: '#FEFEF1', borderRadius: 14, boxShadow: '0 30px 80px rgba(0,0,0,.32)', zIndex: z, animation: 'fadeIn .2s ease' }}
        >
          {children}
        </div>
      </div>
    </>
  )
}

export function DrawerClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      title="Close"
      style={{ width: 30, height: 30, border: '1px solid rgba(0,0,0,.18)', borderRadius: 999, background: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'rgba(0,0,0,.55)', flex: 'none' }}
    >
      <CloseIcon />
    </button>
  )
}
