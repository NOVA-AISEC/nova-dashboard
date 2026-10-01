import fs from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { hashPassword, validateUsers } from '../server/auth.js'
import { atomicWrite } from '../server/db.js'

// Passwords are read from stdin, never command arguments or shell history.
const [file, email, role, name] = process.argv.slice(2)
if (!file || !email || !role || !name) {
  console.error('Usage: npm run auth:add-user -- .secrets/users.json email role "Display Name"')
  process.exit(1)
}
let password
if (stdin.isTTY) {
  stdout.write('Password (12+ characters; input hidden): ')
  stdin.setRawMode(true)
  stdin.resume()
  password = await new Promise((resolve, reject) => {
    let value = ''
    const onData = (chunk) => {
      for (const character of chunk.toString()) {
        if (character === '\u0003') {
          cleanup()
          reject(new Error('Cancelled'))
          return
        }
        if (character === '\r' || character === '\n') {
          cleanup()
          resolve(value)
          return
        }
        if (character === '\u007f' || character === '\b') value = value.slice(0, -1)
        else if (character >= ' ') value += character
      }
    }
    const cleanup = () => {
      stdin.removeListener('data', onData)
      stdin.setRawMode(false)
      stdin.pause()
      stdout.write('\n')
    }
    stdin.on('data', onData)
  })
} else {
  const reader = createInterface({ input: stdin })
  for await (const line of reader) {
    password = line
    break
  }
  reader.close()
}
const users = fs.existsSync(file) ? validateUsers(JSON.parse(fs.readFileSync(file, 'utf8'))) : []
if (users.some((user) => user.email === email.trim().toLowerCase()))
  throw new Error('Account already exists. Edit the protected account file to rotate credentials.')
users.push({
  email: email.trim().toLowerCase(),
  role,
  name,
  passwordHash: await hashPassword(password),
})
validateUsers(users)
fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true })
atomicWrite(path.resolve(file), users)
console.log('Operator account saved. Keep this account file outside version control.')
