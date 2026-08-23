import { useCallback, useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Logomark } from "@/components/brand/logomark"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { brandStyle } from "@/lib/brand"
import { cn } from "@/lib/utils"

const TEAM = [
  "Nina Adora",
  "Elias Cheruiyot",
  "James Githinji",
  "Purity Mutheu",
] as const

const AGENDA = [
  "Problem & Solution",
  "System Architecture",
  "Implementation Details",
  "Security & Workflow",
  "Live Demo",
  "Q&A & Lessons Learned",
] as const

const STACK = [
  "React + Vite",
  "TypeScript",
  "Tailwind + shadcn/ui",
  "Redux Toolkit",
  "Mock API (Flask-ready)",
] as const

type Slide = {
  id: string
  layout?: "title" | "split" | "content" | "section"
  eyebrow?: string
  title: string
  body?: ReactNode
}

const SLIDES: Slide[] = [
  {
    id: "title",
    layout: "title",
    title: "Ajali!",
    body: (
      <div className="space-y-8">
        <p className="inline-flex bg-ajali-nav px-4 py-2 text-sm font-semibold tracking-wide text-white">
          Technical Presentation
        </p>
        <p className="max-w-2xl text-xl text-white/80 sm:text-2xl">
          See it. Report it. Respond to it.
        </p>
        <p className="max-w-xl text-base text-white/70">
          Community emergency reporting for Kenya. Moringa Capstone · Sprint 1
          Frontend
        </p>
      </div>
    ),
  },
  {
    id: "team",
    layout: "split",
    title: "The Team",
    body: (
      <ul className="space-y-4 text-lg text-foreground sm:text-xl">
        {TEAM.map((name) => (
          <li key={name} className="border-b border-border pb-3 font-semibold">
            {name}
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "agenda",
    layout: "split",
    eyebrow: "Overview",
    title: "Agenda",
    body: (
      <ol className="space-y-4 text-lg sm:text-xl">
        {AGENDA.map((item, index) => (
          <li key={item} className="flex items-baseline gap-4">
            <span className="w-10 shrink-0 font-bold text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-foreground">{item}</span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: "problem",
    layout: "content",
    eyebrow: "01 · Problem & Solution",
    title: "Problem Statement",
    body: (
      <div className="max-w-3xl space-y-5 text-lg leading-8 text-muted-foreground sm:text-xl">
        <p>
          Emergencies happen every day on Kenyan roads, in markets, and in
          neighbourhoods. People see them, but reporting is still fragmented.
        </p>
        <ul className="space-y-3">
          {[
            "Phone calls and walk-ins are easy to lose or miscommunicate.",
            "Location, photos, and status updates are often missing.",
            "Communities cannot see which incidents are being handled.",
            "Admins need one place to review, moderate, and track every report.",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2.5 size-2 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "solution",
    layout: "content",
    eyebrow: "01 · Problem & Solution",
    title: "Solution Overview",
    body: (
      <div className="max-w-3xl space-y-5 text-lg leading-8 text-muted-foreground sm:text-xl">
        <p>
          Ajali! is a community emergency reporting platform. Citizens submit
          clear reports with location and evidence. Admins verify, respond, and
          resolve them in one operations panel.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-ajali-cream p-5 ring-1 ring-border/60">
            <p className="mb-2 font-bold text-foreground">Citizens</p>
            <p>
              Report incidents, pin the place, add photos, and track status.
            </p>
          </div>
          <div className="rounded-xl bg-ajali-cream p-5 ring-1 ring-border/60">
            <p className="mb-2 font-bold text-foreground">Admins</p>
            <p>
              Review inbox, moderate lifecycle, map operations, audit, and
              notify.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "stack",
    layout: "content",
    eyebrow: "01 · Problem & Solution",
    title: "Development Stack",
    body: (
      <ol className="grid max-w-3xl gap-3 sm:grid-cols-2">
        {STACK.map((item, index) => (
          <li
            key={item}
            className="flex items-center gap-4 rounded-xl bg-ajali-cream px-5 py-4 ring-1 ring-border/60"
          >
            <span className="text-sm font-bold text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-lg font-semibold text-foreground">{item}</span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: "architecture",
    layout: "content",
    eyebrow: "02 · System Architecture",
    title: "System Architecture",
    body: (
      <div className="max-w-3xl space-y-6">
        <div className="rounded-xl bg-ajali-cream px-6 py-5 font-mono text-sm leading-8 text-foreground ring-1 ring-border/60 sm:text-base">
          <p>Citizen / Admin UI</p>
          <p className="text-muted-foreground">↓</p>
          <p>Redux / hooks</p>
          <p className="text-muted-foreground">↓</p>
          <p>API service layer</p>
          <p className="text-muted-foreground">↓</p>
          <p>Mock api.ts today → Flask + PostgreSQL next</p>
        </div>
        <p className="text-lg leading-8 text-muted-foreground sm:text-xl">
          Screens call service contracts such as verify or resolve. When Flask
          arrives, we replace the data source, not the whole UI.
        </p>
      </div>
    ),
  },
  {
    id: "data-model",
    layout: "content",
    eyebrow: "02 · System Architecture",
    title: "Core Data Model",
    body: (
      <div className="max-w-3xl space-y-5 text-lg leading-8 text-muted-foreground sm:text-xl">
        <p>
          The frontend is built around shared typed models so citizen and admin
          flows stay consistent.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "User / Role",
            "Incident",
            "IncidentMedia",
            "IncidentNote",
            "StatusHistory",
            "Notification",
            "AuditLog",
          ].map((item) => (
            <li
              key={item}
              className="rounded-xl bg-ajali-cream px-4 py-3 font-semibold text-foreground ring-1 ring-border/60"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "implementation",
    layout: "content",
    eyebrow: "03 · Implementation Details",
    title: "How we built it",
    body: (
      <ol className="max-w-3xl space-y-5 text-lg leading-8 text-muted-foreground sm:text-xl">
        {[
          {
            title: "Define the product",
            detail: "Citizen report flow, admin moderation, and status rules.",
          },
          {
            title: "Design with Figma tokens",
            detail: "Reuse Ajali! green, cream, white, and status colours.",
          },
          {
            title: "Build against services",
            detail: "UI never mutates seed arrays. All writes go through APIs.",
          },
          {
            title: "Ship role-based screens",
            detail: "Citizen app and admin panel share types and lifecycle.",
          },
        ].map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="font-bold text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="font-semibold text-foreground">{step.title}</p>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: "built",
    layout: "content",
    eyebrow: "03 · Implementation Details",
    title: "What we shipped",
    body: (
      <ul className="max-w-3xl space-y-4 text-lg leading-8 text-muted-foreground sm:text-xl">
        {[
          "Public marketing site with about, how it works, terms, and privacy",
          "Citizen reporting with location picker and evidence photos",
          "Admin panel: dashboard, incidents, map, notifications, audit log",
          "Stateful mock API with history, notes, media, and notifications",
        ].map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2.5 size-2 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "security",
    layout: "content",
    eyebrow: "04 · Security & Workflow",
    title: "Security & Workflow",
    body: (
      <div className="max-w-3xl space-y-6 text-lg leading-8 text-muted-foreground sm:text-xl">
        <p>
          Frontend RBAC protects admin routes. Only ADMIN users reach the
          operations panel. Citizens manage their own pending reports.
        </p>
        <div className="rounded-xl bg-ajali-cream px-6 py-5 font-mono text-sm leading-8 text-foreground ring-1 ring-border/60 sm:text-base">
          <p>PENDING → VERIFIED → IN_PROGRESS → RESOLVED</p>
          <p className="text-muted-foreground">or</p>
          <p>PENDING → CLOSED</p>
        </div>
        <p>
          Every status change creates history, audit, and notification records
          through the service layer.
        </p>
      </div>
    ),
  },
  {
    id: "demo",
    layout: "content",
    eyebrow: "05 · Live Demo",
    title: "Live Demo",
    body: (
      <div className="max-w-3xl space-y-6">
        <ol className="space-y-4 text-lg leading-8 text-muted-foreground sm:text-xl">
          {[
            "Sign up / sign in as citizen or admin",
            "Create a report with location and evidence",
            "Admin verifies, starts response, then resolves",
            "Confirm dashboard, map, audit, and notifications update",
          ].map((item, index) => (
            <li key={item} className="flex gap-4">
              <span className="font-bold text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" className="h-11 font-semibold" asChild>
            <Link to="/">Open app</Link>
          </Button>
          <Button size="lg" variant="outline" className="h-11 font-semibold" asChild>
            <Link to="/home">Marketing site</Link>
          </Button>
          <Button size="lg" variant="outline" className="h-11 font-semibold" asChild>
            <Link to="/signin">Sign in</Link>
          </Button>
        </div>
      </div>
    ),
  },
  {
    id: "future",
    layout: "content",
    eyebrow: "06 · Q&A & Lessons Learned",
    title: "Future enhancements",
    body: (
      <ul className="max-w-3xl space-y-4 text-lg leading-8 text-muted-foreground sm:text-xl">
        {[
          "Flask REST API and PostgreSQL persistence",
          "Real authentication and backend RBAC",
          "Email and SMS notifications for critical updates",
          "Live geocoder for richer location search",
          "Department assignment and multi-agency handoff",
        ].map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2.5 size-2 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "qa",
    layout: "content",
    eyebrow: "06 · Q&A & Lessons Learned",
    title: "Q&A",
    body: (
      <div className="max-w-3xl space-y-8">
        <p className="text-xl leading-8 text-muted-foreground sm:text-2xl">
          Thank you. Questions are welcome.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {TEAM.map((name) => (
            <div
              key={name}
              className="rounded-xl bg-ajali-cream px-5 py-4 text-lg font-semibold text-foreground ring-1 ring-border/60"
            >
              {name}
            </div>
          ))}
        </div>
        <p className="text-base text-muted-foreground">
          Lesson learned: build UI against service contracts early so Flask can
          replace the mock layer without rewriting screens.
        </p>
      </div>
    ),
  },
]

function PresentationPage() {
  const [index, setIndex] = useState(0)
  const total = SLIDES.length
  const slide = SLIDES[index]
  const isFirst = index === 0
  const isLast = index === total - 1

  const goPrev = useCallback(() => {
    setIndex((current) => Math.max(0, current - 1))
  }, [])

  const goNext = useCallback(() => {
    setIndex((current) => Math.min(total - 1, current + 1))
  }, [total])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key === "ArrowRight" ||
        event.key === "PageDown" ||
        event.key === " "
      ) {
        event.preventDefault()
        goNext()
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault()
        goPrev()
      }
      if (event.key === "Home") {
        event.preventDefault()
        setIndex(0)
      }
      if (event.key === "End") {
        event.preventDefault()
        setIndex(total - 1)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [goNext, goPrev, total])

  return (
    <div
      className="flex min-h-svh flex-col bg-ajali-surface text-foreground"
      style={brandStyle}
    >
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <Logomark className="h-8 w-auto" />
          <div className="leading-tight">
            <p className="text-sm font-bold">Ajali!</p>
            <p className="text-xs text-muted-foreground">Technical presentation</p>
          </div>
        </div>
        <p className="text-sm tabular-nums text-muted-foreground">
          {index + 1} / {total}
        </p>
      </header>

      <main className="flex flex-1">
        {slide.layout === "title" ? (
          <section
            key={slide.id}
            className="flex flex-1 flex-col justify-center bg-ajali-nav px-8 py-12 text-white sm:px-16"
          >
            <Logomark className="mb-8 h-16 w-auto sm:h-20" />
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              {slide.title}
            </h1>
            <div className="mt-8">{slide.body}</div>
          </section>
        ) : slide.layout === "split" ? (
          <section key={slide.id} className="flex flex-1 flex-col md:flex-row">
            <div className="flex w-full items-end bg-ajali-nav px-8 py-10 md:w-[38%] md:items-center">
              <div>
                {slide.eyebrow ? (
                  <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
                    {slide.eyebrow}
                  </p>
                ) : null}
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  {slide.title}
                </h1>
              </div>
            </div>
            <div className="flex flex-1 items-center bg-ajali-cream px-8 py-10 sm:px-12">
              {slide.body}
            </div>
          </section>
        ) : (
          <section
            key={slide.id}
            className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-10 sm:px-10"
          >
            {slide.eyebrow ? (
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
                {slide.eyebrow}
              </p>
            ) : null}
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {slide.title}
            </h1>
            <Separator className="my-8" />
            <div className="min-h-[42vh]">{slide.body}</div>
          </section>
        )}
      </main>

      <footer className="border-t border-border bg-ajali-cream px-4 py-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <Button
            variant="outline"
            size="lg"
            className="h-11 gap-2"
            onClick={goPrev}
            disabled={isFirst}
          >
            <ChevronLeft className="size-4" />
            Prev
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {SLIDES.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Go to slide ${dotIndex + 1}`}
                aria-current={dotIndex === index ? "true" : undefined}
                className={cn(
                  "size-2.5 rounded-full",
                  dotIndex === index
                    ? "bg-primary"
                    : "bg-border hover:bg-muted-foreground/40"
                )}
                onClick={() => setIndex(dotIndex)}
              />
            ))}
          </div>

          <Button
            size="lg"
            className="h-11 gap-2 font-semibold"
            onClick={goNext}
            disabled={isLast}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <p className="mx-auto mt-3 max-w-5xl text-center text-xs text-muted-foreground">
          Use arrow keys or Space to move between slides
        </p>
      </footer>
    </div>
  )
}

export { PresentationPage }
