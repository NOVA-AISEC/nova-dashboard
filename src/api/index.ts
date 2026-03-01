import * as httpClient from '@/api/client'
import * as mockClient from '@/api/mock-client'
import { useMockApi } from '@/lib/env'

export const api = useMockApi ? mockClient : httpClient
