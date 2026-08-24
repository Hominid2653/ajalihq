import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"

import { MarketingShell } from "@/components/brand/marketing-shell"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

const HOW_IT_WORKS_STEPS = [
  {
    title: "Create your account",
    body: "Open Ajali! and tap Sign up. Enter your name, phone number, and email. Choose a password you can remember.",
  },
  {
    title: "Sign in",
    body: "Use your email and password to sign in. You only need to do this once on your phone if you stay signed in.",
  },
  {
    title: "Tap Report",
    body: "When you see an emergency, open the app and tap Report. You do not need to know any special codes.",
  },
  {
    title: "Tell us what happened",
    body: "Choose the type of emergency, write a short description, and mark the place on the map. You can also type the place name.",
  },
  {
    title: "Add a photo if you can",
    body: "If it is safe, add a clear photo of the scene. Photos help responders understand the situation faster.",
  },
  {
    title: "Submit and wait for updates",
    body: "Tap Submit. A response team can review your report. You can check the status in your reports list.",
  },
] as const

const PREVIEW_ROWS = [
  {
    id: "AJL-0024",
    type: "Traffic collision",
    place: "Uhuru Highway, Nairobi",
    status: "Pending",
  },
  {
    id: "AJL-0021",
    type: "Fire",
    place: "Kisumu CBD",
    status: "In progress",
  },
  {
    id: "AJL-0018",
    type: "Medical emergency",
    place: "Nyali, Mombasa",
    status: "Verified",
  },
  {
    id: "AJL-0014",
    type: "Flooding",
    place: "Nakuru town",
    status: "Resolved",
  },
] as const

const AUDIENCE = [
  {
    title: "For the public",
    body: "Report what you see with a place, a short description, and a photo if it is safe. Track the status of your own reports without calling around for updates.",
  },
  {
    title: "For operations",
    body: "Review incoming reports, verify what is real, start a response, and close false or duplicate cases. The same record moves from first report to resolution.",
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
      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center lg:py-24">
          <div className="max-w-xl space-y-6">
            <p className="text-sm font-medium text-muted-foreground">
              Community emergency reporting for Kenya
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              See it. Report it. Respond to it.
            </h1>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Ajali! is a simple app for reporting accidents, fires, medical
              emergencies, and other incidents near you. Built so anyone can
              use it, even if you are not used to technology.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-11 font-semibold" asChild>
                <Link to="/signup">Create free account</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 font-semibold"
                asChild
              >
                <Link to="/home#how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-[var(--ajali-surface)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-medium">Operations</p>
              <p className="text-sm text-muted-foreground">Incidents</p>
            </div>
            <ul>
              {PREVIEW_ROWS.map((row, index) => (
                <li
                  key={row.id}
                  className={
                    index === PREVIEW_ROWS.length - 1
                      ? "px-4 py-3"
                      : "border-b border-border px-4 py-3"
                  }
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-sm font-medium">{row.type}</p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {row.status}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.id} · {row.place}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl px-4 sm:grid-cols-3 sm:px-6">
          <div className="py-8 sm:pr-8">
            <p className="text-sm font-medium">Citizens report</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Place, description, and photos from the scene.
            </p>
          </div>
          <div className="border-t border-border py-8 sm:border-t-0 sm:border-l sm:px-8">
            <p className="text-sm font-medium">Admins review</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Verify, start response, resolve, or close a report.
            </p>
          </div>
          <div className="border-t border-border py-8 sm:border-t-0 sm:border-l sm:pl-8">
            <p className="text-sm font-medium">The map stays current</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Only active response incidents appear on the public map.
            </p>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:py-20">
          <h2 className="text-2xl font-semibold tracking-tight">About Ajali!</h2>
          <div className="max-w-2xl space-y-4 text-base leading-7 text-muted-foreground">
            <p>
              Ajali! helps people in Kenya report emergencies quickly and
              clearly. When something happens on the road, in a market, or in
              your neighbourhood, you can send a report with the place, what
              you saw, and photos.
            </p>
            <p>
              Trained reviewers check each report. If it is real, they can
              start a response and keep the community informed. Personal phone
              numbers and emails stay private on the public map.
            </p>
            <p>
              Ajali! is for everyone: young people, older people, and anyone
              who needs a clear, step by step way to ask for help.
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
              Follow these steps one at a time. You do not need to finish them
              all at once when you first open the app. When there is an
              emergency, start from step 3.
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
              Please read these rules before you use Ajali!. Opening an account
              means you agree to them.
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
