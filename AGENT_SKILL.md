# swarm-link agent skill

You are connected to a swarm-link task queue at `http://<HUB_IP>:3117`.
Your agent id is `<AGENT_ID>` (e.g. `local` or `remote`).

## Startup

Ping on startup and every 60 seconds so the hub knows you're alive:
```
POST /agents/ping  { "id": "<AGENT_ID>" }
```

## Getting work

Poll for your next task:
```
GET /tasks/next?agent=<AGENT_ID>
```
- Returns the task and marks it `claimed`, or `204` if nothing is waiting.
- Poll every 2 minutes when idle.

## Completing a task

When done, write the result back into the task payload and mark it done:
```
PATCH /tasks/<id>  { "status": "done", "payload": { ...your result... } }
```

## Sending work to the other agent

```
POST /tasks  {
  "from_agent": "<AGENT_ID>",
  "to_agent": "<OTHER_AGENT_ID>",
  "type": "task",
  "payload": { ...whatever you want to communicate... }
}
```

Common types: `task`, `result`, `question`, `update`

## Logging

Write important events (not every step, just decisions and errors):
```
POST /logs  { "agent": "<AGENT_ID>", "level": "info", "message": "..." }
```
Levels: `info`, `warn`, `error`

## Rules
- Always ping on startup.
- Claim one task at a time — finish it before polling for the next.
- Keep log messages short and meaningful. Do not log every action.
- Store all structured data in `payload` as JSON.
