import { z } from 'zod';

export type TaskDetailsTab = 'document' | 'both' | 'canvas';

export const weeklyCalendarSchema = z.object({
  tab: z.enum(['document', 'both', 'canvas']).default('document').optional(),
  week: z.string().default(new Date().toISOString().split('T')[0]).optional(),
  date: z.string().default(new Date().toISOString().split('T')[0]).optional(),
});

export type WeeklyCalendarSearch = z.infer<typeof weeklyCalendarSchema>;
