import { useEffect, useState } from "react"

import {
  fetchSiteConditions,
  type SiteConditions,
} from "@/services/weather-api"

export function useSiteConditions(lat: number | null, lng: number | null) {
  const [conditions, setConditions] = useState<SiteConditions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lat === null || lng === null) {
      setConditions(null)
      setError(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetchSiteConditions(lat, lng, controller.signal)
      .then((next) => {
        if (!controller.signal.aborted) setConditions(next)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setConditions(null)
          setError("Live weather is unavailable for this pin.")
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [lat, lng])

  return { conditions, loading, error }
}
