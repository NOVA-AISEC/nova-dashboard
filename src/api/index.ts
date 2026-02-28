import * as httpClient from '@/api/client'
import * as mockClient from '@/api/mock-client'

export const api = import.meta.env.VITE_USE_MOCK === 'true' ? mockClient : httpClient
