import { twMerge } from 'tailwind-merge';

// Default background colors for each category
const categoryColors = {
  work: 'bg-blue-100 dark:bg-blue-900/30',
  passion: 'bg-orange-100 dark:bg-orange-900/30',
  play: 'bg-green-100 dark:bg-green-900/30',
};

export const getEmojiBackground = (emoji: string | undefined, category: string): string => {
  const bgColor = categoryColors[category as keyof typeof categoryColors];
  return twMerge('bg-opacity-15 hover:bg-opacity-25', bgColor);
};
