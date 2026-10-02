import { useEffect, useState } from 'react'
import { api } from '@/api'
import { useAsyncData } from '@/hooks/use-async-data'
import { OPERATIONS_CHANGED } from '@/lib/operations'

export function useIntelligence() {
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1)
    window.addEventListener(OPERATIONS_CHANGED, refresh)
    const sync = (event: StorageEvent) => {
      if (event.key === 'nova.security-os.v1' || event.key === null) refresh()
    }
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(OPERATIONS_CHANGED, refresh)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return {
    ...useAsyncData(() => api.getIntelligence(), [revision]),
    refresh: () => setRevision((value) => value + 1),
  }
}
