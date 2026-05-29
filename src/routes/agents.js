import { Hono } from 'hono'
import { ping, listAgents } from '../db.js'

const agents = new Hono()

agents.post('/ping', async (c) => {
  const { id } = await c.req.json()
  if (!id) return c.json({ error: 'id required' }, 400)
  return c.json(ping(id))
})

agents.get('/', (c) => c.json(listAgents()))

export default agents
