/** Curated Kenyan places for Sprint 1 search (Flask can swap for a geocoder later). */
export type LocationSuggestion = {
  label: string
  lat: number
  lng: number
}

export const LOCATION_SUGGESTIONS: LocationSuggestion[] = [
  { label: "Mombasa Road, Nairobi", lat: -1.3102, lng: 36.8348 },
  { label: "Gikomba Market, Nairobi", lat: -1.2839, lng: 36.8405 },
  { label: "Westlands, Nairobi", lat: -1.2674, lng: 36.8108 },
  { label: "Kaptembwo, Nakuru", lat: -0.3031, lng: 36.08 },
  { label: "Nakuru town", lat: -0.3031, lng: 36.08 },
  { label: "Likoni Ferry, Mombasa", lat: -4.0838, lng: 39.6612 },
  { label: "Kisauni, Mombasa", lat: -4.0203, lng: 39.6953 },
  { label: "Kisumu CBD, Kisumu", lat: -0.1022, lng: 34.7617 },
  { label: "Milimani, Kisumu", lat: -0.1097, lng: 34.7538 },
  { label: "Uganda Road, Eldoret", lat: 0.5143, lng: 35.2698 },
  { label: "Naivasha Road, Nakuru", lat: -0.7172, lng: 36.431 },
]

/** Default map center - Nairobi CBD [lng, lat] */
export const DEFAULT_MAP_CENTER: [number, number] = [36.8219, -1.2921]

export function filterLocationSuggestions(
  query: string
): LocationSuggestion[] {
  const q = query.trim().toLowerCase()
  if (!q) return LOCATION_SUGGESTIONS.slice(0, 6)
  return LOCATION_SUGGESTIONS.filter((item) =>
    item.label.toLowerCase().includes(q)
  ).slice(0, 8)
}
