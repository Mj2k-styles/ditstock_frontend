import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../utils/format'

// Charge des données et les recharge quand `deps` change ou quand reload() est appelé.
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: '' }))
    fn()
      .then((data) => !cancelled && setState({ data, loading: false, error: '' }))
      .catch(
        (err) =>
          !cancelled &&
          setState({ data: null, loading: false, error: errorMessage(err) }),
      )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}
