import { z } from 'zod';

export type TaskDetailsTab = 'document' | 'both' | 'canvas';

export type OverlayType = 'stats' | 'task-details';

export const weeklyCalendarSchema = z.object({
  tab: z.enum(['document', 'both', 'canvas']).default('document').optional(),
  week: z.string().default(new Date().toISOString().split('T')[0]).optional(),
  date: z.string().default(new Date().toISOString().split('T')[0]).optional(),
});

export type WeeklyCalendarSearch = z.infer<typeof weeklyCalendarSchema>;

export const TabEnum = z.enum(['document', 'both', 'canvas']).default('both');

export const globalSearchParamsSchema = z.object({
  tab: z.optional(TabEnum),
});

export const tasksSearchParamsSchema = z.object({
  week: z.optional(z.string()),
  date: z.optional(z.string()),
  highlight: z.optional(z.string()),
  taskId: z.optional(z.string()),
  tab: z.optional(TabEnum),
  overlay: z.optional(z.enum(['stats', 'task-details'])),
});
