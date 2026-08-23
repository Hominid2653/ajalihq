import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { MarketingShell } from "@/components/brand/marketing-shell"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type DocumentPageProps = {
  title: string
  subtitle: string
  children: ReactNode
}

function DocumentPage({ title, subtitle, children }: DocumentPageProps) {
  return (
    <MarketingShell>
      <div className="bg-[var(--ajali-cream)]">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
          <Button variant="link" className="mb-4 h-auto px-0" asChild>
            <Link to="/home">Back to home</Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-xl bg-[var(--ajali-surface)] p-6 ring-1 ring-border/60">
          {children}
        </div>
        <Separator className="my-8" />
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to="/home#terms">Terms on home page</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/privacy">Privacy policy</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/terms">Terms &amp; conditions</Link>
          </Button>
        </div>
      </div>
    </MarketingShell>
  )
}

function TermsPage() {
  return (
    <DocumentPage
      title="Terms & conditions"
      subtitle="Effective date: August 2026"
    >
      <div className="space-y-4 text-base leading-7 text-muted-foreground">
        <p className="font-semibold text-foreground">
          By using Ajali! you agree to report incidents in good faith and not to
          submit false or misleading emergencies.
        </p>
        <h2 className="text-lg font-bold text-foreground">
          Citizen responsibilities
        </h2>
        <p>
          Provide accurate location, description, and media. False reports may
          be closed and your account reviewed.
        </p>
        <h2 className="text-lg font-bold text-foreground">Admin review</h2>
        <p>
          Reports stay private until an administrator verifies them and marks
          response as in progress.
        </p>
        <h2 className="text-lg font-bold text-foreground">Safety</h2>
        <p>
          Do not put yourself in danger to capture evidence. If you need
          immediate life saving help, contact local emergency services first.
        </p>
      </div>
    </DocumentPage>
  )
}

function SupportPage() {
  return (
    <DocumentPage title="Help & support" subtitle="Help with Ajali!">
      <div className="space-y-6 text-base leading-7 text-muted-foreground">
        <section>
          <h2 className="text-lg font-bold text-foreground">
            How do I report an incident?
          </h2>
          <p>
            Sign in, tap Report, add the type, location, description, and any
            photos, then submit. Pending reports can be edited until they are
            verified.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground">
            When does an incident appear on the map?
          </h2>
          <p>
            Only incidents marked in progress are shown on the public live map.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground">Contact</h2>
          <p>Email support@ajalihq.test for account or reporting help.</p>
        </section>
        <Button asChild>
          <Link to="/home#how-it-works">Read the step by step guide</Link>
        </Button>
      </div>
    </DocumentPage>
  )
}

function PrivacyPage() {
  return (
    <DocumentPage title="Privacy policy" subtitle="Effective date: August 2026">
      <div className="space-y-4 text-base leading-7 text-muted-foreground">
        <p className="font-semibold text-foreground">
          Ajali! collects only the information needed to verify and respond to
          emergency reports.
        </p>
        <h2 className="text-lg font-bold text-foreground">What we collect</h2>
        <p>
          Account details (name, email, phone), incident descriptions, location
          coordinates, and optional media you upload with a report.
        </p>
        <h2 className="text-lg font-bold text-foreground">How we use it</h2>
        <p>
          To verify reports, coordinate response, show active incidents on the
          public map, and notify you about status changes.
        </p>
        <h2 className="text-lg font-bold text-foreground">Sharing</h2>
        <p>
          Verified active incidents may appear publicly on the live map.
          Personal contact details are not shown on the public map.
        </p>
      </div>
    </DocumentPage>
  )
}

export { TermsPage, SupportPage, PrivacyPage }
