import {
  apiCompleteHandoff,
  apiGetAllHandoffs,
  apiGetHandoffs,
  apiUpdateHandoff,
  type Actor,
  type UpdateHandoffInput,
} from "@/data/api"

export const handoffApi = {
  getByIncident(incidentId: string) {
    return apiGetHandoffs(incidentId)
  },
  getAll() {
    return apiGetAllHandoffs()
  },
  update(id: string, input: UpdateHandoffInput, actor: Actor) {
    return apiUpdateHandoff(id, input, actor)
  },
  complete(id: string, notes: string | undefined, actor: Actor) {
    return apiCompleteHandoff(id, notes, actor)
  },
}

export type { UpdateHandoffInput }
