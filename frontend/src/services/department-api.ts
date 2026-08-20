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

export const departmentApi = {
  getAll(options?: { activeOnly?: boolean }) {
    return apiGetDepartments(options)
  },
  getById(id: string) {
    return apiGetDepartment(id)
  },
  create(data: CreateDepartmentInput, actor: Actor) {
    return apiCreateDepartment(data, actor)
  },
  update(id: string, patch: UpdateDepartmentPatch, actor: Actor) {
    return apiUpdateDepartment(id, patch, actor)
  },
  activate(id: string, actor: Actor) {
    return apiSetDepartmentActive(id, true, actor)
  },
  deactivate(id: string, actor: Actor) {
    return apiSetDepartmentActive(id, false, actor)
  },
}

export type { CreateDepartmentInput, UpdateDepartmentPatch }
