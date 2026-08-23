import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Menu } from "lucide-react"

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
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/home"
            className="flex items-center gap-2 text-foreground"
            aria-label="Ajali! home"
          >
            <Logomark className="h-9 w-auto" />
            <span className="text-lg font-bold tracking-tight">Ajali!</span>
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
                        "bg-transparent"
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
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
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

      <footer className="border-t border-border bg-[var(--ajali-cream)]">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-lg font-bold">Ajali!</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                See it. Report it. Respond to it. A simple way to report
                emergencies and help your community get help faster.
              </p>
            </div>
            <nav className="flex flex-col gap-2 text-sm sm:items-end">
              <Button variant="link" className="h-auto p-0" asChild>
                <Link to="/home#about">About</Link>
              </Button>
              <Button variant="link" className="h-auto p-0" asChild>
                <Link to="/home#how-it-works">How it works</Link>
              </Button>
              <Button variant="link" className="h-auto p-0" asChild>
                <Link to="/terms">Terms &amp; conditions</Link>
              </Button>
              <Button variant="link" className="h-auto p-0" asChild>
                <Link to="/privacy">Privacy policy</Link>
              </Button>
              <Button variant="link" className="h-auto p-0" asChild>
                <Link to="/support">Help &amp; support</Link>
              </Button>
            </nav>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ajali! All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export { MarketingShell }
