import React from 'react';

interface DottedConnectorProps {
  startColor: string;
  endColor: string;
  segmentHeight: number;
  isLongGap?: boolean;
  timeGap?: number; // Optional gap duration in milliseconds
}

// Define some constants for gap durations
const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const THREE_HOURS_IN_MS = 3 * 60 * 60 * 1000;
const SEVEN_HOURS_IN_MS = 7 * 60 * 60 * 1000;

/**
 * Renders a dotted connector line using CSS masking for cleaner appearance
 * with a gradient between startColor and endColor
 */
export const DottedConnector: React.FC<DottedConnectorProps> = ({
  startColor,
  endColor,
  segmentHeight,
  isLongGap = false,
  timeGap = 0,
}) => {
  // If height is too small, don't render
  if (segmentHeight < 10) {
    return null;
  }

  // Calculate dot spacing based on gap duration
  // The longer the gap, the smaller the spacing (more dots shown)
  let spacing: number;

  if (timeGap <= 0) {
    // Default case when timeGap is not provided or invalid
    spacing = isLongGap ? 4 : 10;
  } else if (timeGap >= SEVEN_HOURS_IN_MS) {
    // Very long gaps (7+ hours): very small spacing = many dots
    spacing = 3;
  } else if (timeGap >= THREE_HOURS_IN_MS) {
    // Long gaps (3-7 hours): small spacing
    spacing = 4;
  } else if (timeGap >= ONE_HOUR_IN_MS) {
    // Medium gaps (1-3 hours): medium spacing
    spacing = 7;
  } else {
    // Short gaps (< 1 hour): large spacing = fewer dots
    spacing = 10;
  }

  // Keep dot size consistent
  const dotSize = 3;
  const period = dotSize + spacing;

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
        opacity: 0.85,
        height: `${segmentHeight}px`,
      }}
    >
      {/* For very long gaps, add ellipsis in the middle */}
      {(isLongGap || timeGap >= SEVEN_HOURS_IN_MS) && segmentHeight > 200 && (
        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 gap-1 bg-background px-1">
          <div className="h-1.5 w-1.5 rounded-full bg-gray-400 opacity-70"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-gray-400 opacity-70"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-gray-400 opacity-70"></div>
        </div>
      )}
    </div>
  );
};
