import type React from "react"

import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CheckSquare, Clock } from "lucide-react"
import type { Event } from "@/lib/types"

interface EventItemProps {
  event: Event
  onClick: () => void
  onDragStart: (e: React.MouseEvent) => void
  isDragging: boolean
}

export default function EventItem({ event, onClick, onDragStart, isDragging }: EventItemProps) {
  const durationMinutes = (event.end.getTime() - event.start.getTime()) / 60000
  const heightInPixels = (durationMinutes / 60) * 48 // 48px per hour

  return (
    <div
      className={cn(
        "absolute left-0 right-1 rounded px-2 py-1 overflow-hidden cursor-pointer text-xs",
        event.color || "bg-[#1a73e8] text-white",
        isDragging && "opacity-50",
      )}
      style={{
        top: `${(event.start.getMinutes() / 60) * 48}px`,
        height: `${heightInPixels}px`,
        zIndex: isDragging ? 50 : 10,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        onDragStart(e)
      }}
    >
      <div className="font-medium truncate">{event.title}</div>
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>
          {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
        </span>
      </div>
      {event.completed && (
        <div className="flex items-center gap-1 mt-1">
          <CheckSquare className="h-3 w-3" />
          <span>Completed</span>
        </div>
      )}
    </div>
  )
}

