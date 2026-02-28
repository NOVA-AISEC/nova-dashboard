import express from 'express'
import {
  ackAlert,
  createCase,
  getCaseById,
  initDb,
  listAlerts,
  listAuditEvents,
  searchRecords,
} from './db.js'
import { startSimulator } from './simulator.js'

const app = express()
const port = Number(process.env.DAMA_API_PORT ?? 8787)

initDb()

app.use(express.json({ limit: '200kb' }))

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    product: 'DAMA LTD',
    company: 'DAMA LTD',
  })
})

app.get('/api/alerts', (request, response) => {
  response.json(listAlerts(request.query))
})

app.post('/api/alerts/:id/ack', (request, response) => {
  const alert = ackAlert(request.params.id)

  if (!alert) {
    response.status(404).json({ message: 'Alert not found' })
    return
  }

  response.json(alert)
})

app.get('/api/cases/:id', (request, response) => {
  const caseRecord = getCaseById(request.params.id)

  if (!caseRecord) {
    response.status(404).json({ message: 'Case not found' })
    return
  }

  response.json(caseRecord)
})

app.post('/api/cases', (request, response) => {
  const {
    title,
    priority,
    status,
    location,
    summary,
    protocol,
    leadAnalyst,
    alertIds,
    evidenceIds,
  } = request.body ?? {}

  if (!title || !priority || !status || !location || !summary || !protocol || !leadAnalyst) {
    response.status(400).json({ message: 'Missing required case fields' })
    return
  }

  response.status(201).json(
    createCase({
      title,
      priority,
      status,
      location,
      summary,
      protocol,
      leadAnalyst,
      alertIds,
      evidenceIds,
    }),
  )
})

app.get('/api/search', (request, response) => {
  response.json(searchRecords(request.query))
})

app.get('/api/audit', (request, response) => {
  response.json(listAuditEvents(request.query))
})

app.use((error, _request, response, _next) => {
  const message = error instanceof Error ? error.message : 'Unknown server error'
  response.status(500).json({ message })
})

const stopSimulator = startSimulator()
const server = app.listen(port, () => {
  console.log(`DAMA LTD API listening on http://localhost:${port}`)
})

function shutdown() {
  stopSimulator()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
