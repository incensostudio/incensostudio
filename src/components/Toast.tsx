import { useStore } from '../store/useStore'

export function Toast() {
  const toast = useStore((s) => s.toast)
  if (!toast) return null
  return (
    <div
      role="status"
      style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 120, background: '#000', color: '#FEFEF1', borderRadius: 14, padding: '13px 18px', boxShadow: '0 16px 40px rgba(0,0,0,.3)', maxWidth: 'min(620px,88vw)', display: 'flex', alignItems: 'center', gap: 10, animation: 'toastIn .2s ease' }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: toast.tone === 'warn' ? '#e59a8a' : '#9fc08a', flex: 'none' }} />
      <span style={{ fontSize: 12.5, lineHeight: 1.5 }}>{toast.text}</span>
    </div>
  )
}
