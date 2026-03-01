function readEnv(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export const useMockApi = readEnv(import.meta.env.VITE_USE_MOCK) !== 'false'

export const demoPassword = readEnv(import.meta.env.VITE_DEMO_PASSWORD)

export const isDemoGateEnabled = demoPassword.length > 0
