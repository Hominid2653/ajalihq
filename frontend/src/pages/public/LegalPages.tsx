import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { brandStyle, creamCardClass } from "@/lib/brand"

type DocumentPageProps = {
  title: string
  subtitle: string
  children: ReactNode
}

function DocumentPage({ title, subtitle, children }: DocumentPageProps) {
  return (
    <div className="relative min-h-svh overflow-hidden text-white" style={brandStyle}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#0a0612] bg-[url('/splash.png')] bg-cover bg-center bg-no-repeat"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#0a0612]/50"
      />
      <header className="relative z-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-10">
          <Link className="text-sm font-semibold text-white/80 hover:text-white" to="/">
            ← Ajali!
          </Link>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-sm text-white/80">{subtitle}</p>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-10">
        <div className={`rounded-2xl p-6 ${creamCardClass}`}>{children}</div>
      </main>
    </div>
  )
}

function TermsPage() {
  return (
    <DocumentPage title="Terms & conditions" subtitle="Effective date: August 2026">
      <div className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p className="font-semibold text-foreground">
          By using Ajali! you agree to report incidents in good faith and not to
          submit false or misleading emergencies.
        </p>
        <h2 className="text-base font-bold text-foreground">Citizen responsibilities</h2>
        <p>
          Provide accurate location, description, and media. False reports may be
          closed and your account reviewed.
        </p>
        <h2 className="text-base font-bold text-foreground">Admin review</h2>
        <p>
          Reports stay private until an administrator verifies them and marks
          response as in progress.
        </p>
      </div>
    </DocumentPage>
  )
}

function SupportPage() {
  return (
    <DocumentPage title="Help & support" subtitle="Help with Ajali!">
      <div className="space-y-6 text-sm leading-6 text-muted-foreground">
        <section>
          <h2 className="text-base font-bold text-foreground">How do I report an incident?</h2>
          <p>
            Sign in, tap Report, add the type, location, description, and any
            photos or video, then submit. Pending reports can be edited until
            they are verified.
          </p>
        </section>
        <section>
          <h2 className="text-base font-bold text-foreground">When does an incident appear on the map?</h2>
          <p>
            Only incidents marked in progress are shown on the public live map.
          </p>
        </section>
        <section>
          <h2 className="text-base font-bold text-foreground">Contact</h2>
          <p>Email support@ajalihq.test for account or reporting help.</p>
        </section>
      </div>
    </DocumentPage>
  )
}

export { TermsPage, SupportPage }
