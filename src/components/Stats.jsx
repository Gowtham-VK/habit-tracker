import { EMOJIS, COLORS, ds } from '../App'

export default function Stats({ habits, comps }) {
  function rate(id, days) {
    let n = 0
    for (let i = 1 - days; i <= 0; i++) if ((comps[ds(i)] || []).includes(id)) n++
    return Math.round(n / days * 100)
  }
  function streak(id) {
    let s = 0
    for (let i = 0; i >= -365; i--) {
      const ok = (comps[ds(i)] || []).includes(id)
      if (ok) s++; else if (i === 0) continue; else break
    }
    return s
  }
  function dayRatio(date) {
    if (!habits.length) return 0
    return (comps[date] || []).filter(id => habits.find(h => h.id === id)).length / habits.length
  }
  const monthPct = (() => {
    const d = new Date().getDate(); let t = 0, p = 0
    for (let i = 1 - d; i <= 0; i++) {
      t += (comps[ds(i)] || []).filter(id => habits.find(h => h.id === id)).length
      p += habits.length
    }
    return p > 0 ? Math.round(t / p * 100) : 0
  })()
  const best   = habits.length ? Math.max(...habits.map(h => streak(h.id))) : 0
  let total30  = 0
  for (let i = -29; i <= 0; i++) total30 += (comps[ds(i)] || []).filter(id => habits.find(h => h.id === id)).length

  const bars   = Array.from({ length:14 }, (_, k) => ({ r: dayRatio(ds(k-13)), lbl: new Date(ds(k-13)+'T12:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}), isT: ds(k-13)===ds(0) }))
  const mH=80, bW=20, bG=5, svgW=14*(bW+bG)-bG

  const heat   = Array.from({ length:35 }, (_, k) => {
    const r = dayRatio(ds(k-34)), isT = ds(k-34)===ds(0)
    const bg = r>=1?'#0F6E56':r>=.75?'#1D9E75':r>=.5?'#5DCAA5':r>=.25?'#9FE1CB':r>0?'#E1F5EE':'var(--bg-muted)'
    return { bg, isT }
  })

  return (
    <div className="fade-in">
      <div style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>Statistics</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
        {[['30-day avg', monthPct+'%'], ['Best streak', best+' 🔥'], ['Total done', total30]].map(([l,v]) => (
          <div key={l} style={{ background:'var(--bg-muted)', borderRadius:10, padding:'10px 12px' }}>
            <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 }}>{l}</div>
            <div style={{ fontSize:20, fontWeight:700 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--bg-card)', border:'var(--border)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:12 }}>14-day completion</div>
        <svg viewBox={`0 0 ${svgW} ${mH+20}`} style={{ width:'100%', overflow:'visible' }}>
          {bars.map((b, i) => {
            const h=Math.max(4, Math.round(b.r*mH)), x=i*(bW+bG)
            const fc=b.isT?'#1D9E75':b.r>.6?'#5DCAA5':b.r>0?'#9FE1CB':'var(--bg-muted)'
            return (
              <g key={i}>
                <rect x={x} y={mH-h} width={bW} height={h} rx="4" fill={fc}/>
                {(i===0||i===6||i===13) && <text x={x+bW/2} y={mH+14} textAnchor="middle" style={{ fontSize:9, fill:'var(--text-muted)', fontFamily:'inherit' }}>{b.lbl}</text>}
              </g>
            )
          })}
        </svg>
      </div>

      <div style={{ background:'var(--bg-card)', border:'var(--border)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>Activity — last 5 weeks</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
          {heat.map((c, i) => <div key={i} style={{ aspectRatio:1, borderRadius:3, background:c.bg, outline: c.isT?'2px solid var(--brand)':'none', outlineOffset:1 }}/>)}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:8, justifyContent:'flex-end' }}>
          <span style={{ fontSize:10, color:'var(--text-muted)' }}>Less</span>
          {['var(--bg-muted)','#E1F5EE','#9FE1CB','#5DCAA5','#1D9E75','#0F6E56'].map(c => <div key={c} style={{ width:11, height:11, borderRadius:2, background:c }}/>)}
          <span style={{ fontSize:10, color:'var(--text-muted)' }}>More</span>
        </div>
      </div>

      <div style={{ background:'var(--bg-card)', border:'var(--border)', borderRadius:12, padding:'1rem 1.25rem' }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>Habit breakdown (30 days)</div>
        {habits.map(h => {
          const r30=rate(h.id,30), r7=rate(h.id,7), s=streak(h.id), col=COLORS[h.ci]
          return (
            <div key={h.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--bg-muted)' }}>
              <span style={{ fontSize:20, width:24, flexShrink:0 }}>{EMOJIS[h.ei]}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.name}</div>
                <div style={{ height:5, borderRadius:999, background:'var(--bg-muted)', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${r30}%`, background:col, borderRadius:999, transition:'width .5s ease' }}/>
                </div>
                <div style={{ display:'flex', gap:12, marginTop:4 }}>
                  <span style={{ fontSize:10, color:'var(--text-muted)' }}>7d: {r7}%</span>
                  <span style={{ fontSize:10, color:'var(--text-muted)' }}>30d: {r30}%</span>
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:col }}>{r30}%</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{s}d 🔥</div>
              </div>
            </div>
          )
        })}
        {!habits.length && <div style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:'1rem 0' }}>No habits yet</div>}
      </div>
    </div>
  )
}
