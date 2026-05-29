import { Hono } from 'hono'
import { createTask, claimNextTask, updateTask, listTasks, getTask } from '../db.js'

const tasks = new Hono()

tasks.post('/', async (c) => {
  const { from_agent, to_agent, type = 'task', payload = {} } = await c.req.json()
  if (!from_agent || !to_agent) return c.json({ error: 'from_agent and to_agent are required' }, 400)
  return c.json(createTask(from_agent, to_agent, type, payload), 201)
})

tasks.get('/next', (c) => {
  const agent = c.req.query('agent')
  if (!agent) return c.json({ error: 'agent query param required' }, 400)
  const task = claimNextTask(agent)
  if (!task) return c.json(null, 204)
  return c.json(task)
})

tasks.get('/', (c) => {
  const { agent, status } = c.req.query()
  return c.json(listTasks({ agent, status }))
})

tasks.get('/:id', (c) => {
  const task = getTask(c.req.param('id'))
  if (!task) return c.json({ error: 'not found' }, 404)
  return c.json(task)
})

tasks.patch('/:id', async (c) => {
  const { status, payload } = await c.req.json()
  const existing = getTask(c.req.param('id'))
  if (!existing) return c.json({ error: 'not found' }, 404)
  return c.json(updateTask(c.req.param('id'), status ?? existing.status, payload ?? existing.payload))
})

export default tasks
