import { useEffect, useState } from 'react'
import { api } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import { OPERATIONS_CHANGED } from '@/lib/operations'

export function useSecurityOS() {
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1)
    window.addEventListener(OPERATIONS_CHANGED, refresh)
    return () => window.removeEventListener(OPERATIONS_CHANGED, refresh)
  }, [])
  return useAsyncData(() => api.getSecurityState(), [revision], { keepPreviousData: true })
}
