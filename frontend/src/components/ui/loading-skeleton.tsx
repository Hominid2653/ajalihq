import * as React from "react";

import { cn } from "../../lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "./card";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/**
 * A reusable loading skeleton layout for fetching list items or card contents.
 * Provides micro-animations to satisfy perceived performance metrics.
 */
export const IncidentCardSkeleton: React.FC = () => {
  return (
    <Card className="w-full mb-4 opacity-75">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        {/* Simulates user avatar or status icon */}
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          {/* Simulates report title */}
          <Skeleton className="h-4 w-2/3" />
          {/* Simulates timestamp */}
          <Skeleton className="h-3 w-1/4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Simulates textual description */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        {/* Simulates lower action items/badges */}
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-8 w-24 rounded" />
      </CardFooter>
    </Card>
  );
};

/**
 * Global Grid or List Wrapper for displaying multiple loading items
 */
export const IncidentFeedSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-2 w-full max-w-xl mx-auto">
      <IncidentCardSkeleton />
      <IncidentCardSkeleton />
      <IncidentCardSkeleton />
    </div>
  );
};

export { Skeleton };
