import { useState, type FormEvent } from "react"

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
  type IncidentSeverity,
  type IncidentType,
} from "@/lib/incidents"

export type CitizenIncidentFormValues = {
  title: string
  description: string
  type: IncidentType
  severity: IncidentSeverity
  location: string
}

type FormErrors = Partial<Record<keyof CitizenIncidentFormValues, string>>

const DESCRIPTION_MIN_LENGTH = 20

const EMPTY_VALUES: CitizenIncidentFormValues = {
  title: "",
  description: "",
  type: "accident",
  severity: "MODERATE",
  location: "",
}

function validate(values: CitizenIncidentFormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.title.trim()) errors.title = "Title is required."
  if (!values.location.trim()) errors.location = "Location is required."
  if (!values.type) errors.type = "Select an incident type."
  if (!values.severity) errors.severity = "Select a severity level."
  if (!values.description.trim()) {
    errors.description = "Description is required."
  } else if (values.description.trim().length < DESCRIPTION_MIN_LENGTH) {
    errors.description = `Description should be at least ${DESCRIPTION_MIN_LENGTH} characters.`
  }
  return errors
}

type CitizenIncidentFormProps = {
  mode: "create" | "edit"
  initialValues?: CitizenIncidentFormValues
  onSubmit: (values: CitizenIncidentFormValues) => Promise<void>
  submitLabel?: string
}

function CitizenIncidentForm({
  mode,
  initialValues,
  onSubmit,
  submitLabel,
}: CitizenIncidentFormProps) {
  const [values, setValues] = useState<CitizenIncidentFormValues>(
    initialValues ?? EMPTY_VALUES
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function updateField<K extends keyof CitizenIncidentFormValues>(
    key: K,
    value: CitizenIncidentFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      await onSubmit(values)
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
        <Field data-invalid={!!errors.type}>
          <FieldLabel htmlFor="type">Incident type</FieldLabel>
          <FieldContent>
            <Select
              value={values.type}
              onValueChange={(value) => updateField("type", value as IncidentType)}
            >
              <SelectTrigger id="type" className="h-11 w-full bg-[var(--ajali-surface)]">
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
            <FieldError errors={errors.type ? [{ message: errors.type }] : []} />
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
              <SelectTrigger id="severity" className="h-11 w-full bg-[var(--ajali-surface)]">
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
              errors={errors.severity ? [{ message: errors.severity }] : []}
            />
          </FieldContent>
        </Field>

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
            <FieldError errors={errors.title ? [{ message: errors.title }] : []} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.location}>
          <FieldLabel htmlFor="location">Location</FieldLabel>
          <FieldContent>
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
              At least {DESCRIPTION_MIN_LENGTH} characters. Be specific — this is
              what responders see first.
            </FieldDescription>
            <FieldError
              errors={errors.description ? [{ message: errors.description }] : []}
            />
          </FieldContent>
        </Field>

        {submitError ? (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}

        <Button type="submit" className="h-11 font-bold" disabled={submitting}>
          {submitting
            ? "Saving…"
            : submitLabel ??
              (mode === "create" ? "Submit report" : "Save changes")}
        </Button>
      </FieldGroup>
    </form>
  )
}

export { CitizenIncidentForm, EMPTY_VALUES as emptyCitizenIncidentForm }
