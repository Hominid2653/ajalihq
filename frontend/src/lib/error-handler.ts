import { toast } from "sonner";

/**
 * Reusable utility to handle front-end errors and display standard actionable messages.
 * Catches fetch/axios exceptions gracefully.
 */
export const handleApiError = (error: any, fallbackMessage: string = "Something went wrong. Please try again.") => {
  // Log full error stack internally for debugging
  console.error("API execution failure context:", error);

  let displayedMessage = fallbackMessage;

  if (error && typeof error === "object") {
    if (error.message === "Failed to fetch") {
      displayedMessage = "Network error: Please check your internet connection.";
    } else if (error.status === 401) {
      displayedMessage = "Session expired. Please log back in to proceed.";
    } else if (error.status === 403) {
      displayedMessage = "Unauthorized operation. Action logged.";
    } else if (error.status >= 500) {
      displayedMessage = "Server error. Ajali! systems engineers are currently investigating.";
    } else if (error.response?.data?.message) {
      displayedMessage = error.response.data.message;
    }
  }

  // Display clean toast message to the citizen or admin user
  toast.error("Operation Failed", {
    description: displayedMessage,
    duration: 5000,
  });

  return displayedMessage;
};
