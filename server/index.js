import fs from 'node:fs'
import path from 'node:path'
import { createApp } from './app.js'
import { loadUsers } from './auth.js'
import { createDatabase } from './db.js'
import { startSimulator } from './simulator.js'
import { boundedInteger } from './validation.js'
import { acquireDatabaseLock } from './file-lock.js'

if (fs.existsSync('.env')) process.loadEnvFile('.env')
const port = boundedInteger(process.env.DAMA_API_PORT, 8787, 1, 65535, 'DAMA_API_PORT')
const sessionMs =
  boundedInteger(process.env.DAMA_SESSION_HOURS, 8, 1, 24, 'DAMA_SESSION_HOURS') * 60 * 60 * 1000
const secureCookies = process.env.NODE_ENV === 'production'
const defaultOrigins = [
  `http://127.0.0.1:${port}`,
  `http://localhost:${port}`,
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5175',
  'http://localhost:5175',
]
const origins =
  process.env.DAMA_ALLOWED_ORIGINS?.split(',')
    .map((value) => value.trim())
    .filter(Boolean) ?? (secureCookies ? [] : defaultOrigins)
if (
  !origins.length ||
  origins.some((value) => {
    try {
      const url = new URL(value)
      return (
        url.origin !== value ||
        !['http:', 'https:'].includes(url.protocol) ||
        (secureCookies && url.protocol !== 'https:')
      )
    } catch {
      return true
    }
  })
)
  throw new Error(
    'Configure DAMA_ALLOWED_ORIGINS with exact web/API origins. Production requires HTTPS.',
  )
const users = loadUsers(process.env.DAMA_AUTH_USERS_FILE)
if (secureCookies && !users.length)
  throw new Error('Production startup requires configured API accounts.')
const releaseDatabase = acquireDatabaseLock(
  process.env.DAMA_DB_FILE ?? path.resolve('server/data/db.json'),
)
process.once('exit', releaseDatabase)
const database = createDatabase({
  ...(process.env.DAMA_DB_FILE ? { dbFile: process.env.DAMA_DB_FILE } : {}),
})
database.initDb()
const app = createApp({ database, users, origins, secureCookies, sessionMs })
const stopSimulator = startSimulator({ ingest: database.ingestSimulatedAlert })
const server = app.listen(port, '127.0.0.1', () => {
  console.log(
    `NOVA API listening on http://127.0.0.1:${port}; ${users.length ? 'account authentication enabled' : 'accounts unconfigured, data access locked'}`,
  )
})
server.requestTimeout = 15000
server.headersTimeout = 10000
server.keepAliveTimeout = 5000
server.maxHeadersCount = 50
server.on('error', (error) => {
  stopSimulator()
  console.error(error.message)
  process.exitCode = 1
})
let shuttingDown = false
function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  stopSimulator()
  server.close(() => process.exit(0))
  server.closeIdleConnections()
  setTimeout(() => process.exit(1), 10000).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
