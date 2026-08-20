// Zod schemas for incident create/edit forms.
// Centralized here so both new-incident.tsx and edit-incident.tsx
// (and incident-form.tsx) share one source of truth for validation rules.

import { z } from "zod";

// Reusable geolocation schema — lat/long must be valid coordinate ranges
const geolocationSchema = z.object({
  latitude: z
    .number({ invalid_type_error: "Latitude must be a number" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number({ invalid_type_error: "Longitude must be a number" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
});

// Shared fields between create and edit
const baseIncidentFields = {
  reportType: z.enum(["accident", "fire", "medical", "crime", "disaster", "other"], {
    errorMap: () => ({ message: "Please select a report type" }),
  }),
  location: z.string().min(3, "Location is required"),
  description: z
    .string()
    .min(10, "Description should be at least 10 characters")
    .max(2000, "Description is too long (max 2000 characters)"),
  geolocation: geolocationSchema.optional(),
};

// Used on new-incident.tsx
export const createIncidentSchema = z.object({
  ...baseIncidentFields,
});

// Used on edit-incident.tsx — same shape for now, kept separate
// so we can diverge later (e.g. allow status changes for admins)
// without touching the create flow.
export const editIncidentSchema = z.object({
  ...baseIncidentFields,
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type EditIncidentInput = z.infer<typeof editIncidentSchema>;