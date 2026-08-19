import { Link } from "react-router-dom"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

function AddReportButton() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 z-10 flex justify-center px-4">
      <Button
        className="pointer-events-auto h-12 rounded-full px-6 text-base font-bold shadow-md"
        size="lg"
        asChild
      >
        <Link to="/coming-soon">
          <Plus data-icon="inline-start" className="size-5" />
          Add report
        </Link>
      </Button>
    </div>
  )
}

export { AddReportButton }
