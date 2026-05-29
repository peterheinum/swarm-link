import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'

const db = new Database('swarm.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    from_agent TEXT NOT NULL,
    to_agent TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'task',
    payload TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export const createTask = (from_agent, to_agent, type, payload) => {
  const id = randomUUID()
  db.prepare(`
    INSERT INTO tasks (id, from_agent, to_agent, type, payload)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, from_agent, to_agent, type, JSON.stringify(payload))
  return getTask(id)
}

export const claimNextTask = (agent) => {
  const task = db.prepare(`
    SELECT * FROM tasks
    WHERE to_agent = ? AND status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
  `).get(agent)

  if (!task) return null

  db.prepare(`
    UPDATE tasks SET status = 'claimed', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(task.id)

  return { ...task, status: 'claimed', payload: JSON.parse(task.payload) }
}

export const updateTask = (id, status, payload) => {
  db.prepare(`
    UPDATE tasks SET status = ?, payload = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, JSON.stringify(payload), id)
  return getTask(id)
}

export const getTask = (id) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  if (!task) return null
  return { ...task, payload: JSON.parse(task.payload) }
}

export const listTasks = (filters = {}) => {
  let query = 'SELECT * FROM tasks WHERE 1=1'
  const params = []

  if (filters.agent) { query += ' AND (from_agent = ? OR to_agent = ?)'; params.push(filters.agent, filters.agent) }
  if (filters.status) { query += ' AND status = ?'; params.push(filters.status) }

  query += ' ORDER BY created_at DESC LIMIT 100'

  return db.prepare(query).all(...params).map(t => ({ ...t, payload: JSON.parse(t.payload) }))
}
