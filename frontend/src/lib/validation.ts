/**
 * Utility functions for validating frontend form inputs.
 * Supports incident creation, auth forms, and status updates.
 */

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validates the incident reporting form fields.
 * @param title - The title of the incident report
 * @param description - Detailed information about the incident
 * @param coordinates - Geolocation details text/string
 * @md_image - Checked if image supports the claims
 */
export const validateIncidentForm = (
  title: string,
  description: string,
  latitude?: number,
  longitude?: number
): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!title || title.trim().length < 5) {
    errors.title = "Title must be at least 5 characters long.";
  }

  if (!description || description.trim().length < 15) {
    errors.description = "Description must be at least 15 characters long.";
  }

  if (latitude === undefined || latitude < -4.7 || latitude > 5.5) {
    errors.latitude = "Please provide a valid latitude matching Kenyan borders.";
  }

  if (longitude === undefined || longitude < 33.8 || longitude > 41.9) {
    errors.longitude = "Please provide a valid longitude matching Kenyan borders.";
  }

  return errors;
};
