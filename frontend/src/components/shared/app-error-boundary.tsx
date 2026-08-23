import { Component, type ErrorInfo, type ReactNode } from "react"

import { Button } from "@/components/ui/button"

type Props = { children: ReactNode }
type State = { hasError: boolean }

class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("AppErrorBoundary", error.message, info.componentStack)
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-ajali-surface px-6 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The page hit an unexpected error. Your report data was not sent to
          the public weather or place APIs.
        </p>
        <Button
          className="font-semibold"
          onClick={() => {
            this.setState({ hasError: false })
            window.location.assign("/")
          }}
        >
          Return home
        </Button>
      </div>
    )
  }
}

export { AppErrorBoundary }
