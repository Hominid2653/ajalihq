import {
  apiCompleteHandoff,
  apiGetAllHandoffs,
  apiGetHandoffs,
  apiUpdateHandoff,
  type Actor,
  type UpdateHandoffInput,
} from "@/data/api"
import { env } from "@/lib/env"
import { apiClient } from "@/lib/http-client"
import type { DepartmentHandoff } from "@/types/incident"

export const handoffApi = {
  async getByIncident(incidentId: string): Promise<DepartmentHandoff[]> {
    if (!env.useMockApi) {
      return apiClient.get<DepartmentHandoff[]>(`/api/v1/incidents/${incidentId}/handoffs`)
    }
    return apiGetHandoffs(incidentId)
  },

  async getAll(): Promise<DepartmentHandoff[]> {
    if (!env.useMockApi) {
      return apiClient.get<DepartmentHandoff[]>("/api/v1/admin/handoffs")
    }
    return apiGetAllHandoffs()
  },

  async update(id: string, input: UpdateHandoffInput, actor?: Actor): Promise<DepartmentHandoff> {
    if (!env.useMockApi) {
      return apiClient.patch<DepartmentHandoff>(`/api/v1/handoffs/${id}`, input)
    }
    if (!actor) throw new Error("Actor is required for mock handoff update")
    return apiUpdateHandoff(id, input, actor)
  },

  async complete(id: string, notes: string | undefined, actor?: Actor): Promise<DepartmentHandoff> {
    if (!env.useMockApi) {
      return apiClient.post<DepartmentHandoff>(`/api/v1/handoffs/${id}/complete`, { notes })
    }
    if (!actor) throw new Error("Actor is required for mock handoff complete")
    return apiCompleteHandoff(id, notes, actor)
  },
}

export type { UpdateHandoffInput }
