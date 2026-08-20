import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AddReportButtonProps = {
  searchHref?: string;
  className?: string;
};

function AddReportButton({ searchHref, className }: AddReportButtonProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-10 flex items-center gap-2 px-4",
        "inset-x-0 bottom-20 justify-center",
        "md:inset-x-auto md:right-6 md:bottom-6 md:justify-end",
        className,
      )}
    >
      <Button
        className="pointer-events-auto h-12 rounded-full px-5 text-base font-bold shadow-lg shadow-primary/25"
        size="lg"
        asChild
      >
        <Link to="/report">
          <Plus data-icon="inline-start" className="size-5" />
          <span className="md:hidden">Report</span>
          <span className="hidden md:inline">Report incident</span>
        </Link>
      </Button>
      {searchHref ? (
        <Button
          className="pointer-events-auto hidden size-12 rounded-full shadow-lg shadow-primary/25 md:inline-flex"
          size="icon"
          asChild
        >
          <Link to={searchHref} aria-label="Search reports">
            <Search className="size-5" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

export { AddReportButton };
