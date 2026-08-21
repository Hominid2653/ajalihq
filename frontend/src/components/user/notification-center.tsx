import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { markAsRead } from "../../lib/store";
import type { RootState } from "../../lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Bell, AlertTriangle, CheckCircle, Eye, EyeOff } from "lucide-react";

/**
 * Notification Center component embedded in the citizen/admin dashboard header.
 * Interacts directly with Redux Toolkit state to remain consistent across navigation views.
 */
export const NotificationCenter: React.FC = () => {
  const dispatch = useDispatch();
  
  // Select notification data arrays and live counters straight from the Redux store
  const { items: notifications, unreadCount } = useSelector(
    (state: RootState) => state.notifications
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative border-slate-200">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="mr-4 w-80 rounded-lg border border-slate-100 bg-white shadow-xl align-end sm:w-96">
        <DropdownMenuLabel className="flex items-center justify-between p-4 font-semibold text-slate-800">
          <span>Incident Updates</span>
          <Badge variant="secondary" className="font-medium">
            {unreadCount} New
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No new alerts or incident updates.
            </div>
          ) : (
            notifications.map((item) => (
              <DropdownMenuItem
                key={item.id}
                // Dispatch action globally to synchronize other components instantly
                onClick={() => dispatch(markAsRead(item.id))}
                className={`flex cursor-pointer items-start gap-3 border-b border-slate-50 p-4 transition-colors ${
                  !item.isRead ? "bg-amber-50/40 hover:bg-amber-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="mt-0.5">
                  {item.statusUpdate === "rejected" ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : item.statusUpdate === "resolved" || item.statusUpdate === "closed" ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Bell className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${!item.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                      {item.title}
                    </p>
                    {!item.isRead ? (
                      <EyeOff className="h-3 w-3 text-amber-500" />
                    ) : (
                      <Eye className="h-3 w-3 text-slate-300" />
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs text-slate-500">{item.message}</p>
                  <p className="text-[10px] font-light text-slate-400">{item.timestamp}</p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
