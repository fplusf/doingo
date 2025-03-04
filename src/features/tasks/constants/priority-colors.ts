import { TaskPriority } from '../types';

// Hex color values for each priority level
export const PRIORITY_COLORS = {
  high: '#ef4444', // red-500
  medium: '#eab308', // yellow-500
  low: '#3b82f6', // blue-500
  none: '#5c6169',
  '': '#5c6169',
  'not-urgent-not-important': '#5c6169',
} as const;

// Tailwind background classes for each priority level
export const PRIORITY_BG_CLASSES = {
  high: 'bg-red-500/90',
  medium: 'bg-yellow-500/90',
  low: 'bg-blue-500/90',
  none: 'bg-gray-500/40',
  '': 'bg-gray-500/40',
  'not-urgent-not-important': 'bg-gray-500/40',
} as const;

export const EMOJI_BG = {
  high: 'bg-red-600/90',
  medium: 'bg-yellow-600/90',
  low: 'bg-blue-600/90',
  none: 'bg-white/20',
  '': 'bg-white/20',
  'not-urgent-not-important': 'bg-white/20',
} as const;

// Mapping from TaskPriority to NodeColor for timeline nodes
export const PRIORITY_TO_NODE_COLOR: Record<TaskPriority, string> = {
  high: 'red',
  medium: 'yellow',
  low: 'blue',
  none: 'default',
  '': 'default',
  'not-urgent-not-important': 'default',
} as const;

// Human-readable labels for each priority level
export const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'None',
  '': 'None',
  'not-urgent-not-important': 'None',
} as const;
