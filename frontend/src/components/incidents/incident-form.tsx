import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  INCIDENT_TYPES,
  INCIDENT_TYPE_LABELS,
  SEVERITIES,
  SEVERITY_LABELS,
  type IncidentInput,
} from "@/types/incident"

type FormErrors = Partial<Record<keyof IncidentInput, string>>

const DESCRIPTION_MIN_LENGTH = 20

function validate(values: IncidentInput): FormErrors {
  const errors: FormErrors = {}

  if (!values.title.trim()) {
    errors.title = "Title is required."
  }

  if (!values.description.trim()) {
    errors.description = "Description is required."
  } else if (values.description.trim().length < DESCRIPTION_MIN_LENGTH) {
    errors.description = `Description should be at least ${DESCRIPTION_MIN_LENGTH} characters.`
  }

  if (!values.location.trim()) {
    errors.location = "Location is required."
  }

  if (!values.incidentType) {
    errors.incidentType = "Select an incident type."
  }

  if (!values.severity) {
    errors.severity = "Select a severity level."
  }

  return errors
}

interface IncidentFormProps {
  mode: "create" | "edit"
  initialValues?: IncidentInput
  onSubmit: (values: IncidentInput) => Promise<void>
  submitLabel?: string
}

const EMPTY_VALUES: IncidentInput = {
  title: "",
  description: "",
  incidentType: "traffic",
  severity: "low",
  location: "",
}

export function IncidentForm({
  mode,
  initialValues,
  onSubmit,
  submitLabel,
}: IncidentFormProps) {
  const [values, setValues] = useState<IncidentInput>(
    initialValues ?? EMPTY_VALUES
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function updateField<K extends keyof IncidentInput>(
    key: K,
    value: IncidentInput[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

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
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.title}>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <FieldContent>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Brief summary of what happened"
              aria-invalid={!!errors.title}
            />
            <FieldError errors={errors.title ? [{ message: errors.title }] : []} />
          </FieldContent>
        </Field>

        <Field orientation="responsive" data-invalid={!!errors.incidentType}>
          <FieldContent>
            <FieldLabel htmlFor="incidentType">Incident type</FieldLabel>
            <Select
              value={values.incidentType}
              onValueChange={(value) =>
                updateField("incidentType", value as IncidentInput["incidentType"])
              }
            >
              <SelectTrigger id="incidentType" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {INCIDENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError
              errors={errors.incidentType ? [{ message: errors.incidentType }] : []}
            />
          </FieldContent>

          <FieldContent>
            <FieldLabel htmlFor="severity">Severity</FieldLabel>
            <Select
              value={values.severity}
              onValueChange={(value) =>
                updateField("severity", value as IncidentInput["severity"])
              }
            >
              <SelectTrigger id="severity" className="w-full">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    {SEVERITY_LABELS[severity]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError
              errors={errors.severity ? [{ message: errors.severity }] : []}
            />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.location}>
          <FieldLabel htmlFor="location">Location</FieldLabel>
          <FieldContent>
            <Input
              id="location"
              value={values.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="e.g. Nairobi, South B"
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

        {submitError && (
          <p role="alert" className="text-sm text-destructive">
            {submitError}
          </p>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Saving..."
            : submitLabel ?? (mode === "create" ? "Report incident" : "Save changes")}
        </Button>
      </FieldGroup>
    </form>
  )
}