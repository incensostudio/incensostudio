import { useEffect, useState } from 'react'
import { C, F } from '../lib/tokens'
import { Logo } from '../components/Logo'
import { callDeskAuth } from '../lib/supabase'
import { useStore } from '../store'
import { dayName, todayStr } from '../lib/format'
import type { DeskChip } from '../lib/types'

export function SignIn() {
  const { login } = useStore()
  const [chips, setChips] = useState<DeskChip[]>([])
  const [picked, setPicked] = useState<DeskChip | null>(null)
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)
  const [msg, setMsg] = useState('Tap in your passcode to open the desk.')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    callDeskAuth({ action: 'chips' }).then(({ data }) => {
      if (data?.chips) setChips(data.chips)
    })
  }, [])

  const submit = async (code: string, who: DeskChip) => {
    setBusy(true)
    const r = await login(who.id, code)
    setBusy(false)
    if (r === 'ok') return
    setPin('')
    setErr(true)
    if (r === 'locked') setMsg('Too many tries — locked for 15 minutes.')
    else if (r === 'error') setMsg('Could not reach the desk. Check the connection.')
    else setMsg("That code didn't match")
    setTimeout(() => setErr(false), 600)
  }

  const press = (k: string) => {
    if (busy) return
    if (k === 'clear') { setPin(''); setErr(false); return }
    if (k === 'back') { setPin((p) => p.slice(0, -1)); setErr(false); return }
    if (!picked) { setMsg("Pick who's on the desk first."); return }
    const next = (pin + k).slice(0, 6)
    setPin(next)
    setErr(false)
    if (next.length === 6) setTimeout(() => submit(next, picked), 140)
  }

  const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back']

  return (
    <div style={{ height: '100vh', width: '100%', background: C.sand, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 394, maxWidth: '100%', background: C.cream, border: `1px solid ${C.hair14}`, borderRadius: 16, padding: '30px 28px 26px', animation: err ? 'shake .5s ease' : 'riseIn .3s ease' }}>
        <Logo height={22} />
        <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: C.mut42, paddingTop: 9 }}>
          Beauty Studio · {dayName(todayStr())}
        </div>

        <div style={{ fontFamily: F.display, fontSize: 20, padding: '22px 0 10px' }}>Who is on the desk?</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {chips.map((u) => {
            const on = picked?.id === u.id
            return (
              <button key={u.id} onClick={() => { setPicked(u); setPin(''); setErr(false); setMsg(`${u.name} — enter your passcode`) }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, border: `1px solid ${on ? '#000' : C.hair14}`, borderRadius: 11, padding: '11px 6px', cursor: 'pointer', background: on ? C.ink : C.cream }}>
                <span style={{ width: 30, height: 30, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontSize: 10, color: C.cream, background: u.colour }}>{u.initials}</span>
                <span style={{ fontSize: 11.5, color: on ? C.cream : C.ink }}>{u.name}</span>
                <span style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: on ? 'rgba(254,254,241,.6)' : C.mut42 }}>{u.role_label}</span>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 0 12px' }}>
          <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: '.18em', textTransform: 'uppercase', color: C.mut42 }}>Passcode</div>
          <div style={{ display: 'flex', gap: 7, marginLeft: 'auto' }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} style={{ width: 11, height: 11, borderRadius: 999, border: '1px solid rgba(0,0,0,.35)', background: pin.length > i ? '#000' : 'transparent' }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
          {keypad.map((k) => (
            <button key={k} onClick={() => press(k)}
              style={{ border: `1px solid ${C.hair14}`, background: C.cream, borderRadius: 10, padding: '14px 0', cursor: 'pointer', fontFamily: F.mono, fontSize: k === 'clear' || k === 'back' ? 9.5 : 17, color: k === 'clear' || k === 'back' ? 'rgba(0,0,0,.5)' : '#000' }}>
              {k === 'clear' ? 'Clear' : k === 'back' ? '←' : k}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 11.5, color: err ? C.alert : C.mut45, paddingTop: 14 }}>{msg}</div>
      </div>
    </div>
  )
}
