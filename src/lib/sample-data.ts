import { addDays, setHours, setMinutes, startOfWeek } from "date-fns"
import type { Event } from "./types"

export function generateSampleEvents(baseDate: Date): Event[] {
  const startOfWeekDate = startOfWeek(baseDate, { weekStartsOn: 0 })
  const events: Event[] = []

  // Add lunch events
  for (let i = 2; i <= 5; i++) {
    const day = addDays(startOfWeekDate, i)
    events.push({
      id: `lunch-${i}`,
      title: "Lunch",
      start: setHours(setMinutes(day, 0), 12),
      end: setHours(setMinutes(day, 0), 13),
      color: "bg-[#d06102] text-white",
    })
  }

  // Add afternoon catch up events
  for (let i = 1; i <= 5; i++) {
    const day = addDays(startOfWeekDate, i)
    events.push({
      id: `catchup-${i}`,
      title: "Afternoon Catch Up, 4:30pm",
      start: setHours(setMinutes(day, 30), 16),
      end: setHours(setMinutes(day, 0), 17),
      color: "bg-[#8e24aa] text-white",
    })
  }

  // Add review events
  for (let i = 1; i <= 5; i++) {
    const day = addDays(startOfWeekDate, i)
    events.push({
      id: `review-${i}`,
      title: "Review my day and plan ahead, 5pm",
      start: setHours(setMinutes(day, 0), 17),
      end: setHours(setMinutes(day, 30), 17),
      color: "bg-[#4285f4] text-white",
    })
  }

  // Add specific events
  events.push({
    id: "weekly-review",
    title: "Do a weekly review of my tasks and goals",
    start: setHours(setMinutes(startOfWeekDate, 0), 9),
    end: setHours(setMinutes(startOfWeekDate, 0), 10),
    color: "bg-[#4285f4] text-white",
  })

  events.push({
    id: "challenge",
    title: "Challenge accepted. Here's how I would approach it",
    start: setHours(setMinutes(addDays(startOfWeekDate, 4), 0), 9),
    end: setHours(setMinutes(addDays(startOfWeekDate, 4), 0), 10),
    color: "bg-[#f6bf26] text-[#202124]",
  })

  events.push({
    id: "backup",
    title: "Backup Macbook Data!",
    start: setHours(setMinutes(addDays(startOfWeekDate, 5), 0), 10),
    end: setHours(setMinutes(addDays(startOfWeekDate, 0), 0), 11),
    color: "bg-[#e67c73] text-white",
  })

  events.push({
    id: "pending-tasks",
    title: "3 pending tasks",
    start: setHours(setMinutes(addDays(startOfWeekDate, 6), 0), 10),
    end: setHours(setMinutes(addDays(startOfWeekDate, 6), 0), 11),
    color: "bg-[#4285f4] text-white",
  })

  return events
}

