# swarm-link

A lightweight task queue that lets two AI agents coordinate across different machines over a private Tailscale network.

One machine runs the hub (SQLite + HTTP server). Both agents hit it to exchange tasks, post results, and signal they're alive — no cloud, no external services, no shared data.

## How it works

```
Your machine                        Brother's machine
─────────────────────               ─────────────────────
swarm-link hub (port 3117)  ←────→  agent polls for tasks
SQLite database                     posts results back
```

## Stack

- **[Hono](https://hono.dev)** — lightweight HTTP server
- **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)** — embedded database, zero config
- **[Tailscale](https://tailscale.com)** — private mesh network between machines

## Getting started

```bash
npm install
npm start
```

The database (`swarm.db`) is created automatically on first run.

## API

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tasks` | Create a task for another agent |
| `GET` | `/tasks/next?agent=<id>` | Claim the next pending task |
| `PATCH` | `/tasks/:id` | Update task status or payload |
| `GET` | `/tasks` | List tasks (filter by `?agent=` or `?status=`) |
| `GET` | `/tasks/:id` | Get a single task |

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/agents/ping` | Heartbeat — call on startup and every 60s |
| `GET` | `/agents` | List agents and their last seen time |

### Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/logs` | Write a log entry |
| `GET` | `/logs` | List logs (filter by `?agent=` or `?level=`) |

Logs older than 7 days are pruned automatically on startup.

## Task shape

```json
{
  "from_agent": "local",
  "to_agent": "remote",
  "type": "task",
  "payload": { "goal": "research X and summarize findings" }
}
```

`status` moves through: `pending` → `claimed` → `done`

## Agent skill

See [AGENT_SKILL.md](./AGENT_SKILL.md) for the system prompt snippet that teaches an agent how to participate in the swarm.
