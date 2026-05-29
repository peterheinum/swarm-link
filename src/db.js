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
  );

  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// prune logs older than 7 days on startup
db.prepare(`DELETE FROM logs WHERE created_at < datetime('now', '-7 days')`).run()

// --- tasks ---

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

// --- agents ---

export const ping = (id) => {
  db.prepare(`
    INSERT INTO agents (id, last_seen) VALUES (?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET last_seen = CURRENT_TIMESTAMP
  `).run(id)
  return { id, last_seen: new Date().toISOString() }
}

export const listAgents = () => db.prepare('SELECT * FROM agents').all()

// --- logs ---

export const writeLog = (agent, level, message) => {
  db.prepare(`INSERT INTO logs (agent, level, message) VALUES (?, ?, ?)`).run(agent, level, message)
}

export const listLogs = (filters = {}) => {
  let query = 'SELECT * FROM logs WHERE 1=1'
  const params = []

  if (filters.agent) { query += ' AND agent = ?'; params.push(filters.agent) }
  if (filters.level) { query += ' AND level = ?'; params.push(filters.level) }

  query += ' ORDER BY created_at DESC LIMIT 200'

  return db.prepare(query).all(...params)
}
