import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  faClock,
  faLocationDot,
  faMapLocationDot,
  faShieldHalved,
  faUsers,
} from "@fortawesome/free-solid-svg-icons"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"

import { MarketingShell } from "@/components/brand/marketing-shell"
import { HeroMapShowcase } from "@/components/public/hero-map-showcase"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { FaIcon } from "@/components/ui/fa-icon"

const HOW_IT_WORKS_STEPS = [
  {
    title: "Register your account",
    body: "Create an account with your name, phone number, and email to access reporting and status tracking.",
  },
  {
    title: "Sign in",
    body: "Authenticate with your registered credentials. Sessions remain active on trusted devices.",
  },
  {
    title: "Submit a report",
    body: "From the dashboard, open Report to file a new incident when an emergency occurs.",
  },
  {
    title: "Provide incident details",
    body: "Specify the incident type, description, and location on the map or by place name.",
  },
  {
    title: "Attach evidence",
    body: "When safe to do so, upload photos or video to support verification and response planning.",
  },
  {
    title: "Track review status",
    body: "Submitted reports enter the review queue. Status updates are available in your incident list.",
  },
] as const

const HERO_STATS = [
  { label: "Time to submit", value: "< 2 min", icon: faClock },
  { label: "Cities covered", value: "5+", icon: faLocationDot },
  { label: "Operations coverage", value: "24/7", icon: faMapLocationDot },
] as const

const FLOW_STEPS: {
  title: string
  body: string
  icon: IconDefinition
}[] = [
  {
    title: "Citizens report",
    body: "Location, description, and evidence submitted from the scene.",
    icon: faUsers,
  },
  {
    title: "Operations review",
    body: "Verify reports, initiate response, resolve incidents, or close invalid cases.",
    icon: faShieldHalved,
  },
  {
    title: "Live public map",
    body: "Active response incidents are published to the community operations map.",
    icon: faMapLocationDot,
  },
]

const AUDIENCE = [
  {
    title: "For the public",
    body: "Submit structured incident reports with location, context, and supporting media. Monitor the status of your submissions through a single account.",
  },
  {
    title: "For operations",
    body: "Review incoming reports, verify legitimacy, coordinate department handoffs, and maintain a complete audit trail from intake to resolution.",
  },
] as const

function HomePage() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = hash.replace("#", "")
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [hash])

  return (
    <MarketingShell>
      <section className="border-b border-border bg-[var(--ajali-surface-muted)]">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-14 lg:py-20">
          <div className="max-w-xl space-y-6">
            <p className="text-sm font-medium text-[var(--ajali-primary)]">
              Emergency incident reporting for Kenya
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              See it. Report it. Respond to it.
            </h1>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Ajali! is a coordinated emergency reporting platform. Citizens
              file incidents with location, context, and evidence; operations
              teams verify, dispatch response, and maintain a live public map.
            </p>

            <ul className="grid gap-3 sm:grid-cols-3">
              {HERO_STATS.map((stat) => (
                <li
                  key={stat.label}
                  className="rounded-md border border-border bg-background px-3 py-2.5"
                >
                  <FaIcon
                    icon={stat.icon}
                    className="mb-1.5 text-sm text-[var(--ajali-primary)]"
                  />
                  <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-11 font-semibold" asChild>
                <Link to="/signup">Create account</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-11 font-semibold" asChild>
                <Link to="/home#how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>

          <HeroMapShowcase />
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6 sm:py-14">
          {FLOW_STEPS.map((step) => (
            <div
              key={step.title}
              className="rounded-lg border border-border bg-background p-6"
            >
              <div className="mb-3 inline-flex size-9 items-center justify-center rounded-md bg-[var(--ajali-cream)] text-[var(--ajali-primary)]">
                <FaIcon icon={step.icon} className="text-base" />
              </div>
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:py-20">
          <h2 className="text-2xl font-semibold tracking-tight">About Ajali!</h2>
          <div className="max-w-2xl space-y-4 text-base leading-7 text-muted-foreground">
            <p>
              Ajali! enables citizens across Kenya to report road incidents,
              fires, medical emergencies, and other events with precise
              location data, structured descriptions, and supporting media.
            </p>
            <p>
              Trained reviewers validate each submission. Verified incidents
              enter the response workflow, with status updates communicated
              to reporters. Personal contact details remain private on the
              public map.
            </p>
            <p>
              The platform serves both community reporters and emergency
              operations teams through a single, auditable incident record.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl px-4 sm:grid-cols-2 sm:px-6">
          {AUDIENCE.map((item, index) => (
            <div
              key={item.title}
              className={
                index === 0
                  ? "py-10 sm:pr-10"
                  : "border-t border-border py-10 sm:border-t-0 sm:border-l sm:pl-10"
              }
            >
              <h2 className="text-lg font-semibold tracking-tight">
                {item.title}
              </h2>
              <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-20 border-b border-border"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mb-10 max-w-2xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              How it works
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              From account registration to incident resolution, each stage is
              documented below. In an active emergency, begin at step 3.
            </p>
          </div>

          <ol className="grid border-t border-border sm:grid-cols-2">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="border-b border-border py-8 sm:px-8 sm:odd:pl-0 sm:even:border-l sm:even:pr-0"
              >
                <p className="text-sm tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <Button size="lg" className="h-11 font-semibold" asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="terms" className="scroll-mt-20">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:py-20">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              Terms &amp; conditions
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Review these terms before using Ajali!. Creating an account
              constitutes acceptance of this agreement.
            </p>
            <Button variant="outline" asChild>
              <Link to="/terms">Open full terms page</Link>
            </Button>
          </div>

          <div>
            <Accordion type="single" collapsible className="border-t border-border">
              <AccordionItem value="good-faith">
                <AccordionTrigger className="text-left text-sm font-medium">
                  Report only real emergencies
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-muted-foreground">
                  Use Ajali! in good faith. Do not send false, joke, or
                  misleading reports. False reports can be closed, and your
                  account may be reviewed.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="accurate-info">
                <AccordionTrigger className="text-left text-sm font-medium">
                  Give clear and honest details
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-muted-foreground">
                  Share the best location, description, and photos you can. This
                  helps responders decide what to do next. If you made a mistake
                  on a pending report, you can edit it before it is verified.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="review">
                <AccordionTrigger className="text-left text-sm font-medium">
                  How review and response work
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-muted-foreground">
                  Reports stay private until a reviewer checks them. After
                  verification, a response can begin. Only active response
                  incidents appear on the live public map.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="safety">
                <AccordionTrigger className="text-left text-sm font-medium">
                  Your safety comes first
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-muted-foreground">
                  Do not put yourself in danger to take photos or stay near a
                  scene. If you need immediate life saving help, call local
                  emergency services first, then report in Ajali! if you can.
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-10 border-t border-border pt-8">
              <h3 className="text-base font-semibold">Privacy policy</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                We collect only what is needed to verify reports and coordinate
                help: your account details, report text, location, and any
                media you choose to upload. Contact details are not shown on
                the public map.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link to="/privacy">Read the privacy policy</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

export { HomePage }
