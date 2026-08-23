import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { registerSW } from "virtual:pwa-register"
import { store } from "@/store/index"
import "./index.css"
import { AppErrorBoundary } from "@/components/shared/app-error-boundary"
import App from "./App.tsx"

registerSW({ immediate: true })
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <Provider store={store}>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
          <TooltipProvider>
            <App />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </Provider>
    </AppErrorBoundary>
  </StrictMode>,
)
