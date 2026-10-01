import express from 'express'
import { randomUUID } from 'node:crypto'
import { createAuth } from './auth.js'
import { ApiError, identifier, validateQuery } from './validation.js'
import { createSecurityOS } from './security-os.js'

export function createApp({
  database,
  users = [],
  origins = [],
  secureCookies = false,
  sessionMs,
  now = Date.now,
  logger = console,
} = {}) {
  if (!database) throw new Error('A database is required.')
  const app = express()
  const auth = createAuth({ users, secureCookies, sessionMs, now })
  const security = createSecurityOS({ database, now })
  const allowedOrigins = new Set(origins)
  const requests = new Map()
  app.disable('x-powered-by')
  app.set('query parser', 'simple')
  app.set('trust proxy', false)
  app.use('/api', (request, response, next) => {
    request.requestId = randomUUID()
    response.set({
      'X-Request-ID': request.requestId,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'X-Frame-Options': 'DENY',
    })
    const host = request.headers.host
    if (!host || !allowedOrigins.has(`${secureCookies ? 'https' : 'http'}://${host}`))
      throw new ApiError(403, 'This API host is not allowed.', 'HOST_REJECTED')
    const origin = request.headers.origin
    if (
      (origin && !allowedOrigins.has(origin)) ||
      request.headers['sec-fetch-site'] === 'cross-site'
    )
      throw new ApiError(403, 'This request origin is not allowed.', 'ORIGIN_REJECTED')
    if (request.method !== 'GET' && request.method !== 'HEAD' && !origin)
      throw new ApiError(403, 'An allowed Origin header is required.', 'ORIGIN_REJECTED')
    const time = now()
    for (const [key, value] of requests) if (value.resetAt <= time) requests.delete(key)
    if (requests.size >= 10000 && !requests.has(request.ip))
      throw new ApiError(429, 'API request capacity reached.', 'RATE_LIMITED')
    const limit = requests.get(request.ip) ?? {
      count: 0,
      resetAt: time + 60000,
    }
    if (limit.count >= 300) {
      response.set('Retry-After', String(Math.ceil((limit.resetAt - time) / 1000)))
      throw new ApiError(429, 'Too many requests. Please try again shortly.', 'RATE_LIMITED')
    }
    limit.count += 1
    requests.set(request.ip, limit)
    next()
  })
  app.get('/api/health', (_request, response) =>
    response.json({ ok: true, product: 'NOVA', dataSource: 'local-sample' }),
  )
  const json = express.json({ limit: '32kb', strict: true, inflate: false })
  const requireJson = (request, _response, next) => {
    if (!request.is('application/json'))
      throw new ApiError(415, 'Send application/json.', 'UNSUPPORTED_MEDIA_TYPE')
    next()
  }
  app.post('/api/auth/login', requireJson, json, auth.login)
  app.use('/api', auth.requireSession)
  app.get('/api/auth/session', auth.session)
  app.post('/api/auth/logout', auth.requireCsrf, auth.logout)
  app.get('/api/alerts', (request, response) =>
    response.json(database.listAlerts(validateQuery(request.query, 'alerts'))),
  )
  app.post(
    '/api/alerts/:id/ack',
    auth.allow(['guard', 'supervisor', 'admin']),
    auth.requireCsrf,
    (request, response) => {
      const alert = database.ackAlert(identifier(request.params.id), request.session.user.email)
      if (!alert) throw new ApiError(404, 'Alert not found.', 'NOT_FOUND')
      response.json(alert)
    },
  )
  const investigators = auth.allow(['analyst', 'supervisor', 'admin'])
  app.get('/api/cases/:id', investigators, (request, response) => {
    const record = database.getCaseById(identifier(request.params.id))
    if (!record) throw new ApiError(404, 'Case not found.', 'NOT_FOUND')
    response.json(record)
  })
  app.post(
    '/api/cases',
    investigators,
    auth.requireCsrf,
    requireJson,
    json,
    (request, response) => {
      response.status(201).json(database.createCase(request.body, request.session.user.email))
    },
  )
  app.get('/api/search', (request, response) => {
    const result = database.searchRecords(validateQuery(request.query, 'search'))
    if (request.session.user.role === 'guard') {
      result.cases = []
      result.audit = []
    }
    response.json(result)
  })
  app.get('/api/audit', investigators, (request, response) =>
    response.json(database.listAuditEvents(validateQuery(request.query, 'audit'))),
  )
  app.get('/api/security', (request, response) =>
    response.json(security.state(request.session.user)),
  )
  app.post('/api/security/assessments', auth.requireCsrf, requireJson, json, (request, response) =>
    response.status(201).json(security.assess(request.body, request.session.user)),
  )
  app.post('/api/security/missions', auth.requireCsrf, requireJson, json, (request, response) =>
    response.json(security.propose(request.body, request.session.user)),
  )
  app.post(
    '/api/security/missions/:id/decision',
    auth.allow(['supervisor', 'admin']),
    auth.requireCsrf,
    requireJson,
    json,
    (request, response) =>
      response.json(security.decide(request.params.id, request.body, request.session.user)),
  )
  app.post(
    '/api/security/missions/:id/steps/:stepId',
    auth.requireCsrf,
    requireJson,
    json,
    (request, response) =>
      response.json(
        security.complete(
          request.params.id,
          request.params.stepId,
          request.body,
          request.session.user,
        ),
      ),
  )
  app.use('/api', (_request, _response) => {
    throw new ApiError(404, 'API route not found.', 'NOT_FOUND')
  })
  app.use((error, request, response, _next) => {
    let status = error instanceof ApiError ? error.status : 500
    let message =
      error instanceof ApiError ? error.message : 'The server could not complete this request.'
    let code = error instanceof ApiError ? error.code : 'INTERNAL_ERROR'
    if (error.type === 'entity.parse.failed') {
      status = 400
      message = 'Invalid JSON request body.'
      code = 'INVALID_JSON'
    }
    if (error.type === 'entity.too.large') {
      status = 413
      message = 'Request body exceeds 32 KB.'
      code = 'BODY_TOO_LARGE'
    }
    if (error.type === 'encoding.unsupported' || error.type === 'charset.unsupported') {
      status = 415
      message = 'Unsupported request encoding.'
      code = 'UNSUPPORTED_MEDIA_TYPE'
    }
    if (status >= 500)
      logger.error({
        requestId: request.requestId,
        code,
        message: 'API request failed',
      })
    response.status(status).json({ message, code, requestId: request.requestId })
  })
  return app
}
