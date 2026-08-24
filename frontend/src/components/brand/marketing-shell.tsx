import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"

import { Logomark } from "@/components/brand/logomark"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { brandStyle } from "@/lib/brand"

import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "About", to: "/home#about" },
  { label: "How it works", to: "/home#how-it-works" },
  { label: "Terms", to: "/home#terms" },
  { label: "Privacy", to: "/privacy" },
] as const

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "About", to: "/home#about" },
      { label: "How it works", to: "/home#how-it-works" },
      { label: "Open app", to: "/" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & conditions", to: "/terms" },
      { label: "Privacy policy", to: "/privacy" },
      { label: "Help & support", to: "/support" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", to: "/signin" },
      { label: "Sign up", to: "/signup" },
    ],
  },
] as const

type MarketingShellProps = {
  children: ReactNode
}

function MarketingShell({ children }: MarketingShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className="flex min-h-svh flex-col bg-[var(--ajali-surface)] text-foreground"
      style={brandStyle}
    >
      <header className="sticky top-0 z-40 border-b border-border bg-[var(--ajali-surface)]">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <Link
            to="/home"
            className="flex items-center gap-2 text-foreground"
            aria-label="Ajali! home"
          >
            <Logomark className="h-8 w-auto sm:h-9" />
            <span className="text-base font-semibold tracking-tight sm:text-lg">
              Ajali!
            </span>
          </Link>

          <NavigationMenu className="hidden md:flex" viewport={false}>
            <NavigationMenuList className="gap-1">
              {NAV_LINKS.map((item) => (
                <NavigationMenuItem key={item.to}>
                  <NavigationMenuLink asChild>
                    <Link
                      to={item.to}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "bg-transparent font-normal"
                      )}
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden sm:inline-flex" asChild>
              <Link to="/signin">Sign in</Link>
            </Button>
            <Button className="hidden font-semibold sm:inline-flex" asChild>
              <Link to="/signup">Sign up</Link>
            </Button>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden" aria-label="Open menu">
                  Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[var(--ajali-surface)]">
                <SheetHeader>
                  <SheetTitle>Ajali! menu</SheetTitle>
                  <SheetDescription>
                    Learn about Ajali! or open the app.
                  </SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-4">
                  {NAV_LINKS.map((item) => (
                    <SheetClose key={item.to} asChild>
                      <Button
                        variant="ghost"
                        className="h-11 justify-start text-base"
                        asChild
                      >
                        <Link to={item.to}>{item.label}</Link>
                      </Button>
                    </SheetClose>
                  ))}
                  <Separator className="my-2" />
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="h-11 justify-start text-base"
                      asChild
                    >
                      <Link to="/signin">Sign in</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button className="h-11 font-semibold" asChild>
                      <Link to="/signup">Sign up</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="outline"
                      className="h-11 justify-start text-base"
                      asChild
                    >
                      <Link to="/">Open app</Link>
                    </Button>
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
          <div className="space-y-2">
            <p className="text-base font-semibold">Ajali!</p>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              See it. Report it. Respond to it. A simple way to report
              emergencies and help your community get help faster.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} className="space-y-3" aria-label={column.title}>
              <p className="text-sm font-medium">{column.title}</p>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-border">
          <p className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
            © {new Date().getFullYear()} Ajali! All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export { MarketingShell }
