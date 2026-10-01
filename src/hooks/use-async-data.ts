/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useEffectEvent, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  error: string | null
  isLoading: boolean
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[],
  { keepPreviousData = false }: { keepPreviousData?: boolean } = {},
): AsyncState<T> {
  const runLoader = useEffectEvent(loader)
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: true,
  })

  // Clear the previous record in the same render as a route/filter change.
  // Waiting for an effect leaves the previous case's actions visible during navigation.
  const [previousDeps, setPreviousDeps] = useState(deps)
  if (
    deps.length !== previousDeps.length ||
    deps.some((value, index) => !Object.is(value, previousDeps[index]))
  ) {
    setPreviousDeps(deps)
    setState({ data: keepPreviousData ? state.data : null, error: null, isLoading: true })
  }

  useEffect(() => {
    let cancelled = false

    runLoader()
      .then((data) => {
        if (!cancelled) {
          setState({
            data,
            error: null,
            isLoading: false,
          })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : 'Request failed',
            isLoading: false,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, deps)

  return state
}
