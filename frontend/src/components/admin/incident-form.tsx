import { useMemo, useState, type FormEvent, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Map, MapMarker, MarkerContent } from "@/components/ui/map"
import type {
  IncidentSeverity,
  IncidentType,
  IncidentUrgency,
  PreferredContactMethod,
} from "@/types/incident"
import { severityLabel, typeLabel, urgencyLabel } from "@/types/incident"

/** Curated Kenyan places for Sprint 1 search (Flask can swap for geocoder). */
const LOCATION_SUGGESTIONS: { label: string; lat: number; lng: number }[] = [
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

export type IncidentFormValues = {
  type: IncidentType
  title: string
  description: string
  urgency: IncidentUrgency
  severity: IncidentSeverity
  reporterName: string
  reporterEmail: string
  reporterPhone: string
  preferredContactMethod: PreferredContactMethod
  location: string
  lat: string
  lng: string
  initialNote: string
}

export const emptyIncidentForm: IncidentFormValues = {
  type: "accident",
  title: "",
  description: "",
  urgency: "MEDIUM",
  severity: "MODERATE",
  reporterName: "",
  reporterEmail: "",
  reporterPhone: "",
  preferredContactMethod: "PHONE",
  location: "",
  lat: "",
  lng: "",
  initialNote: "",
}

function IncidentForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  saving,
  includeNote = false,
  compact = false,
  mediaSlot,
}: {
  values: IncidentFormValues
  onChange: (values: IncidentFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  saving: boolean
  includeNote?: boolean
  compact?: boolean
  /** Rendered above submit actions so media is part of create flow */
  mediaSlot?: ReactNode
}) {
  const set = (key: keyof IncidentFormValues, value: string) =>
    onChange({ ...values, [key]: value })
  const [showMapPick, setShowMapPick] = useState(false)
  const [locationQuery, setLocationQuery] = useState("")

  const suggestions = useMemo(() => {
    const q = locationQuery.trim().toLowerCase()
    if (!q) return LOCATION_SUGGESTIONS.slice(0, 5)
    return LOCATION_SUGGESTIONS.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 8)
  }, [locationQuery])

  const mapCenter: [number, number] = [
    values.lng !== "" && !Number.isNaN(Number(values.lng)) ? Number(values.lng) : 36.8219,
    values.lat !== "" && !Number.isNaN(Number(values.lat)) ? Number(values.lat) : -1.2921,
  ]

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Incident type</Label>
          <Select value={values.type} onValueChange={(value) => set("type", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["accident", "fire", "medical", "crime", "disaster"] as IncidentType[]).map((value) => (
                <SelectItem key={value} value={value}>{typeLabel(value)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Urgency</Label>
          <Select value={values.urgency} onValueChange={(value) => set("urgency", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as IncidentUrgency[]).map((value) => (
                <SelectItem key={value} value={value}>{urgencyLabel(value)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Severity</Label>
          <Select value={values.severity} onValueChange={(value) => set("severity", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["MINOR", "MODERATE", "MAJOR", "CRITICAL"] as IncidentSeverity[]).map((value) => (
                <SelectItem key={value} value={value}>{severityLabel(value)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!compact ? (
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" required value={values.title} onChange={(event) => set("title", event.target.value)} />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          required
          minLength={10}
          rows={compact ? 3 : 5}
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
        />
      </div>

      <fieldset className="grid gap-5 rounded-xl border p-4 sm:grid-cols-2">
        <legend className="px-2 text-sm font-semibold">Reporter</legend>
        <div className="space-y-2">
          <Label htmlFor="reporterName">Name</Label>
          <Input id="reporterName" required value={values.reporterName} onChange={(event) => set("reporterName", event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reporterPhone">Phone</Label>
          <Input id="reporterPhone" type="tel" value={values.reporterPhone} onChange={(event) => set("reporterPhone", event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reporterEmail">Email</Label>
          <Input id="reporterEmail" type="email" value={values.reporterEmail} onChange={(event) => set("reporterEmail", event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Preferred contact</Label>
          <Select value={values.preferredContactMethod} onValueChange={(value) => set("preferredContactMethod", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PHONE">Phone</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </fieldset>

      <fieldset className="grid gap-5 rounded-xl border p-4 sm:grid-cols-2">
        <legend className="px-2 text-sm font-semibold">Location</legend>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="location">Location name</Label>
          <Input id="location" required value={values.location} onChange={(event) => set("location", event.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="locationSearch">Search location</Label>
          <Input
            id="locationSearch"
            placeholder="Search Nairobi, Nakuru, Mombasa…"
            value={locationQuery}
            onChange={(event) => setLocationQuery(event.target.value)}
          />
          <ul className="max-h-36 overflow-y-auto rounded-lg border bg-background">
            {suggestions.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    onChange({
                      ...values,
                      location: item.label,
                      lat: String(item.lat),
                      lng: String(item.lng),
                    })
                    setLocationQuery(item.label)
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lat">Latitude (optional)</Label>
          <Input id="lat" type="number" step="any" min="-90" max="90" value={values.lat} onChange={(event) => set("lat", event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lng">Longitude (optional)</Label>
          <Input id="lng" type="number" step="any" min="-180" max="180" value={values.lng} onChange={(event) => set("lng", event.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (!navigator.geolocation) return
              navigator.geolocation.getCurrentPosition((pos) => {
                onChange({
                  ...values,
                  lat: String(pos.coords.latitude),
                  lng: String(pos.coords.longitude),
                  location: values.location || "Current location",
                })
              })
            }}
          >
            Use current location
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowMapPick((v) => !v)}>
            {showMapPick ? "Hide map picker" : "Pick on map"}
          </Button>
        </div>
        {showMapPick ? (
          <div className="h-56 overflow-hidden rounded-lg border sm:col-span-2">
            <Map
              center={mapCenter}
              zoom={11}
              theme="light"
              className="size-full"
            >
              <MapMarker
                longitude={mapCenter[0]}
                latitude={mapCenter[1]}
                draggable
                onDragEnd={(lngLat) => {
                  onChange({
                    ...values,
                    lng: String(lngLat.lng),
                    lat: String(lngLat.lat),
                    location: values.location || `Pinned ${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`,
                  })
                }}
              >
                <MarkerContent>
                  <span className="block size-4 rounded-full border-2 border-white bg-[var(--ajali-primary)] shadow" />
                </MarkerContent>
              </MapMarker>
            </Map>
            <p className="border-t px-2 py-1 text-[11px] text-muted-foreground">
              Drag the marker or click “Use current location” / search to set coordinates.
            </p>
          </div>
        ) : null}
      </fieldset>

      {includeNote ? (
        <div className="space-y-2">
          <Label htmlFor="initialNote">Initial admin note (optional)</Label>
          <Textarea id="initialNote" value={values.initialNote} onChange={(event) => set("initialNote", event.target.value)} />
        </div>
      ) : null}

      {mediaSlot ? (
        <div className="space-y-2 rounded-xl border p-4">
          <p className="text-sm font-semibold">Photos / videos</p>
          {mediaSlot}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : compact ? "Create incident" : "Save incident"}
        </Button>
      </div>
    </form>
  )
}

export { IncidentForm }
