/**
 * Ajali! brand utilities.
 *
 * All colour references use the semantic CSS custom properties from index.css.
 * Nothing here should hardcode a raw colour value.
 */
import type { CSSProperties } from "react"

/**
 * Inline style applied to auth splash pages.
 * Forces the local primary token to the Ajali green even when
 * next-themes might inject a `.dark` class on the <html> element.
 */
export const brandStyle: CSSProperties = {
  "--primary": "var(--ajali-primary)",
  "--primary-foreground": "#ffffff",
  "--color-primary": "var(--ajali-primary)",
  "--color-primary-foreground": "#ffffff",
  "--ring": "var(--ajali-primary)",
} as CSSProperties

/**
 * Card class for incident/report rows: cream tinted surface.
 * Maps to --ajali-cream in the Ajali theme.
 */
export const reportCardClass =
  "rounded-xl bg-[var(--ajali-cream)] text-foreground ring-1 ring-border/60"

/**
 * Card class for profile / account info blocks.
 */
export const creamCardClass =
  "bg-[var(--ajali-cream)] text-foreground ring-1 ring-border/60"

/**
 * Card class for auth forms (white surface, hard shadow).
 */
export const authCardClass =
  "bg-[var(--ajali-surface)] text-foreground ring-1 ring-border"

/**
 * Derive a Tailwind-compatible colour class from an incident status string.
 * Returns a CSS class that references the corresponding --status-* token.
 */
export function statusColourClass(status: string): string {
  const s = (status ?? "").toLowerCase().replace(/\s+/g, "_")
  if (s === "verified")                     return "status-verified"
  if (s === "in_progress")                  return "status-progress"
  if (s === "resolved")                     return "status-resolved"
  if (s === "closed")                       return "status-closed"
  return "status-pending" // default: pending / unset
}
