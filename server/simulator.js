import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ingestSimulatedAlert } from './db.js'

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

export function startSimulator() {
  if (process.env.SIMULATOR_ENABLED === 'false') {
    return () => {}
  }

  const templates = loadTemplates()

  if (!templates.length) {
    return () => {}
  }

  let index = 0
  const intervalMs = Number(process.env.SIMULATOR_INTERVAL_MS ?? 8000)
  const timer = setInterval(() => {
    ingestSimulatedAlert(templates[index % templates.length])
    index += 1
  }, intervalMs)

  return () => clearInterval(timer)
}
