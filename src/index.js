import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import tasks from './routes/tasks.js'

const app = new Hono()

app.use('*', logger())
app.route('/tasks', tasks)

app.get('/', (c) => c.json({ status: 'swarm-link running' }))

serve({ fetch: app.fetch, port: 3117 }, () => {
  console.log('swarm-link running on http://localhost:3117')
})
