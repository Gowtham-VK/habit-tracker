import { EMOJIS, COLORS, ds } from '../App'

export default function Weekly({ habits, comps }) {
  const week     = Array.from({ length:7 }, (_, i) => {
    const d = ds(i-6)
    return { d, name: new Date(d+'T12:00').toLocaleDateString('en-US',{weekday:'short'}), num: new Date(d+'T12:00').getDate(), isT: d===ds(0) }
  })
  const weekDone = week.map(w => (comps[w.d]||[]).filter(id=>habits.find(h=>h.id===id)).length)
  const total    = week.length * habits.length
  const done     = weekDone.reduce((a,b)=>a+b,0)
  const pct      = total > 0 ? Math.round(done/total*100) : 0
  const bestIdx  = weekDone.indexOf(Math.max(...weekDone))
  const insight  = pct>=80?'🎉 Outstanding week! Your consistency is paying off.'
    :pct>=55?'💪 Solid progress — keep the momentum going!'
    :pct>=30?'📈 You\'re building. Small wins compound over time.'
    :'🌱 Every habit completed is a step forward. Start with just one today.'

  return (
    <div className="fade-in">
      <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Weekly review</div>
      <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>
        {new Date(week[0].d+'T12:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})} – {new Date(week[6].d+'T12:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
        <div style={{ background:'var(--bg-muted)', borderRadius:10, padding:'12px 14px' }}>
          <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Completion</div>
          <div style={{ fontSize:26, fontWeight:700 }}>{pct}%</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{done} of {total} logged</div>
        </div>
        <div style={{ background:'var(--bg-muted)', borderRadius:10, padding:'12px 14px' }}>
          <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Best day</div>
          <div style={{ fontSize:26, fontWeight:700 }}>{week[bestIdx]?.name ?? '—'}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{weekDone[bestIdx]||0} habit{weekDone[bestIdx]!==1?'s':''} done</div>
        </div>
      </div>

      <div style={{ background:'var(--brand-light)', borderLeft:'3px solid var(--brand)', borderRadius:'0 10px 10px 0', padding:'12px 16px', marginBottom:16 }}>
        <div style={{ fontSize:13, color:'var(--brand-dark)', fontWeight:500 }}>{insight}</div>
      </div>

      <div style={{ background:'var(--bg-card)', border:'var(--border)', borderRadius:12, padding:'1rem 1.25rem' }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:12 }}>Habit breakdown</div>

        {/* Day headers */}
        <div style={{ display:'flex', alignItems:'center', paddingBottom:8, borderBottom:'1px solid var(--bg-muted)', marginBottom:4 }}>
          <div style={{ width:85, flexShrink:0 }}/>
          <div style={{ display:'flex', gap:4, flex:1, justifyContent:'center' }}>
            {week.map(w => (
              <div key={w.d} style={{ width:30, textAlign:'center' }}>
                <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase' }}>{w.name}</div>
                <div style={{ fontSize:12, fontWeight: w.isT?700:400, color: w.isT?'var(--brand)':'var(--text)' }}>{w.num}</div>
              </div>
            ))}
          </div>
          <div style={{ width:36, flexShrink:0 }}/>
        </div>

        {habits.map(h => {
          const col   = COLORS[h.ci]
          const wrate = Math.round(week.filter(w=>(comps[w.d]||[]).includes(h.id)).length/7*100)
          return (
            <div key={h.id} style={{ display:'flex', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--bg-muted)' }}>
              <div style={{ width:85, flexShrink:0, display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:13 }}>{EMOJIS[h.ei]}</span>
                <span style={{ fontSize:11, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.name}</span>
              </div>
              <div style={{ display:'flex', gap:4, flex:1, justifyContent:'center' }}>
                {week.map(w => {
                  const ok = (comps[w.d]||[]).includes(h.id)
                  return (
                    <div key={w.d} style={{ width:30, height:30, borderRadius:'50%', border:`2px solid ${ok?col:'var(--border-col)'}`, background: ok?col:'transparent', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:11, fontWeight:700 }}>
                      {ok ? '✓' : ''}
                    </div>
                  )
                })}
              </div>
              <div style={{ width:36, textAlign:'right', fontSize:12, fontWeight:700, color:col, flexShrink:0 }}>{wrate}%</div>
            </div>
          )
        })}
        {!habits.length && <div style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:'1rem 0' }}>No habits yet</div>}
      </div>
    </div>
  )
}
