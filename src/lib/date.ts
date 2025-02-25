import { format, parse } from 'date-fns';

// Convert Date object to ISO string
export const toISOString = (date: Date): string => {
  return date.toISOString();
};

// Format date for display in UI
export const formatDateTimeForDisplay = (isoString: string): string => {
  const date = new Date(isoString);
  return format(date, 'MMM d, h:mm a');
};

// Format just the date for display
export const formatDateForDisplay = (isoString: string): string => {
  const date = new Date(isoString);
  return format(date, 'MMM d');
};

// Format just the time for display
export const formatTimeForDisplay = (isoString: string): string => {
  const date = new Date(isoString);
  return format(date, 'HH:mm');
};

// Combine date and time into ISO string
export const combineDateAndTime = (date: Date, timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const newDate = new Date(date);
  newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  return newDate.toISOString();
};

// Parse time string to Date
export const parseTimeString = (timeString: string): Date => {
  return parse(timeString, 'HH:mm', new Date());
};
