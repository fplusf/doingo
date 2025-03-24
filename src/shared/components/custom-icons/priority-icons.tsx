import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
}

// Priority 1: Urgent & Important (Top-Left Red)
export function UrgentImportantIcon({ className }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('lucide', className)}
    >
      {/* Top-left - Filled Red */}
      <rect
        x="1"
        y="1"
        width="10"
        height="10"
        fill="#FF6B6B"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Top-right */}
      <rect x="13" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Bottom-left */}
      <rect x="1" y="13" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Bottom-right */}
      <rect
        x="13"
        y="13"
        width="10"
        height="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

// Priority 2: Not Urgent & Important (Top-Right Yellow)
export function NotUrgentImportantIcon({ className }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('lucide', className)}
    >
      {/* Top-left */}
      <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Top-right - Filled Yellow */}
      <rect
        x="13"
        y="1"
        width="10"
        height="10"
        fill="#FFD93D"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Bottom-left */}
      <rect x="1" y="13" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Bottom-right */}
      <rect
        x="13"
        y="13"
        width="10"
        height="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

// Priority 3: Urgent & Not Important (Bottom-Left Blue)
export function UrgentNotImportantIcon({ className }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('lucide', className)}
    >
      {/* Top-left */}
      <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Top-right */}
      <rect x="13" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Bottom-left - Filled Blue */}
      <rect
        x="1"
        y="13"
        width="10"
        height="10"
        fill="#4FB3FF"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Bottom-right */}
      <rect
        x="13"
        y="13"
        width="10"
        height="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

// Priority 4: Not Urgent & Not Important (Bottom-Right Green)
export function NotUrgentNotImportantIcon({ className }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('lucide', className)}
    >
      {/* Top-left */}
      <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Top-right */}
      <rect x="13" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Bottom-left */}
      <rect x="1" y="13" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Bottom-right - Filled Green */}
      <rect
        x="13"
        y="13"
        width="10"
        height="10"
        fill="#90EE90"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
