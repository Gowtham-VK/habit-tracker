import Dexie from 'dexie'

export const db = new Dexie('HabitTrackerDB')

db.version(1).stores({
  habits:      'id, name, ei, ci, ti, createdAt',
  completions: 'id, habitId, date'
})

export async function getHabits() {
  return db.habits.toArray()
}

export async function addHabit(habit) {
  return db.habits.put({ ...habit, createdAt: Date.now() })
}

export async function deleteHabit(id) {
  await db.habits.delete(id)
  await db.completions.where('habitId').equals(id).delete()
}

export async function getCompletions() {
  const rows = await db.completions.toArray()
  return rows.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = []
    acc[r.date].push(r.habitId)
    return acc
  }, {})
}

export async function toggleCompletion(habitId, date) {
  const existing = await db.completions.where({ habitId, date }).first()
  if (existing) {
    await db.completions.delete(existing.id)
    return false
  } else {
    await db.completions.add({ id: `${habitId}_${date}`, habitId, date })
    return true
  }
}
