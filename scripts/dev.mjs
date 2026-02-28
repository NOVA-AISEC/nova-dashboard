import { spawn } from 'node:child_process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const shellCommand = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : null
const children = []

function run(script) {
  const child =
    process.platform === 'win32'
      ? spawn(shellCommand, ['/d', '/s', '/c', `${npmCommand} run ${script}`], {
          stdio: 'inherit',
          env: process.env,
        })
      : spawn(npmCommand, ['run', script], {
          stdio: 'inherit',
          env: process.env,
        })

  children.push(child)

  child.on('error', (error) => {
    console.error(`Failed to start ${script}:`, error)
    shutdown(1)
  })

  child.on('exit', (code) => {
    if (code && code !== 0) {
      shutdown(code)
    }
  })

  return child
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  }

  process.exit(code)
}

run('dev:server')
run('dev:web')

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
