import { useCallback, useEffect, useState } from 'react'

/** Small data-loading hook: re-runs when deps change, exposes reload for after mutations. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | undefined>()
  const [error, setError] = useState<Error | undefined>()
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(undefined)
    fn().then(d => { if (alive) setData(d) })
      .catch(e => { if (alive) setError(e) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick(t => t + 1), [])
  return { data, error, loading, reload, setData }
}
