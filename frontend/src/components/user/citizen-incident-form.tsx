import { useEffect, useMemo, useState, type FormEvent } from "react"
import { LocateFixed, MapPinned } from "lucide-react"

import {
  IncidentMediaPanel,
  type PendingMedia,
} from "@/components/shared/incident-media-panel"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Map, MapMarker, MarkerContent } from "@/components/ui/map"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  INCIDENT_SEVERITIES,
  INCIDENT_TYPES,
  INCIDENT_URGENCIES,
  type IncidentSeverity,
  type IncidentType,
  type IncidentUrgency,
} from "@/lib/incidents"
import {
  DEFAULT_MAP_CENTER,
  filterLocationSuggestions,
} from "@/lib/locations"
import { mediaApi, toDurableMediaItems } from "@/services/media-api"
import type { IncidentMedia, PreferredContactMethod } from "@/types/incident"

export type CitizenEvidenceMedia = {
  kind: "image" | "video"
  url: string
  name: string
}

/** Same shape as admin CreateIncidentInput citizen-facing fields. */
export type CitizenIncidentFormValues = {
  title: string
  description: string
  type: IncidentType
  urgency: IncidentUrgency
  severity: IncidentSeverity
  location: string
  reporterPhone: string
  reporterEmail: string
  preferredContactMethod: PreferredContactMethod
  lat: number | null
  lng: number | null
  /** Durable evidence media attached on submit (create). */
  media: CitizenEvidenceMedia[]
}

type FormErrors = Partial<Record<keyof CitizenIncidentFormValues, string>>

const DESCRIPTION_MIN_LENGTH = 20

const EMPTY_VALUES: CitizenIncidentFormValues = {
  title: "",
  description: "",
  type: "accident",
  urgency: "MEDIUM",
  severity: "MODERATE",
  location: "",
  reporterPhone: "",
  reporterEmail: "",
  preferredContactMethod: "PHONE",
  lat: null,
  lng: null,
  media: [],
}

function validate(values: CitizenIncidentFormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.title.trim()) errors.title = "Title is required."
  if (!values.location.trim()) errors.location = "Location is required."
  if (!values.type) errors.type = "Select an incident type."
  if (!values.urgency) errors.urgency = "Select urgency."
  if (!values.severity) errors.severity = "Select a severity level."
  if (!values.description.trim()) {
    errors.description = "Description is required."
  } else if (values.description.trim().length < DESCRIPTION_MIN_LENGTH) {
    errors.description = `Description should be at least ${DESCRIPTION_MIN_LENGTH} characters.`
  }
  if (values.lat === null || values.lng === null) {
    errors.lat =
      "Pin the location on the map, search a place, or use your current location."
  }
  return errors
}

type CitizenIncidentFormProps = {
  mode: "create" | "edit"
  initialValues?: Partial<CitizenIncidentFormValues>
  onSubmit: (values: CitizenIncidentFormValues) => Promise<void>
  submitLabel?: string
  /** When editing an existing report, media uploads attach immediately. */
  incidentId?: string
  actor?: { id: string; name: string } | null
}

function CitizenIncidentForm({
  mode,
  initialValues,
  onSubmit,
  submitLabel,
  incidentId,
  actor = null,
}: CitizenIncidentFormProps) {
  const [values, setValues] = useState<CitizenIncidentFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [locationQuery, setLocationQuery] = useState("")
  const [showMap, setShowMap] = useState(
    () => mode === "create" || initialValues?.lat != null
  )
  const [geoBusy, setGeoBusy] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [draftMedia, setDraftMedia] = useState<PendingMedia[]>([])
  const [savedMedia, setSavedMedia] = useState<IncidentMedia[]>([])
  const [mediaLoading, setMediaLoading] = useState(Boolean(incidentId))

  useEffect(() => {
    if (!incidentId) {
      setSavedMedia([])
      setMediaLoading(false)
      return
    }
    let active = true
    setMediaLoading(true)
    mediaApi
      .list(incidentId)
      .then((items) => {
        if (active) setSavedMedia(items)
      })
      .catch(() => {
        if (active) setSavedMedia([])
      })
      .finally(() => {
        if (active) setMediaLoading(false)
      })
    return () => {
      active = false
    }
  }, [incidentId])

  const suggestions = useMemo(
    () => filterLocationSuggestions(locationQuery),
    [locationQuery]
  )

  const mapCenter: [number, number] = [
    values.lng ?? DEFAULT_MAP_CENTER[0],
    values.lat ?? DEFAULT_MAP_CENTER[1],
  ]

  function clearFieldError(key: keyof CitizenIncidentFormValues) {
    setErrors((prev) => {
      if (!prev[key] && key !== "lat" && key !== "lng") return prev
      const next = { ...prev }
      delete next[key]
      if (key === "lat" || key === "lng") delete next.lat
      return next
    })
  }

  function updateField<K extends keyof CitizenIncidentFormValues>(
    key: K,
    value: CitizenIncidentFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
    clearFieldError(key)
  }

  function applyCoordinates(lat: number, lng: number, locationLabel?: string) {
    setValues((prev) => ({
      ...prev,
      lat,
      lng,
      location: locationLabel?.trim() || prev.location || "Pinned location",
    }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.lat
      delete next.location
      return next
    })
    setGeoError(null)
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoError("Location is not available in this browser.")
      return
    }
    setGeoBusy(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyCoordinates(
          pos.coords.latitude,
          pos.coords.longitude,
          values.location || "Current location"
        )
        setShowMap(true)
        setGeoBusy(false)
      },
      () => {
        setGeoError(
          "Could not get your location. Allow location access or pick on the map."
        )
        setGeoBusy(false)
      },
      { enableHighAccuracy: true, timeout: 12_000 }
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      if (validationErrors.lat) setShowMap(true)
      return
    }

    setSubmitting(true)
    try {
      const media =
        mode === "create" ? await toDurableMediaItems(draftMedia) : values.media
      await onSubmit({
        ...values,
        title: values.title.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
        reporterPhone: values.reporterPhone.trim(),
        reporterEmail: values.reporterEmail.trim(),
        media,
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Something went wrong."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field data-invalid={!!errors.type}>
            <FieldLabel htmlFor="type">Incident type</FieldLabel>
            <FieldContent>
              <Select
                value={values.type}
                onValueChange={(value) =>
                  updateField("type", value as IncidentType)
                }
              >
                <SelectTrigger
                  id="type"
                  className="h-11 w-full bg-[var(--ajali-surface)]"
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError
                errors={errors.type ? [{ message: errors.type }] : []}
              />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.urgency}>
            <FieldLabel htmlFor="urgency">Urgency</FieldLabel>
            <FieldContent>
              <Select
                value={values.urgency}
                onValueChange={(value) =>
                  updateField("urgency", value as IncidentUrgency)
                }
              >
                <SelectTrigger
                  id="urgency"
                  className="h-11 w-full bg-[var(--ajali-surface)]"
                >
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_URGENCIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError
                errors={errors.urgency ? [{ message: errors.urgency }] : []}
              />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.severity}>
            <FieldLabel htmlFor="severity">Severity</FieldLabel>
            <FieldContent>
              <Select
                value={values.severity}
                onValueChange={(value) =>
                  updateField("severity", value as IncidentSeverity)
                }
              >
                <SelectTrigger
                  id="severity"
                  className="h-11 w-full bg-[var(--ajali-surface)]"
                >
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_SEVERITIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError
                errors={
                  errors.severity ? [{ message: errors.severity }] : []
                }
              />
            </FieldContent>
          </Field>
        </div>

        <Field data-invalid={!!errors.title}>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <FieldContent>
            <Input
              id="title"
              className="h-11 bg-[var(--ajali-surface)]"
              value={values.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Brief summary of what happened"
              aria-invalid={!!errors.title}
            />
            <FieldError
              errors={errors.title ? [{ message: errors.title }] : []}
            />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.location || !!errors.lat}>
          <FieldLabel htmlFor="location">Location</FieldLabel>
          <FieldContent className="gap-3">
            <Input
              id="location"
              className="h-11 bg-[var(--ajali-surface)]"
              value={values.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="Street, estate, or landmark"
              aria-invalid={!!errors.location}
            />
            <FieldError
              errors={errors.location ? [{ message: errors.location }] : []}
            />

            <div className="space-y-2">
              <FieldLabel
                htmlFor="locationSearch"
                className="text-muted-foreground"
              >
                Search place
              </FieldLabel>
              <Input
                id="locationSearch"
                className="h-11 bg-[var(--ajali-surface)]"
                placeholder="Search Nairobi, Nakuru, Mombasa…"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
              <ul className="max-h-36 overflow-y-auto rounded-lg border bg-background">
                {suggestions.map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        applyCoordinates(item.lat, item.lng, item.label)
                        setLocationQuery(item.label)
                        setShowMap(true)
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={geoBusy}
                onClick={useCurrentLocation}
              >
                <LocateFixed className="size-4" />
                {geoBusy ? "Locating…" : "Use my location"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMap((open) => !open)}
              >
                <MapPinned className="size-4" />
                {showMap ? "Hide map" : "Pick on map"}
              </Button>
            </div>

            {geoError ? (
              <p className="text-xs text-destructive">{geoError}</p>
            ) : null}

            {values.lat !== null && values.lng !== null ? (
              <p className="text-xs text-muted-foreground">
                Pin: {values.lat.toFixed(5)}, {values.lng.toFixed(5)}
              </p>
            ) : null}

            <FieldError errors={errors.lat ? [{ message: errors.lat }] : []} />

            {showMap ? (
              <div className="overflow-hidden rounded-lg border">
                <div className="h-56">
                  <Map
                    center={mapCenter}
                    zoom={values.lat !== null ? 14 : 11}
                    theme="light"
                    className="size-full"
                  >
                    <MapMarker
                      longitude={mapCenter[0]}
                      latitude={mapCenter[1]}
                      draggable
                      onDragEnd={(lngLat) => {
                        applyCoordinates(
                          lngLat.lat,
                          lngLat.lng,
                          values.location ||
                            `Pinned ${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`
                        )
                      }}
                    >
                      <MarkerContent>
                        <span className="block size-4 rounded-full border-2 border-white bg-[var(--ajali-primary)] shadow" />
                      </MarkerContent>
                    </MapMarker>
                  </Map>
                </div>
                <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
                  Drag the pin to the exact spot. You can also search or use your
                  current location.
                </p>
              </div>
            ) : null}
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <FieldContent>
            <Textarea
              id="description"
              className="min-h-28 bg-[var(--ajali-surface)]"
              value={values.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="What happened, who's involved, and any immediate risks"
              rows={5}
              aria-invalid={!!errors.description}
            />
            <FieldDescription>
              At least {DESCRIPTION_MIN_LENGTH} characters. Be specific; this is
              what responders see first.
            </FieldDescription>
            <FieldError
              errors={
                errors.description ? [{ message: errors.description }] : []
              }
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>Evidence photos</FieldLabel>
          <FieldContent className="gap-2">
            <FieldDescription>
              Add clear photos of the scene. These help responders verify the
              report.
            </FieldDescription>
            {mediaLoading ? (
              <p className="text-sm text-muted-foreground">Loading evidence…</p>
            ) : incidentId ? (
              <IncidentMediaPanel
                incidentId={incidentId}
                media={savedMedia}
                actor={actor}
                accept="image/*"
                addLabel="Add evidence photos"
                onChanged={() => {
                  void mediaApi.list(incidentId).then(setSavedMedia)
                }}
              />
            ) : (
              <IncidentMediaPanel
                media={[]}
                draft={draftMedia}
                onDraftChange={setDraftMedia}
                accept="image/*"
                addLabel="Add evidence photos"
              />
            )}
          </FieldContent>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="reporterPhone">Phone</FieldLabel>
            <FieldContent>
              <Input
                id="reporterPhone"
                className="h-11 bg-[var(--ajali-surface)]"
                value={values.reporterPhone}
                onChange={(e) => updateField("reporterPhone", e.target.value)}
                placeholder="+254…"
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="reporterEmail">Email</FieldLabel>
            <FieldContent>
              <Input
                id="reporterEmail"
                type="email"
                className="h-11 bg-[var(--ajali-surface)]"
                value={values.reporterEmail}
                onChange={(e) => updateField("reporterEmail", e.target.value)}
                placeholder="you@example.com"
              />
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="preferredContact">Preferred contact</FieldLabel>
          <FieldContent>
            <Select
              value={values.preferredContactMethod}
              onValueChange={(value) =>
                updateField(
                  "preferredContactMethod",
                  value as PreferredContactMethod
                )
              }
            >
              <SelectTrigger
                id="preferredContact"
                className="h-11 w-full bg-[var(--ajali-surface)]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PHONE">Phone</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        {submitError ? (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {submitError}
          </p>
        ) : null}

        <Button type="submit" className="h-11 font-bold" disabled={submitting}>
          {submitting
            ? "Saving…"
            : (submitLabel ??
              (mode === "create" ? "Submit report" : "Save changes"))}
        </Button>
      </FieldGroup>
    </form>
  )
}

export { CitizenIncidentForm, EMPTY_VALUES as emptyCitizenIncidentForm }
