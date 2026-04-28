import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key)

// ── Auth ──────────────────────────────────────────────────────────

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── Habits ────────────────────────────────────────────────────────

export async function pushHabit(habit, userId) {
  // Strip camelCase 'createdAt' from IndexedDB — Supabase column is created_at
  // Sending unknown columns causes PostgREST to reject the entire upsert silently
  const { createdAt, ...clean } = habit
  const { error } = await supabase
    .from('habits')
    .upsert({ ...clean, user_id: userId })
  // Throw so callers know the push actually failed
  if (error) throw new Error('pushHabit: ' + error.message)
}

export async function removeHabit(id) {
  const { error } = await supabase.from('habits').delete().eq('id', id)
  if (error) console.warn('removeHabit:', error.message)
}

// ── Completions ───────────────────────────────────────────────────

export async function pushCompletion(habitId, date, userId) {
  const { error } = await supabase
    .from('completions')
    .upsert({ id: `${habitId}_${date}`, habit_id: habitId, date, user_id: userId })
  if (error) console.warn('pushCompletion:', error.message)
}

export async function removeCompletion(habitId, date) {
  const { error } = await supabase
    .from('completions').delete().eq('id', `${habitId}_${date}`)
  if (error) console.warn('removeCompletion:', error.message)
}

// ── Pull all user data ────────────────────────────────────────────

export async function pullUserData(userId) {
  const [{ data: habits }, { data: completions }] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('completions').select('*').eq('user_id', userId)
  ])
  const compsMap = (completions || []).reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = []
    acc[r.date].push(r.habit_id)
    return acc
  }, {})
  return { habits: habits || [], comps: compsMap }
}
