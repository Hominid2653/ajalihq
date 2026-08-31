import {
  apiCreateDepartment,
  apiGetDepartment,
  apiGetDepartments,
  apiSetDepartmentActive,
  apiUpdateDepartment,
  type Actor,
  type CreateDepartmentInput,
  type UpdateDepartmentPatch,
} from "@/data/api"
import { env } from "@/lib/env"
import { apiClient, ApiError } from "@/lib/http-client"
import type { Department } from "@/types/incident"

export const departmentApi = {
  async getAll(options?: { activeOnly?: boolean }): Promise<Department[]> {
    if (!env.useMockApi) {
      return apiClient.get<Department[]>("/api/v1/departments", options)
    }
    return apiGetDepartments(options)
  },

  async getById(id: string): Promise<Department | null> {
    if (!env.useMockApi) {
      try {
        return await apiClient.get<Department>(`/api/v1/departments/${id}`)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    }
    return apiGetDepartment(id)
  },

  async create(data: CreateDepartmentInput, actor?: Actor): Promise<Department> {
    if (!env.useMockApi) {
      return apiClient.post<Department>("/api/v1/departments", data)
    }
    if (!actor) throw new Error("Actor is required for mock department create")
    return apiCreateDepartment(data, actor)
  },

  async update(id: string, patch: UpdateDepartmentPatch, actor?: Actor): Promise<Department> {
    if (!env.useMockApi) {
      return apiClient.patch<Department>(`/api/v1/departments/${id}`, patch)
    }
    if (!actor) throw new Error("Actor is required for mock department update")
    return apiUpdateDepartment(id, patch, actor)
  },

  async activate(id: string, actor?: Actor): Promise<Department> {
    if (!env.useMockApi) {
      return apiClient.post<Department>(`/api/v1/departments/${id}/activate`)
    }
    if (!actor) throw new Error("Actor is required for mock department activate")
    return apiSetDepartmentActive(id, true, actor)
  },

  async deactivate(id: string, actor?: Actor): Promise<Department> {
    if (!env.useMockApi) {
      return apiClient.post<Department>(`/api/v1/departments/${id}/deactivate`)
    }
    if (!actor) throw new Error("Actor is required for mock department deactivate")
    return apiSetDepartmentActive(id, false, actor)
  },
}

export type { CreateDepartmentInput, UpdateDepartmentPatch }
