import { useState } from 'react'
import { EMOJIS, COLORS, TIMES, ds } from '../App'

export default function Today({ habits, comps, onToggle, onAdd, onDelete }) {
  const [modal, setModal] = useState(false)
  const [name, setName]   = useState('')
  const [ei, setEi]       = useState(0)
  const [ci, setCi]       = useState(0)
  const [ti, setTi]       = useState(3)

  const today    = ds(0)
  const todayIds = (comps[today] || []).filter(id => habits.find(h => h.id === id))
  const pct      = habits.length ? Math.round(todayIds.length / habits.length * 100) : 0
  const C        = 2 * Math.PI * 22

  function streak(id) {
    let s = 0
    for (let i = 0; i >= -365; i--) {
      const ok = (comps[ds(i)] || []).includes(id)
      if (ok) s++; else if (i === 0) continue; else break
    }
    return s
  }

  const monthPct = (() => {
    const d = new Date().getDate(); let t = 0, p = 0
    for (let i = 1 - d; i <= 0; i++) {
      t += (comps[ds(i)] || []).filter(id => habits.find(h => h.id === id)).length
      p += habits.length
    }
    return p > 0 ? Math.round(t / p * 100) : 0
  })()

  const best = habits.length ? Math.max(...habits.map(h => streak(h.id))) : 0

  function handleSave() {
    if (!name.trim()) return
    onAdd({ name: name.trim(), ei, ci, ti })
    setName(''); setEi(0); setCi(0); setTi(3); setModal(false)
  }

  const groups = TIMES.map((label, idx) => ({
    label, habits: habits.filter(h => h.ti === idx)
  })).filter(g => g.habits.length)

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:2 }}>
            {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
          </div>
          <div style={{ fontSize:22, fontWeight:700 }}>My habits</div>
        </div>
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" stroke="var(--bg-muted)" strokeWidth="5"/>
          <circle cx="28" cy="28" r="22" fill="none" stroke="var(--brand)" strokeWidth="5"
            strokeLinecap="round" transform="rotate(-90 28 28)"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
            style={{ transition:'stroke-dashoffset .5s ease' }}/>
          <text x="28" y="33" textAnchor="middle" style={{ fontSize:11, fontWeight:700, fill:'currentColor', fontFamily:'inherit' }}>{pct}%</text>
        </svg>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
        {[['Today', `${todayIds.length}/${habits.length}`], ['Best streak', `${best} 🔥`], ['This month', `${monthPct}%`]].map(([l, v]) => (
          <div key={l} style={{ background:'var(--bg-muted)', borderRadius:10, padding:'10px 12px' }}>
            <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 }}>{l}</div>
            <div style={{ fontSize:18, fontWeight:700 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Habit groups */}
      {groups.map(g => (
        <div key={g.label}>
          <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600, padding:'8px 0 4px' }}>{g.label}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:8 }}>
            {g.habits.map(h => {
              const col  = COLORS[h.ci]
              const done = (comps[today] || []).includes(h.id)
              const str  = streak(h.id)
              const d7   = Array.from({ length:7 }, (_, k) => (comps[ds(k-6)] || []).includes(h.id))
              return (
                <div key={h.id} style={{ background:'var(--bg-card)', border:'var(--border)', borderRadius:12, display:'flex', overflow:'hidden', opacity: done ? .55 : 1, transition:'opacity .2s' }}>
                  <div style={{ width:4, background:col, flexShrink:0 }}/>
                  <div style={{ flex:1, padding:'10px 10px 10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                    <button onClick={() => onToggle(h.id, today)} style={{
                      width:28, height:28, borderRadius:'50%', flexShrink:0,
                      border:`2px solid ${done ? col : 'var(--border-col)'}`,
                      background: done ? col : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:12, fontWeight:700
                    }}>{done ? '✓' : ''}</button>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:500, display:'flex', alignItems:'center', gap:5, textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--text-muted)' : 'var(--text)' }}>
                        <span style={{ fontSize:15 }}>{EMOJIS[h.ei]}</span>
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.name}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5 }}>
                        {d7.map((x, i) => <div key={i} style={{ width:7, height:7, borderRadius:'50%', background: x ? col : 'var(--border-col)' }}/>)}
                        {str > 1 && <span style={{ fontSize:11, color:'var(--text-muted)' }}>{str}d streak</span>}
                      </div>
                    </div>
                    <button onClick={() => onDelete(h.id)} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:14, padding:'4px 8px', opacity:.4 }}>✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {!habits.length && (
        <div style={{ textAlign:'center', padding:'3rem 1rem', color:'var(--text-muted)', fontSize:14 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🌱</div>
          No habits yet — add your first one below!
        </div>
      )}

      <button onClick={() => setModal(true)} style={{
        width:'100%', marginTop:8, padding:'14px', border:'1px dashed var(--border-col)',
        borderRadius:12, background:'transparent', color:'var(--text-muted)',
        fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8
      }}>
        <span style={{ fontSize:20, fontWeight:300, lineHeight:1 }}>+</span> Add new habit
      </button>

      {/* Modal */}
      {modal && (
        <div onClick={e => e.target === e.currentTarget && setModal(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, zIndex:50 }}>
          <div style={{ background:'var(--bg-card)', borderRadius:16, padding:'1.5rem 1.25rem', width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <span style={{ fontSize:17, fontWeight:700 }}>New habit</span>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', fontSize:18, color:'var(--text-muted)' }}>✕</button>
            </div>
            <label style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', fontWeight:600 }}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morning run"
              style={{ marginTop:6, marginBottom:16 }} onKeyDown={e => e.key==='Enter' && handleSave()} autoFocus/>

            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', fontWeight:600, marginBottom:8 }}>Icon</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
              {EMOJIS.map((e, i) => (
                <button key={i} onClick={() => setEi(i)} style={{ width:36, height:36, borderRadius:8, border:`2px solid ${i===ei?'var(--brand)':'var(--border-col)'}`, background:'var(--bg-muted)', fontSize:17 }}>{e}</button>
              ))}
            </div>

            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', fontWeight:600, marginBottom:8 }}>Color</div>
            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              {COLORS.map((c, i) => (
                <button key={i} onClick={() => setCi(i)} style={{ width:26, height:26, borderRadius:'50%', background:c, border:`3px solid ${i===ci?'var(--text)':'transparent'}` }}/>
              ))}
            </div>

            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', fontWeight:600, marginBottom:8 }}>Time of day</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
              {TIMES.map((t, i) => (
                <button key={i} onClick={() => setTi(i)} style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${i===ti?'var(--brand)':'var(--border-col)'}`, background: i===ti?'var(--brand-light)':'transparent', color: i===ti?'var(--brand-dark)':'var(--text-muted)', fontSize:13 }}>{t}</button>
              ))}
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setModal(false)} style={{ flex:1, padding:12, border:'var(--border)', borderRadius:8, background:'transparent', fontSize:14, color:'var(--text-muted)' }}>Cancel</button>
              <button onClick={handleSave} style={{ flex:2, padding:12, border:'none', borderRadius:8, background:'var(--brand)', fontSize:14, color:'white', fontWeight:700 }}>Add habit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
