import React from "react";
import { Check, Clock, AlertOctagon, ShieldAlert, Flag } from "lucide-react";

type IncidentStatus = "received" | "under investigation" | "rejected" | "resolved" | "closed";

interface StatusTimelineProps {
  currentStatus: IncidentStatus;
}

/**
 * A highly interactive step visualizer showing the exact progress step of a reported accident.
 * Standardizes states: Received ➔ Under Investigation ➔ Resolved/Rejected.
 */
export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus }) => {
  const steps: { label: string; value: IncidentStatus; desc: string }[] = [
    { label: "Received", value: "received", desc: "Alert broadcasted successfully" },
    { label: "Investigating", value: "under investigation", desc: "First responders validating site data" },
    { label: "Resolved", value: "resolved", desc: "Scene managed and cleared" },
  ];

  const isRejected = currentStatus === "rejected";
  const getStepIndex = (status: IncidentStatus) => {
    if (status === "received") return 0;
    if (status === "under investigation") return 1;
    if (status === "resolved" || status === "closed") return 2;
    return -1; // Fallback or rejected layout handle
  };

  const activeIndex = getStepIndex(currentStatus);

  if (isRejected) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 w-full">
        <AlertOctagon className="h-6 w-6 text-red-600 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-red-900">Incident Request Flagged as False Claim</h4>
          <p className="text-xs text-red-700">Appropriate authorities reviewed this submission and categorized it as invalid or unverified.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-2">
      <div className="flex items-center justify-between relative w-full">
        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex || currentStatus === "resolved" || currentStatus === "closed";
          const isActive = idx === activeIndex;

          return (
            <div key={step.value} className="flex flex-col items-center flex-1 relative z-10">
              {/* Connector Lines */}
              {idx !== 0 && (
                <div 
                  className={`absolute top-4 left-[-50%] right-[50%] h-0.5 -z-10 transition-colors duration-300 ${
                    idx <= activeIndex ? "bg-emerald-500" : "bg-slate-200"
                  }`} 
                />
              )}

              {/* Progress Node Point */}
              <div 
                className={`h-9 w-9 rounded-full flex items-center justify-center transition-all border-2 ${
                  isCompleted 
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" 
                    : isActive 
                    ? "bg-white border-amber-500 text-amber-500 animate-pulse shadow" 
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : isActive ? (
                  <Clock className="h-4 w-4" />
                ) : idx === 1 ? (
                  <ShieldAlert className="h-4 w-4" />
                ) : (
                  <Flag className="h-4 w-4" />
                )}
              </div>

              {/* Step Descriptions Text */}
              <span className={`text-xs font-semibold mt-2 ${isActive ? "text-amber-600" : isCompleted ? "text-emerald-600" : "text-slate-500"}`}>
                {step.label}
              </span>
              <span className="text-[10px] text-slate-400 text-center px-1 hidden sm:block font-light mt-0.5">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
