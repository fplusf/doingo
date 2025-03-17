// Hex color values for each priority level
export const PRIORITY_COLORS = {
  high: '#E57373', // Red for Rise and Shine
  medium: '#FFCA28', // Yellow for Fix Trigger Issue
  low: '#42A5F5', // Blue for New Event, Last Task
  none: '#66BB6A', // Green for Daily Meditation, Overlapping Task
  '': '#66BB6A', // Green for Daily Meditation, Overlapping Task
  'not-urgent-not-important': '#66BB6A', // Green for Daily Meditation, Overlapping Task
} as const;

// Tailwind background classes for each priority level
export const PRIORITY_BG_CLASSES = {
  high: 'bg-red-400/90',
  medium: 'bg-yellow-400/90',
  low: 'bg-blue-400/90',
  none: 'bg-gray-500/40', // Keep gray background
  '': 'bg-gray-500/40', // Keep gray background
  'not-urgent-not-important': 'bg-gray-500/40', // Keep gray background
} as const;

export const EMOJI_BG = {
  high: 'bg-red-400/90',
  medium: 'bg-yellow-400/90',
  low: 'bg-blue-400/90',
  none: 'bg-white/20',
  '': 'bg-white/20',
  'not-urgent-not-important': 'bg-white/20',
} as const;

// Mapping from TaskPriority to NodeColor for timeline nodes
export const PRIORITY_TO_NODE_COLOR: Record<string, string> = {
  high: 'red',
  medium: 'yellow',
  low: 'blue',
  none: 'green', // Update to green
  '': 'green', // Update to green
  'not-urgent-not-important': 'green', // Update to green
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
