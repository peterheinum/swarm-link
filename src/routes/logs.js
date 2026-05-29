import { Hono } from 'hono'
import { writeLog, listLogs } from '../db.js'

const logs = new Hono()

logs.post('/', async (c) => {
  const { agent, level = 'info', message } = await c.req.json()
  if (!agent || !message) return c.json({ error: 'agent and message required' }, 400)
  writeLog(agent, level, message)
  return c.json({ ok: true }, 201)
})

logs.get('/', (c) => {
  const { agent, level } = c.req.query()
  return c.json(listLogs({ agent, level }))
})

export default logs
