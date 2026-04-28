import { useState, useEffect } from 'react'
import { getHabits, getCompletions, addHabit, deleteHabit, toggleCompletion } from './db'
import {
  supabase, getUser, signIn, signUp, signOut,
  pushHabit, removeHabit, pushCompletion, removeCompletion, pullUserData
} from './supabase'
import Today  from './components/Today'
import Stats  from './components/Stats'
import Weekly from './components/Weekly'
import Coach  from './components/Coach'

export const EMOJIS = ['💧','🏃','📚','😴','🧘','🥗','💊','🎯','✍️','🎸','🧹','🌱','💪','🧠','🎨','☕','🍎','🚴']
export const COLORS  = ['#1D9E75','#378ADD','#BA7517','#D85A30','#534AB7','#D4537E','#639922','#888780']
export const TIMES   = ['Morning','Afternoon','Evening','Anytime']

export function ds(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function uid() { return 'h' + Date.now() + Math.floor(Math.random() * 999999) }

// ─── Auth Screen ──────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }) {
  const [mode, setMode]       = useState('login')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) { setError('Please fill in both fields.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError(''); setLoading(true)
    try {
      if (mode === 'login') await signIn(email.trim(), password)
      else await signUp(email.trim(), password)
      onAuth()
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:52, marginBottom:10 }}>✅</div>
          <div style={{ fontSize:24, fontWeight:700, color:'var(--brand)' }}>Habit Tracker</div>
          <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:4 }}>Build better habits, every day</div>
        </div>

        <div style={{ background:'var(--bg-card)', border:'var(--border)', borderRadius:16, padding:'1.75rem 1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,.07)' }}>
          <div style={{ display:'flex', background:'var(--bg-muted)', borderRadius:10, padding:4, marginBottom:24 }}>
            {['login','signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                flex:1, padding:'8px 0', border:'none', borderRadius:8, fontSize:13, fontWeight:600,
                background: mode===m ? 'var(--bg-card)' : 'transparent',
                color: mode===m ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: mode===m ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                transition:'all .2s'
              }}>{m === 'login' ? 'Sign in' : 'Create account'}</button>
            ))}
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 }}>Email</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleSubmit()} autoFocus/>
          </div>
          <div style={{ marginBottom: error ? 12 : 20 }}>
            <label style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 }}>Password</label>
            <input type="password" placeholder="Min. 6 characters" value={password}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleSubmit()}/>
          </div>

          {error && (
            <div style={{ background:'#FEE2E2', border:'1px solid #FECACA', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#991B1B', marginBottom:16 }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            width:'100%', padding:'13px', border:'none', borderRadius:10,
            background: loading ? 'var(--bg-muted)' : 'var(--brand)',
            color: loading ? 'var(--text-muted)' : 'white',
            fontSize:15, fontWeight:700, transition:'all .2s'
          }}>
            {loading ? 'Please wait…' : mode==='login' ? 'Sign in' : 'Create account'}
          </button>

          {mode==='signup' && (
            <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', marginTop:14, lineHeight:1.5 }}>
              Your data syncs across all your devices after you sign in.
            </div>
          )}
        </div>
        <div style={{ textAlign:'center', marginTop:16, fontSize:12, color:'var(--text-muted)' }}>
          Data stored securely · Works offline too
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab]         = useState('today')
  const [habits, setHabits]   = useState([])
  const [comps, setComps]     = useState({})
  const [user, setUser]       = useState(null)
  const [ready, setReady]     = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [syncError, setSyncError]     = useState('')

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    init()
    return () => subscription.unsubscribe()
  }, [])

  async function init() {
    const u = await getUser()
    setUser(u)
    setAuthChecked(true)
    if (u) await syncFromCloud(u)
    else await loadLocal()
    setReady(true)
  }

  async function loadLocal() {
    let h = await getHabits()
    const c = await getCompletions()
    if (!h.length) h = await seedDefaults(null)
    setHabits(h); setComps(c)
  }

  async function syncFromCloud(u) {
    const active = u || user
    if (!active) { await loadLocal(); return }
    setSyncing(true); setSyncError('')
    try {
      const { habits: ch, comps: cc } = await pullUserData(active.id)
      if (ch.length) {
        // Cloud has data — use it as source of truth
        setHabits(ch); setComps(cc)
      } else {
        // No cloud data — push local up
        const local = await getHabits()
        const lc    = await getCompletions()
        if (local.length) {
          // Push habits first — must succeed before completions
          for (const h of local) {
            await pushHabit(h, active.id)  // throws on error now
          }
          // Habits confirmed in cloud — safe to push completions
          for (const [date, ids] of Object.entries(lc))
            for (const id of ids)
              if (local.find(h => h.id === id))
                await pushCompletion(id, date, active.id)
          setHabits(local); setComps(lc)
        } else {
          // Fresh account — seed and push
          const seeded = await seedDefaults(active.id)
          setHabits(seeded); setComps({})
        }
      }
    } catch (e) {
      console.error('Cloud sync failed:', e.message)
      setSyncError(e.message)
      await loadLocal()
    }
    setSyncing(false)
  }

  async function seedDefaults(userId) {
    const seeds = [
      { id: uid(), name: 'Drink water', ei: 0, ci: 0, ti: 0 },
      { id: uid(), name: 'Exercise',    ei: 1, ci: 4, ti: 0 },
      { id: uid(), name: 'Read',        ei: 2, ci: 1, ti: 2 },
      { id: uid(), name: 'Meditate',    ei: 4, ci: 5, ti: 0 },
    ]
    await Promise.all(seeds.map(h => addHabit(h)))
    if (userId) {
      for (const h of seeds) await pushHabit(h, userId)  // sequential, throws on error
    }
    return seeds
  }

  async function handleAuthSuccess() {
    const u = await getUser()
    setUser(u)
    if (u) await syncFromCloud(u)
  }

  async function handleSignOut() {
    await signOut()
    setUser(null)
    setSyncError('')
    await loadLocal()
  }

  async function handleAdd(habit) {
    const h = { id: uid(), ...habit }
    await addHabit(h)
    if (user) {
      try {
        await pushHabit(h, user.id)  // awaited + throws on error
      } catch (e) {
        console.warn('handleAdd cloud push failed:', e.message)
        // Habit exists locally — user can still use it offline
      }
    }
    setHabits(prev => [...prev, h])
  }

  async function handleDelete(id) {
    await deleteHabit(id)
    if (user) removeHabit(id).catch(() => {})
    setHabits(prev => prev.filter(h => h.id !== id))
    setComps(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(d => { next[d] = next[d].filter(x => x !== id) })
      return next
    })
  }

  async function handleToggle(habitId, date) {
    const currentlyDone = (comps[date] || []).includes(habitId)
    await toggleCompletion(habitId, date)
    if (user) {
      if (currentlyDone) removeCompletion(habitId, date).catch(() => {})
      else               pushCompletion(habitId, date, user.id).catch(() => {})
    }
    setComps(prev => {
      const day = [...(prev[date] || [])]
      const idx = day.indexOf(habitId)
      if (idx >= 0) day.splice(idx, 1); else day.push(habitId)
      return { ...prev, [date]: day }
    })
  }

  if (!authChecked || (!ready && !user)) {
    return <div style={{ minHeight:'100dvh', background:'var(--bg)' }}/>
  }

  if (!user) return <AuthScreen onAuth={handleAuthSuccess} />

  if (!ready) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:40 }}>✅</div>
      <div style={{ color:'var(--text-muted)', fontSize:14 }}>Syncing your habits…</div>
    </div>
  )

  const tabs   = [{ id:'today', label:'Today' }, { id:'stats', label:'Stats' }, { id:'weekly', label:'Weekly' }, { id:'coach', label:'✨ Coach' }]
  const shared = { habits, comps, onToggle: handleToggle, onAdd: handleAdd, onDelete: handleDelete }

  return (
    <div style={{ maxWidth:600, margin:'0 auto', minHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--bg)' }}>

      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:'var(--border)', background:'var(--bg-card)' }}>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--brand)' }}>✅ Habits</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {syncing && <span style={{ fontSize:11, color:'var(--text-muted)' }}>Syncing…</span>}
          <span style={{ fontSize:12, color:'var(--text-muted)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user.email}
          </span>
          <button onClick={handleSignOut} style={{
            fontSize:11, color:'var(--text-muted)', background:'none',
            border:'var(--border)', borderRadius:6, padding:'4px 10px'
          }}>Sign out</button>
        </div>
      </header>

      {/* Visible sync error banner — no more silent failures */}
      {syncError && (
        <div style={{ background:'#FEE2E2', borderBottom:'1px solid #FECACA', padding:'8px 16px', fontSize:12, color:'#991B1B' }}>
          ⚠️ Sync error: {syncError} — working offline
        </div>
      )}

      <nav style={{ display:'flex', borderBottom:'var(--border)', background:'var(--bg-card)', position:'sticky', top:0, zIndex:10 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, padding:'13px 4px', border:'none', background:'transparent',
            fontSize:13, color: tab===t.id ? 'var(--brand)' : 'var(--text-muted)',
            fontWeight: tab===t.id ? 700 : 400,
            borderBottom: tab===t.id ? '2px solid var(--brand)' : '2px solid transparent',
            marginBottom:-1, transition:'all .15s'
          }}>{t.label}</button>
        ))}
      </nav>

      <main style={{ flex:1, padding:'1rem', overflowY:'auto' }}>
        {tab==='today'  && <Today  {...shared} />}
        {tab==='stats'  && <Stats  {...shared} />}
        {tab==='weekly' && <Weekly {...shared} />}
        {tab==='coach'  && <Coach  {...shared} />}
      </main>
    </div>
  )
}
