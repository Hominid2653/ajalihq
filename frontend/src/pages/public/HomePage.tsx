import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"

import { MarketingShell } from "@/components/brand/marketing-shell"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

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
      <section className="bg-[var(--ajali-cream)]">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-14 sm:px-6 sm:py-20">
          <Badge variant="secondary" className="w-fit text-sm">
            Community emergency reporting
          </Badge>
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Ajali!
            </h1>
            <p className="text-lg text-muted-foreground text-pretty sm:text-xl">
              A simple app for reporting accidents, fires, medical emergencies,
              and other incidents near you. Built so anyone can use it, even if
              you are not used to technology.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-12 font-bold" asChild>
              <Link to="/signup">Create free account</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 font-bold"
              asChild
            >
              <Link to="/home#how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-20 bg-[var(--ajali-surface)]">
        <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">About Ajali!</h2>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Ajali! helps people in Kenya report emergencies quickly and clearly.
              When something happens on the road, in a market, or in your
              neighbourhood, you can send a report with the place, what you saw,
              and photos.
            </p>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Trained reviewers check each report. If it is real, they can start
              a response and keep the community informed. Personal phone numbers
              and emails stay private on the public map.
            </p>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Ajali! is for everyone: young people, older people, and anyone who
              needs a clear, step by step way to ask for help.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      <section
        id="how-it-works"
        className="scroll-mt-20 bg-[var(--ajali-surface-muted)]"
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="mb-8 max-w-2xl space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Follow these steps one at a time. You do not need to finish them
              all at once when you first open the app. When there is an
              emergency, start from step 3.
            </p>
          </div>

          <ol className="grid gap-4">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <li key={step.title}>
                <Card className="bg-[var(--ajali-surface)] ring-border/60">
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <Badge className="mt-0.5 size-8 shrink-0 items-center justify-center rounded-full px-0 text-sm font-bold">
                      {index + 1}
                    </Badge>
                    <div className="space-y-1.5">
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                      <CardDescription className="text-base leading-7 text-muted-foreground">
                        {step.body}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ol>

          <div className="mt-8">
            <Button size="lg" className="h-12 font-bold" asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      <section id="terms" className="scroll-mt-20 bg-[var(--ajali-surface)]">
        <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="mb-8 max-w-3xl space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">
              Terms &amp; conditions
            </h2>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Please read these rules before you use Ajali!. Opening an account
              means you agree to them. The full legal text also lives on its own
              page if you want to share or print it.
            </p>
            <Button variant="outline" asChild>
              <Link to="/terms">Open full terms page</Link>
            </Button>
          </div>

          <Accordion
            type="single"
            collapsible
            className="rounded-xl bg-[var(--ajali-cream)] px-4 ring-1 ring-border/60"
          >
            <AccordionItem value="good-faith">
              <AccordionTrigger className="text-left text-base font-semibold">
                Report only real emergencies
              </AccordionTrigger>
              <AccordionContent className="text-base leading-7 text-muted-foreground">
                Use Ajali! in good faith. Do not send false, joke, or misleading
                reports. False reports can be closed, and your account may be
                reviewed.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="accurate-info">
              <AccordionTrigger className="text-left text-base font-semibold">
                Give clear and honest details
              </AccordionTrigger>
              <AccordionContent className="text-base leading-7 text-muted-foreground">
                Share the best location, description, and photos you can. This
                helps responders decide what to do next. If you made a mistake
                on a pending report, you can edit it before it is verified.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="review">
              <AccordionTrigger className="text-left text-base font-semibold">
                How review and response work
              </AccordionTrigger>
              <AccordionContent className="text-base leading-7 text-muted-foreground">
                Reports stay private until a reviewer checks them. After
                verification, a response can begin. Only active response
                incidents appear on the live public map.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="safety">
              <AccordionTrigger className="text-left text-base font-semibold">
                Your safety comes first
              </AccordionTrigger>
              <AccordionContent className="text-base leading-7 text-muted-foreground">
                Do not put yourself in danger to take photos or stay near a
                scene. If you need immediate life saving help, call local
                emergency services first, then report in Ajali! if you can.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-10 max-w-3xl space-y-3 rounded-xl bg-[var(--ajali-cream)] p-6 ring-1 ring-border/60">
            <h3 className="text-xl font-bold">Privacy policy</h3>
            <p className="text-base leading-7 text-muted-foreground">
              We collect only what is needed to verify reports and coordinate
              help: your account details, report text, location, and any media
              you choose to upload. Contact details are not shown on the public
              map.
            </p>
            <Button variant="outline" asChild>
              <Link to="/privacy">Read the privacy policy</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

export { HomePage }
