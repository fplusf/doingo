import { z } from 'zod';

export const weeklyCalendarSchema = z.object({
  week: z.string().default(new Date().toISOString().split('T')[0]).optional(),
  date: z.string().default(new Date().toISOString().split('T')[0]).optional(),
});

export type WeeklyCalendarSearch = z.infer<typeof weeklyCalendarSchema>;
