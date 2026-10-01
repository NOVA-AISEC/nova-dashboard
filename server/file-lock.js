import fs from 'node:fs'
import path from 'node:path'

export function acquireDatabaseLock(dbFile) {
  const lockFile = `${path.resolve(dbFile)}.lock`
  fs.mkdirSync(path.dirname(lockFile), { recursive: true })
  let descriptor
  try {
    descriptor = fs.openSync(lockFile, 'wx', 0o600)
  } catch (error) {
    if (error.code === 'EEXIST')
      throw new Error(
        'This database is already locked. Stop its owner before starting another API. After an unclean shutdown, verify no owner is running before removing the .lock file.',
      )
    throw error
  }
  try {
    fs.writeFileSync(descriptor, String(process.pid))
    fs.closeSync(descriptor)
  } catch (error) {
    fs.closeSync(descriptor)
    fs.unlinkSync(lockFile)
    throw error
  }
  let released = false
  return () => {
    if (released) return
    released = true
    try { fs.unlinkSync(lockFile) }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
}
