/**
 * Formats a duration in milliseconds to a human-readable string
 *
 * @param durationMs Duration in milliseconds
 * @returns Formatted duration string (e.g. "30m", "1h 30m", "8h")
 */
export function formatDuration(durationMs: number): string {
  if (!durationMs) return '0m';

  // Convert to minutes first
  const totalMinutes = Math.round(durationMs / (60 * 1000));

  // Calculate hours and remaining minutes
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Format the output
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}
