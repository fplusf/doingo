// Hex color values for each priority level
export const PRIORITY_COLORS = {
  high: '#EF4444', // Red for Urgent & Important
  medium: '#EAB308', // Yellow for Not Urgent & Important
  low: '#3B82F6', // Blue for Urgent & Not Important
  none: '#22C55E', // Green for Not Urgent & Not Important
  '': '#22C55E', // Default to green
  'not-urgent-not-important': '#22C55E',
} as const;

// Tailwind background classes for each priority level
export const PRIORITY_BG_CLASSES = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  none: 'bg-green-500',
  '': 'bg-green-500',
  'not-urgent-not-important': 'bg-green-500',
} as const;

export const EMOJI_BG = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  none: 'bg-green-500',
  '': 'bg-green-500',
  'not-urgent-not-important': 'bg-green-500',
} as const;

// Mapping from TaskPriority to NodeColor for timeline nodes
export const PRIORITY_TO_NODE_COLOR: Record<string, string> = {
  high: 'red',
  medium: 'yellow',
  low: 'blue',
  none: 'green',
  '': 'green',
  'not-urgent-not-important': 'green',
} as const;

// Human-readable labels for each priority level
export const PRIORITY_LABELS = {
  high: 'Urgent & Important',
  medium: 'Not Urgent & Important',
  low: 'Urgent & Not Important',
  none: 'Not Urgent & Not Important',
  '': 'Not Urgent & Not Important',
  'not-urgent-not-important': 'Not Urgent & Not Important',
} as const;
