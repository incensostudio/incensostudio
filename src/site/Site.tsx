import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { svcCat, staff } from '../data/fixtures'
import { Wordmark, AskSquare } from '../components/icons'
import { money } from '../lib/logic'

const DEPTS = ['Hair', 'Nails', 'Makeup', 'Brows & Lashes'] as const
const MAXW = 1120

export function Site() {
  return (
    <div style={{ background: '#e5dcc9', color: '#000', minHeight: '100dvh', fontFamily: "'Geist','Helvetica Neue',Helvetica,Arial,sans-serif" }}>
      <SiteNav />
      <Hero />
      <Services />
      <Ethos />
      <Team />
      <Visit />
      <Book />
      <Footer />
    </div>
  )
}

function useScrollTo() {
  return (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function SiteNav() {
  const [open, setOpen] = useState(false)
  const scrollTo = useScrollTo()
  const links: [string, string][] = [
    ['Services', 'services'],
    ['Team', 'team'],
    ['Visit', 'visit'],
  ]
  const jump = (id: string) => { setOpen(false); scrollTo(id) }
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(254,254,241,.86)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,.1)' }}>
      <div style={{ maxWidth: MAXW, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => jump('top')} style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }} aria-label="Incenso Studio"><Wordmark /></button>
        <nav className="site-desktop-nav" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          {links.map(([label, id]) => (
            <button key={id} onClick={() => jump(id)} style={navLink}>{label}</button>
          ))}
          <Link to="/os" style={{ ...navLink, textDecoration: 'none' }}>Staff login</Link>
          <button onClick={() => jump('book')} style={ctaPill}>Book a visit</button>
        </nav>
        <button className="site-burger" onClick={() => setOpen((v) => !v)} aria-label="Menu" style={{ marginLeft: 'auto', width: 40, height: 40, border: '1px solid rgba(0,0,0,.18)', borderRadius: 10, background: 'none', display: 'none', placeItems: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" stroke="#000" strokeWidth={1.7} strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>
      {open && (
        <div className="site-mobile-menu" style={{ borderTop: '1px solid rgba(0,0,0,.1)', padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {links.map(([label, id]) => (
            <button key={id} onClick={() => jump(id)} style={{ ...navLink, textAlign: 'left', padding: '12px 4px', fontSize: 15 }}>{label}</button>
          ))}
          <Link to="/os" style={{ ...navLink, textAlign: 'left', padding: '12px 4px', fontSize: 15, textDecoration: 'none' }}>Staff login</Link>
          <button onClick={() => jump('book')} style={{ ...ctaPill, marginTop: 8, padding: '13px', textAlign: 'center' }}>Book a visit</button>
        </div>
      )}
    </header>
  )
}

function Hero() {
  const scrollTo = useScrollTo()
  return (
    <section id="top" style={{ maxWidth: MAXW, margin: '0 auto', padding: 'clamp(48px, 9vw, 108px) 20px clamp(40px, 7vw, 80px)' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, border: '1px solid rgba(0,0,0,.18)', borderRadius: 999, padding: '7px 14px', background: '#FEFEF1' }}>
        <AskSquare size={7} />
        <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(0,0,0,.55)' }}>Hair · Nails · Makeup · Brows &amp; Lashes</span>
      </div>
      <h1 style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 'clamp(40px, 8.5vw, 88px)', lineHeight: 1.02, letterSpacing: '-.015em', margin: '22px 0 0', maxWidth: 15 + 'ch' }}>
        The salon that remembers you.
      </h1>
      <p style={{ fontSize: 'clamp(15px, 2.4vw, 19px)', lineHeight: 1.6, color: 'rgba(0,0,0,.66)', maxWidth: 560, margin: '20px 0 0' }}>
        Your formula, your coffee, the copper you asked about in July — kept on file by the person
        who did your hair, ready for the next one who does. Colour, nails, makeup and brows, done by
        people who write it all down.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 30 }}>
        <button onClick={() => scrollTo('book')} style={{ ...ctaPill, padding: '14px 24px', fontSize: 11 }}>Book your visit</button>
        <button onClick={() => scrollTo('services')} style={{ border: '1px solid rgba(0,0,0,.2)', background: '#FEFEF1', borderRadius: 999, padding: '14px 24px', fontFamily: "'Geist Mono',monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer' }}>See the menu</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 28px', marginTop: 38, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,.12)' }}>
        {[
          ['Open', 'Mon–Sat · 09:00–20:00'],
          ['Find us', 'Gemmayze, Beirut'],
          ['Book', 'WhatsApp · +961 1 000 000'],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>{k}</div>
            <div style={{ fontSize: 14, paddingTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Services() {
  const [dept, setDept] = useState<(typeof DEPTS)[number]>('Hair')
  const list = useMemo(() => svcCat.filter((sv) => sv.cat === dept), [dept])
  return (
    <section id="services" style={{ background: '#FEFEF1', borderTop: '1px solid rgba(0,0,0,.1)', borderBottom: '1px solid rgba(0,0,0,.1)' }}>
      <div style={{ maxWidth: MAXW, margin: '0 auto', padding: 'clamp(44px, 7vw, 76px) 20px' }}>
        <SectionLabel>The menu</SectionLabel>
        <h2 style={heading}>Everything, priced plainly.</h2>
        <p style={sub}>Prices marked “from” move with length and time — we tell you before we start, never after.</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '26px 0 22px' }}>
          {DEPTS.map((d) => {
            const on = d === dept
            return (
              <button key={d} onClick={() => setDept(d)} style={{ border: '1px solid rgba(0,0,0,.18)', borderRadius: 999, padding: '9px 16px', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', background: on ? '#000' : 'transparent', color: on ? '#FEFEF1' : 'rgba(0,0,0,.72)' }}>{d}</button>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0 40px' }}>
          {list.map((sv) => (
            <div key={sv.name} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '13px 0', borderTop: '1px solid rgba(0,0,0,.08)' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15 }}>{sv.name}</div>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)', paddingTop: 2 }}>{sv.sub} · {sv.min} min</div>
              </div>
              <div style={{ flex: 1, borderBottom: '1px dotted rgba(0,0,0,.2)', transform: 'translateY(-4px)' }} />
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, whiteSpace: 'nowrap' }}>{sv.base === 0 ? 'Free' : (sv.from ? 'from ' : '') + money(sv.base)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Ethos() {
  const points = [
    ['Your formula, on file', 'The exact mix, the developer, the timing. You never have to remember it — we do.'],
    ['What you told us', 'Ammonia sensitivity, the box dye four months ago, the fringe you want before winter. Written down, brought up before we start.'],
    ['Your coffee, ready', 'Espresso double no sugar. Green tea, one honey. Chamomile after four. It’s waiting when you sit.'],
    ['Come back at the right time', 'A quiet message a few days before your colour actually needs us — not a week of nagging.'],
  ]
  return (
    <section style={{ maxWidth: MAXW, margin: '0 auto', padding: 'clamp(44px, 7vw, 80px) 20px' }}>
      <SectionLabel>Why Incenso</SectionLabel>
      <h2 style={heading}>A file that follows you, not a form you fill in.</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 28 }}>
        {points.map(([t, d]) => (
          <div key={t} style={{ background: '#FEFEF1', border: '1px solid rgba(0,0,0,.12)', borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 20 }}>{t}</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(0,0,0,.62)', margin: '8px 0 0' }}>{d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Team() {
  const artists = staff.filter((s) => s.skills.length)
  return (
    <section id="team" style={{ background: '#FEFEF1', borderTop: '1px solid rgba(0,0,0,.1)', borderBottom: '1px solid rgba(0,0,0,.1)' }}>
      <div style={{ maxWidth: MAXW, margin: '0 auto', padding: 'clamp(44px, 7vw, 76px) 20px' }}>
        <SectionLabel>The people</SectionLabel>
        <h2 style={heading}>Ask for them by name.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginTop: 28 }}>
          {artists.map((a) => (
            <div key={a.id} style={{ border: '1px solid rgba(0,0,0,.12)', borderRadius: 14, overflow: 'hidden', background: '#e5dcc9' }}>
              <div style={{ height: 120, background: a.bg, display: 'grid', placeItems: 'center' }}>
                <span style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 40, color: '#FEFEF1' }}>{a.init}</span>
              </div>
              <div style={{ padding: '13px 15px 16px' }}>
                <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 20 }}>{a.name}</div>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)', paddingTop: 3 }}>{a.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Visit() {
  return (
    <section id="visit" style={{ maxWidth: MAXW, margin: '0 auto', padding: 'clamp(44px, 7vw, 80px) 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        <div style={{ background: '#000', color: '#FEFEF1', borderRadius: 16, padding: 'clamp(22px, 4vw, 32px)' }}>
          <SectionLabel dark>Visit us</SectionLabel>
          <h2 style={{ ...heading, color: '#FEFEF1', marginTop: 10 }}>Gemmayze, Beirut.</h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(254,254,241,.8)', marginTop: 12 }}>Rue Gouraud, above the corner café. Street parking after 18:00; valet on weekends.</p>
          <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
            {[
              ['Hours', 'Monday–Saturday · 09:00–20:00', 'Closed Sundays'],
              ['Phone / WhatsApp', '+961 1 000 000', 'Voice notes welcome'],
              ['Email', 'hello@incenso.studio', ''],
            ].map(([k, v, note]) => (
              <div key={k} style={{ borderTop: '1px solid rgba(254,254,241,.18)', paddingTop: 12 }}>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: '#e5c07a' }}>{k}</div>
                <div style={{ fontSize: 15, paddingTop: 3 }}>{v}</div>
                {note && <div style={{ fontSize: 12, color: 'rgba(254,254,241,.55)', paddingTop: 1 }}>{note}</div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,.12)', minHeight: 300, background: 'linear-gradient(135deg,#f3ead6,#e6e2f2)', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
            <div>
              <div style={{ width: 12, height: 12, background: '#000', transform: 'rotate(45deg)', margin: '0 auto 14px' }} />
              <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 22 }}>Incenso Studio</div>
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)', paddingTop: 4 }}>33.8938° N, 35.5177° E</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Book() {
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', service: 'Balayage', day: '' })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setDone(true)
  }
  return (
    <section id="book" style={{ background: '#FEFEF1', borderTop: '1px solid rgba(0,0,0,.1)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(44px, 7vw, 80px) 20px' }}>
        <SectionLabel>Book</SectionLabel>
        <h2 style={heading}>Request a visit.</h2>
        <p style={sub}>Tell us what you’re after and when. We confirm on WhatsApp — usually within the hour, always with a real person.</p>

        {done ? (
          <div style={{ marginTop: 26, background: '#e2ebdd', border: '1px solid rgba(0,0,0,.1)', borderRadius: 14, padding: '22px 24px' }}>
            <div style={{ fontFamily: "'ALT Gumbo',serif", fontSize: 22 }}>Thank you, {form.name.split(' ')[0] || 'we’ve got it'}.</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(0,0,0,.7)', marginTop: 8 }}>
              We’ll message you on WhatsApp to confirm your {form.service.toLowerCase()}{form.day ? ` around ${form.day}` : ''}. If it’s your first colour, we’ll fit in a two-minute patch test first.
            </p>
            <button onClick={() => { setDone(false); setForm({ name: '', phone: '', service: 'Balayage', day: '' }) }} style={{ marginTop: 14, border: '1px solid rgba(0,0,0,.2)', background: 'none', borderRadius: 999, padding: '10px 18px', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}>Send another</button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ marginTop: 26, display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Field label="Your name"><input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Layal Haddad" style={field} /></Field>
              <Field label="Mobile"><input required value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+961 …" style={field} /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Field label="Service"><select value={form.service} onChange={(e) => set('service', e.target.value)} style={field}>{svcCat.map((sv) => <option key={sv.name} value={sv.name}>{sv.name}</option>)}</select></Field>
              <Field label="Preferred day"><input value={form.day} onChange={(e) => set('day', e.target.value)} placeholder="Saturday afternoon" style={field} /></Field>
            </div>
            <button type="submit" style={{ ...ctaPill, marginTop: 4, padding: '15px', textAlign: 'center', fontSize: 11 }}>Send the request</button>
            <p style={{ fontSize: 11.5, color: 'rgba(0,0,0,.45)', textAlign: 'center' }}>No deposit to enquire. Nothing is booked until we confirm with you.</p>
          </form>
        )}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{ background: '#e5dcc9', borderTop: '1px solid rgba(0,0,0,.12)' }}>
      <div style={{ maxWidth: MAXW, margin: '0 auto', padding: '30px 20px 40px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
        <Wordmark />
        <span style={{ fontSize: 12, color: 'rgba(0,0,0,.5)' }}>© {2026} Incenso Studio · Gemmayze, Beirut</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
          <Link to="/os" style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,.55)' }}>Staff login</Link>
        </div>
      </div>
    </footer>
  )
}

// --- small building blocks ---
function SectionLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: dark ? '#e5c07a' : 'rgba(0,0,0,.42)' }}>{children}</div>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,.42)' }}>{label}</span>
      <div style={{ marginTop: 6 }}>{children}</div>
    </label>
  )
}

const heading: React.CSSProperties = { fontFamily: "'ALT Gumbo',serif", fontSize: 'clamp(28px, 5vw, 44px)', lineHeight: 1.08, letterSpacing: '-.01em', margin: '10px 0 0' }
const sub: React.CSSProperties = { fontSize: 'clamp(14px, 2.2vw, 16px)', lineHeight: 1.6, color: 'rgba(0,0,0,.6)', maxWidth: 560, margin: '12px 0 0' }
const navLink: React.CSSProperties = { border: 0, background: 'none', cursor: 'pointer', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,.72)', padding: '10px 12px' }
const ctaPill: React.CSSProperties = { border: 0, background: '#000', color: '#FEFEF1', borderRadius: 999, padding: '11px 18px', fontFamily: "'Geist Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer' }
const field: React.CSSProperties = { width: '100%', background: '#fdfaf0', border: '1px solid rgba(0,0,0,.16)', borderRadius: 10, padding: '12px 14px', fontSize: 14, fontFamily: 'inherit' }
