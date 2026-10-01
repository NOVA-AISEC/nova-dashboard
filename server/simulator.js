import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ingestSimulatedAlert } from './db.js'
import { boundedInteger } from './validation.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const eventsFile = path.join(__dirname, 'data', 'mock-events.ndjson')

function loadTemplates() {
  const raw = fs.readFileSync(eventsFile, 'utf8')

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

export function startSimulator({ ingest = ingestSimulatedAlert, logger = console } = {}) {
  if (process.env.SIMULATOR_ENABLED !== 'true') {
    return () => {}
  }

  const templates = loadTemplates()

  if (!templates.length) {
    return () => {}
  }

  let index = 0
  const intervalMs = boundedInteger(
    process.env.SIMULATOR_INTERVAL_MS,
    8000,
    1000,
    3600000,
    'SIMULATOR_INTERVAL_MS',
  )
  const timer = setInterval(() => {
    try {
      ingest(templates[index % templates.length])
      index += 1
    } catch {
      clearInterval(timer)
      logger.error('NOVA simulator paused because an event could not be saved.')
    }
  }, intervalMs)

  return () => clearInterval(timer)
}
