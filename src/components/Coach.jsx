import { useState, useRef, useEffect } from 'react'
import { EMOJIS, ds } from '../App'

export default function Coach({ habits, comps }) {
  const [chat, setChat]       = useState([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef(null)

  function streak(id) {
    let s = 0
    for (let i = 0; i >= -365; i--) {
      const ok = (comps[ds(i)] || []).includes(id)
      if (ok) s++; else if (i === 0) continue; else break
    }
    return s
  }
  function rate(id, days) {
    let n = 0
    for (let i = 1 - days; i <= 0; i++) if ((comps[ds(i)] || []).includes(id)) n++
    return Math.round(n / days * 100)
  }
  const monthPct = (() => {
    const d = new Date().getDate(); let t = 0, p = 0
    for (let i = 1 - d; i <= 0; i++) {
      t += (comps[ds(i)] || []).filter(id => habits.find(h => h.id === id)).length
      p += habits.length
    }
    return p > 0 ? Math.round(t / p * 100) : 0
  })()

  function ctx() {
    const today = ds(0)
    const done = (comps[today] || []).filter(id => habits.find(h => h.id === id)).length
    return `User's tracked habits:\n${habits.map(h =>
      `- ${EMOJIS[h.ei]} ${h.name}: 7-day ${rate(h.id,7)}%, 30-day ${rate(h.id,30)}%, streak ${streak(h.id)} days`
    ).join('\n')}\n\nToday: ${done}/${habits.length} completed. Monthly average: ${monthPct}%.`
  }

  useEffect(() => {
    if (!habits.length) return
    setChat([{
      role: 'assistant',
      content: `Hi! I'm your habit coach 👋\n\nI can see you're tracking ${habits.length} habit${habits.length!==1?'s':''}${habits.length ? ` — including ${habits.slice(0,2).map(h=>EMOJIS[h.ei]+' '+h.name).join(' and ')}` : ''}.\n\nAsk me anything about your progress, consistency tips, or how to build better routines!`
    }])
  }, [habits.length])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [chat, loading])

  async function send(text) {
    if (!text.trim() || loading) return
    const userMsg = { role:'user', content: text.trim() }
    setChat(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const messages = [...chat, userMsg].map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a warm, motivating habit coach with access to the user's real data:\n\n${ctx()}\n\nRespond in 2-3 short paragraphs. Be specific to their actual numbers. Use plain text, no markdown.`,
          messages
        })
      })
      const data = await res.json()
      const reply = data.content?.find(b => b.type==='text')?.text || "I had trouble connecting — please try again!"
      setChat(prev => [...prev, { role:'assistant', content:reply }])
    } catch {
      setChat(prev => [...prev, { role:'assistant', content:'Connection issue. Please try again in a moment.' }])
    }
    setLoading(false)
  }

  const prompts = ['Review my progress 📊','How to stay consistent 💡','Suggest a new habit ➕','Why do I keep missing? 🤔']

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', height:'calc(100dvh - 130px)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexShrink:0 }}>
        <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--brand-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🤖</div>
        <div>
          <div style={{ fontSize:15, fontWeight:700 }}>AI Habit Coach</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>Powered by Claude · knows your habits</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, paddingBottom:8 }}>
        {chat.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role==='user'?'flex-end':'flex-start' }}>
            <div style={{
              padding:'10px 14px', maxWidth:'88%', fontSize:14, lineHeight:1.65, whiteSpace:'pre-wrap',
              borderRadius: m.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',
              background: m.role==='user'?'var(--brand)':'var(--bg-muted)',
              color: m.role==='user'?'white':'var(--text)'
            }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:6, padding:'6px 14px' }}>
            {[0,.2,.4].map(d => <div key={d} style={{ width:8, height:8, borderRadius:'50%', background:'var(--brand)', animation:`blink 1.2s ease-in-out ${d}s infinite` }}/>)}
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Quick prompts */}
      {chat.length <= 1 && !loading && (
        <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:10, flexShrink:0 }}>
          {prompts.map(p => (
            <button key={p} onClick={() => send(p)} style={{ padding:'6px 13px', borderRadius:20, border:'var(--border)', background:'var(--bg-muted)', fontSize:12, color:'var(--text)' }}>{p}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && send(input)}
          placeholder="Ask your coach anything…" disabled={loading} style={{ flex:1 }}/>
        <button onClick={() => send(input)} disabled={loading || !input.trim()} style={{
          padding:'10px 16px', border:'none', borderRadius:8, fontSize:14, fontWeight:700,
          background: (loading||!input.trim()) ? 'var(--bg-muted)' : 'var(--brand)',
          color: (loading||!input.trim()) ? 'var(--text-muted)' : 'white',
          whiteSpace:'nowrap', transition:'all .15s'
        }}>Send ↗</button>
      </div>
    </div>
  )
}
