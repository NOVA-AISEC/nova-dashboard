import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { readFileSync } from 'node:fs'
import { ApiError, roles, text } from './validation.js'

const scrypt = promisify(scryptCallback)
const cookieName = 'nova_session'
const hashToken = (token) => createHash('sha256').update(token).digest('hex')
const scryptOptions = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
const shifts = {
  guard: 'Shift ALPHA',
  analyst: 'Shift CHARLIE',
  supervisor: 'Shift BRAVO',
  admin: 'Campus Admin',
}

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 256)
    throw new Error('Use a password between 12 and 256 characters.')
  const salt = randomBytes(16).toString('hex')
  const derived = await scrypt(password, salt, 64, scryptOptions)
  return `scrypt:${salt}:${derived.toString('hex')}`
}

export function validateUsers(users) {
  if (!Array.isArray(users) || users.length > 1000)
    throw new Error('Account configuration must be an array with at most 1000 users.')
  const emails = new Set()
  return users.map((user) => {
    if (!user || typeof user !== 'object') throw new Error('Invalid account configuration.')
    const email = text(user.email, 'email', 254).toLowerCase()
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      emails.has(email) ||
      !roles.includes(user.role) ||
      !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(user.passwordHash)
    )
      throw new Error('Invalid or duplicate account configuration.')
    emails.add(email)
    return {
      email,
      name: text(user.name, 'name', 200),
      role: user.role,
      passwordHash: user.passwordHash,
    }
  })
}

export function loadUsers(file) {
  if (!file) return []
  try {
    return validateUsers(JSON.parse(readFileSync(file, 'utf8')))
  } catch (error) {
    if (error.code === 'ENOENT' && process.env.NODE_ENV !== 'production') return []
    throw error
  }
}

export function createAuth({
  users = [],
  now = Date.now,
  sessionMs = 8 * 60 * 60 * 1000,
  secureCookies = false,
  maxSessions = 1000,
} = {}) {
  const accounts = validateUsers(users)
  const sessions = new Map()
  const attempts = new Map()
  // Unknown accounts incur the same password derivation work.
  const dummyHash = `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`
  const clearExpired = () => {
    for (const [key, session] of sessions) if (session.expiresAt <= now()) sessions.delete(key)
    for (const [key, attempt] of attempts) if (attempt.resetAt <= now()) attempts.delete(key)
  }
  const cookie = (value, maxAge) =>
    `${cookieName}=${value}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secureCookies ? '; Secure' : ''}`
  const readToken = (request) => {
    const values = (request.headers.cookie ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.startsWith(`${cookieName}=`))
    if (values.length !== 1) return ''
    const token = values[0].slice(cookieName.length + 1)
    return /^[a-f0-9]{64}$/.test(token) ? token : ''
  }
  const view = (session) => ({
    ...session.user,
    shift: shifts[session.user.role],
    expiresAt: session.expiresAt,
    csrfToken: session.csrfToken,
  })

  return {
    async login(request, response) {
      clearExpired()
      if (!accounts.length)
        throw new ApiError(503, 'API accounts have not been configured.', 'AUTH_NOT_CONFIGURED')
      const payload = request.body
      if (
        !payload ||
        typeof payload !== 'object' ||
        Array.isArray(payload) ||
        Object.keys(payload).some((key) => !['email', 'password'].includes(key))
      )
        throw new ApiError(400, 'Email and password are required.')
      const email = text(payload.email, 'email', 254).toLowerCase()
      if (
        typeof payload.password !== 'string' ||
        !payload.password ||
        payload.password.length > 256
      )
        throw new ApiError(400, 'Invalid password length.')
      // Reserve attempts before awaiting expensive password verification, including concurrent requests.
      const keys = [`ip:${request.ip}`, `account:${email}`]
      for (const key of keys) {
        const attempt = attempts.get(key) ?? {
          count: 0,
          resetAt: now() + 15 * 60 * 1000,
        }
        const limit = key.startsWith('ip:') ? 30 : 5
        if (attempt.count >= limit) {
          response.setHeader('Retry-After', String(Math.ceil((attempt.resetAt - now()) / 1000)))
          throw new ApiError(
            429,
            'Too many sign-in attempts. Please try again later.',
            'RATE_LIMITED',
          )
        }
      }
      if (attempts.size >= 10000)
        throw new ApiError(429, 'Sign-in is busy. Please try again later.', 'RATE_LIMITED')
      for (const key of keys) {
        const attempt = attempts.get(key) ?? {
          count: 0,
          resetAt: now() + 15 * 60 * 1000,
        }
        attempt.count += 1
        attempts.set(key, attempt)
      }
      const user = accounts.find((account) => account.email === email)
      const [, salt, expected] = (user?.passwordHash ?? dummyHash).split(':')
      const derived = await scrypt(payload.password, salt, 64, scryptOptions)
      if (!user || !timingSafeEqual(derived, Buffer.from(expected, 'hex')))
        throw new ApiError(401, 'Email or password is incorrect.', 'INVALID_CREDENTIALS')
      // Successful sign-in clears account failures, but keeps the per-IP capacity bound.
      attempts.delete(`account:${email}`)
      clearExpired()
      if (sessions.size >= maxSessions)
        throw new ApiError(
          503,
          'Session capacity reached. Please try again later.',
          'SESSION_CAPACITY',
        )
      const previous = readToken(request)
      if (previous) sessions.delete(hashToken(previous))
      const token = randomBytes(32).toString('hex')
      const session = {
        user: { email: user.email, name: user.name, role: user.role },
        expiresAt: now() + sessionMs,
        csrfToken: randomBytes(32).toString('hex'),
      }
      sessions.set(hashToken(token), session)
      response.setHeader('Set-Cookie', cookie(token, Math.floor(sessionMs / 1000)))
      response.json(view(session))
    },
    requireSession(request, _response, next) {
      clearExpired()
      const token = readToken(request)
      const session = token && sessions.get(hashToken(token))
      if (!session)
        throw new ApiError(
          401,
          'Your session has expired. Please sign in again.',
          'UNAUTHENTICATED',
        )
      request.session = session
      request.sessionKey = hashToken(token)
      next()
    },
    requireCsrf(request, _response, next) {
      const token = request.headers['x-nova-csrf']
      if (
        typeof token !== 'string' ||
        !/^[a-f0-9]{64}$/.test(token) ||
        !timingSafeEqual(Buffer.from(token), Buffer.from(request.session.csrfToken))
      )
        throw new ApiError(
          403,
          'Session verification failed. Reload and try again.',
          'CSRF_REJECTED',
        )
      next()
    },
    allow(allowed) {
      return (request, _response, next) => {
        if (!allowed.includes(request.session.user.role))
          throw new ApiError(403, 'Your role does not allow this action.', 'FORBIDDEN')
        next()
      }
    },
    session(request, response) {
      response.json(view(request.session))
    },
    logout(request, response) {
      sessions.delete(request.sessionKey)
      response.setHeader('Set-Cookie', cookie('', 0))
      response.status(204).end()
    },
  }
}
