import { useAuth } from "@/store/hooks"
import type { Actor } from "@/services/incident-api"

/** Current admin actor for service-layer mutations. */
export function useAdminActor(): Actor | null {
  const { user } = useAuth()
  if (!user) return null
  return { id: user.id, name: user.name }
}
