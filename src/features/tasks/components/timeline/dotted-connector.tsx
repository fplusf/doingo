import React from 'react';

interface DottedConnectorProps {
  startColor: string;
  endColor: string;
  segmentHeight: number;
  // Remove unused props
  // isLongGap?: boolean;
  // timeGap?: number; // Optional gap duration in milliseconds
}

// Define some constants for gap durations - keep SEVEN_HOURS for ellipsis logic
// const ONE_HOUR_IN_MS = 60 * 60 * 1000;
// const THREE_HOURS_IN_MS = 3 * 60 * 60 * 1000;
const SEVEN_HOURS_IN_MS = 7 * 60 * 60 * 1000; // Keep for ellipsis

/**
 * Renders a dotted connector line using CSS masking for cleaner appearance
 * with a gradient between startColor and endColor
 */
export const DottedConnector: React.FC<DottedConnectorProps> = ({
  startColor,
  endColor,
  segmentHeight,
  // Remove unused props
  // isLongGap = false,
  // timeGap = 0,
}) => {
  // If height is too small, don't render
  if (segmentHeight < 10) {
    return null;
  }

  // Use a fixed spacing for consistent dot density
  const spacing = 7;

  // Keep dot size consistent
  const dotSize = 3;
  const period = dotSize + spacing;

  // Determine if ellipsis should be shown based on height
  // (Removed dependency on timeGap/isLongGap)
  const showEllipsis = segmentHeight > 200; // Show ellipsis for very tall segments

  return (
    <div
      className="absolute left-1/2 h-full w-[3px] -translate-x-1/2"
      style={{
        background: `linear-gradient(to bottom, ${startColor}, ${endColor})`,
        WebkitMaskImage: `repeating-linear-gradient(
          to bottom, 
          rgba(0,0,0,1) 0px, 
          rgba(0,0,0,1) ${dotSize}px, 
          rgba(0,0,0,0) ${dotSize}px, 
          rgba(0,0,0,0) ${period}px
        )`,
        maskImage: `repeating-linear-gradient(
          to bottom, 
          rgba(0,0,0,1) 0px, 
          rgba(0,0,0,1) ${dotSize}px, 
          rgba(0,0,0,0) ${dotSize}px, 
          rgba(0,0,0,0) ${period}px
        )`,
        height: `${segmentHeight}px`,
      }}
    >
      {/* For very long gaps (based on height), add ellipsis in the middle */}
      {showEllipsis && (
        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 gap-1 bg-background px-1">
          <div className="h-1.5 w-1.5 rounded-full bg-gray-400 opacity-70"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-gray-400 opacity-70"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-gray-400 opacity-70"></div>
        </div>
      )}
    </div>
  );
};
