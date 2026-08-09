import { useEffect, useState } from 'react'

// Single breakpoint from the handoff: 820px. Uses a media query listener.
export function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width:819px)').matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width:819px)')
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return narrow
}
