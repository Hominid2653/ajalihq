import { useEffect, useMemo, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { AdminShell, adminDesktopRailClass } from "@/components/admin/admin-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAdminActor } from "@/hooks/use-admin-actor"
import { departmentApi } from "@/services/department-api"
import type { Department, DepartmentType } from "@/types/incident"
import { departmentTypeLabel } from "@/types/incident"

const emptyForm = {
  name: "",
  type: "POLICE" as DepartmentType,
  description: "",
  phone: "",
  email: "",
  location: "",
  active: true,
}

function AdminDepartmentsPage() {
  const actor = useAdminActor()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      setDepartments(await departmentApi.getAll())
      setError("")
    } catch {
      setError("Could not load departments.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return departments.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        departmentTypeLabel(item.type).toLowerCase().includes(q)
      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" ? item.active : !item.active)
      return matchesSearch && matchesActive
    })
  }, [activeFilter, departments, search])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(department: Department) {
    setEditing(department)
    setForm({
      name: department.name,
      type: department.type,
      description: department.description ?? "",
      phone: department.phone ?? "",
      email: department.email ?? "",
      location: department.location ?? "",
      active: department.active,
    })
    setOpen(true)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!actor) return toast.error("Admin session unavailable.")
    setSaving(true)
    try {
      if (editing) {
        await departmentApi.update(editing.id, form, actor)
        toast.success("Department updated.")
      } else {
        await departmentApi.create(form, actor)
        toast.success("Department created.")
      }
      setOpen(false)
      await load()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save department.")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(department: Department) {
    if (!actor) return
    try {
      if (department.active) await departmentApi.deactivate(department.id, actor)
      else await departmentApi.activate(department.id, actor)
      await load()
    } catch {
      toast.error("Could not update department status.")
    }
  }

  return (
    <AdminShell title="Departments" flush>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:min-w-0 md:overflow-y-auto md:px-6 md:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:hidden">
          <Input
            placeholder="Search departments…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openCreate}>Create department</Button>
        </div>

        {loading ? <Skeleton className="h-64" /> : null}
        {error ? <p className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</p> : null}

        {!loading && visible.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No departments match your filters.</CardContent></Card>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((department) => (
            <Card key={department.id} className="bg-[var(--ajali-cream)]">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{department.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{departmentTypeLabel(department.type)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${department.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {department.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {department.description ? <p className="text-muted-foreground">{department.description}</p> : null}
                <dl className="space-y-1 text-xs">
                  {department.phone ? <div><dt className="inline text-muted-foreground">Phone: </dt><dd className="inline">{department.phone}</dd></div> : null}
                  {department.email ? <div><dt className="inline text-muted-foreground">Email: </dt><dd className="inline">{department.email}</dd></div> : null}
                  {department.location ? <div><dt className="inline text-muted-foreground">Location: </dt><dd className="inline">{department.location}</dd></div> : null}
                </dl>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(department)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => void toggleActive(department)}>
                    {department.active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>

        <aside className={adminDesktopRailClass}>
          <div>
            <p className="text-sm text-muted-foreground">Response units</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Departments</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Keep police, fire, hospital, and other units ready for handoff.
            </p>
          </div>
          <Button onClick={openCreate}>Create department</Button>
          <div className="flex flex-col gap-2 border-t border-border pt-5">
            <Input
              placeholder="Search departments…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <p className="pt-1 text-xs text-muted-foreground">
              {visible.length} of {departments.length} shown
            </p>
          </div>
        </aside>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit department" : "Create department"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as DepartmentType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["POLICE", "FIRE", "HOSPITAL", "AMBULANCE", "DISASTER_RESPONSE", "OTHER"] as DepartmentType[]).map((value) => (
                    <SelectItem key={value} value={value}>{departmentTypeLabel(value)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <Label htmlFor="dept-active">Active</Label>
              <Switch id="dept-active" checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}

export { AdminDepartmentsPage }
