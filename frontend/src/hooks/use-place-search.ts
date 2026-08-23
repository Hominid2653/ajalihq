import { useEffect, useState } from "react"

import {
  filterLocationSuggestions,
  type LocationSuggestion,
} from "@/lib/locations"
import { searchKenyanPlaces, sanitizePlaceQuery } from "@/services/geocode-api"

const DEBOUNCE_MS = 400

export function usePlaceSearch(query: string) {
  const [results, setResults] = useState<LocationSuggestion[]>(() =>
    filterLocationSuggestions("")
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromLiveApi, setFromLiveApi] = useState(false)

  useEffect(() => {
    const cleaned = sanitizePlaceQuery(query)
    const local = filterLocationSuggestions(query)

    if (cleaned.length < 2) {
      setResults(local)
      setLoading(false)
      setError(null)
      setFromLiveApi(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError(null)
      searchKenyanPlaces(cleaned, controller.signal)
        .then((places) => {
          if (places.length > 0) {
            setResults(places)
            setFromLiveApi(true)
            return
          }
          setResults(local)
          setFromLiveApi(false)
        })
        .catch((cause) => {
          if (controller.signal.aborted) return
          setResults(local)
          setFromLiveApi(false)
          setError(
            cause instanceof Error
              ? "Live place search is unavailable. Showing saved Kenyan places."
              : "Live place search is unavailable."
          )
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  return { results, loading, error, fromLiveApi }
}
