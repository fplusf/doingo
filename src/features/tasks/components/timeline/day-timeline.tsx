import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

type TimelineHourItem = {
  type: 'hour';
  minutes: number;
  time: string;
};

type TimelineSkipItem = {
  type: 'skip';
  startMinutes: number;
  endMinutes: number;
};

type TimelineItem = TimelineHourItem | TimelineSkipItem;

export interface TimelineProps {
  startTime?: string; // Format: "HH:MM"
  endTime?: string; // Format: "HH:MM"
  skipRanges?: Array<{
    start: string; // Format: "HH:MM"
    end: string; // Format: "HH:MM"
  }>;
  className?: string;
  hourHeight?: number; // Height in pixels for each hour
  lineWidth?: number; // Width of the horizontal lines in pixels
  waveRadius?: number; // Radius of influence for the wave effect
  waveMultiplier?: number; // Maximum multiplier for the wave effect
}

type LinePosition = {
  type: 'hour' | 'skip';
  index: number;
  subIndex?: number;
  y: number; // Y position of the line
  groupIndex?: number;
};

// TODO: Use it once we need timeline by hours
// 📌 The pixels here must by fully dynamic depending on the entire height of the TasksTimline and then it stretch to that height and divides equaylly to the number of hours
export function DayTimeline({
  startTime = '07:00',
  endTime = '22:00',
  skipRanges = [],
  className,
  hourHeight = 120, // 📌 The pixels here must by fully dynamic depending on the entire height of the TasksTimline and then it stretch to that height and divides equaylly to the number of hours
  lineWidth = 40,
  waveRadius = 3, // Affects 3 items on each side by default
  waveMultiplier = 2, // Maximum size multiplier
}: TimelineProps) {
  const [clickedLines, setClickedLines] = useState<Set<string>>(new Set());
  const [hoveredItemInfo, setHoveredItemInfo] = useState<{
    type: 'hour' | 'skip';
    index: number;
    subIndex?: number;
    groupIndex?: number;
  } | null>(null);

  // Track mouse position and component element
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseY, setMouseY] = useState<number | null>(null);
  const [linePositions, setLinePositions] = useState<LinePosition[]>([]);

  // Parse start and end times
  const parseTime = (timeStr: string): { hours: number; minutes: number } => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  };

  const start = parseTime(startTime);
  const end = parseTime(endTime);

  // Calculate total minutes for a time
  const timeToMinutes = (time: { hours: number; minutes: number }): number => {
    return time.hours * 60 + time.minutes;
  };

  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  // Format time for display
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Process skip ranges
  const processedSkipRanges = skipRanges.map((range) => ({
    startMinutes: timeToMinutes(parseTime(range.start)),
    endMinutes: timeToMinutes(parseTime(range.end)),
  }));

  // Generate timeline items
  const generateTimelineItems = (): TimelineItem[] => {
    const items: TimelineItem[] = [];
    let currentMinutes = startMinutes;

    while (currentMinutes <= endMinutes) {
      // Check if current time is in a skip range
      const skipRange = processedSkipRanges.find(
        (range) => currentMinutes >= range.startMinutes && currentMinutes < range.endMinutes,
      );

      if (skipRange) {
        // Add skip indicator
        items.push({
          type: 'skip',
          startMinutes: currentMinutes,
          endMinutes: skipRange.endMinutes,
        });
        currentMinutes = skipRange.endMinutes;
      } else {
        // Add regular hour marker if minutes are 0
        if (currentMinutes % 60 === 0) {
          items.push({
            type: 'hour',
            minutes: currentMinutes,
            time: formatTime(currentMinutes),
          });
        }
        currentMinutes += 60;
      }
    }

    return items;
  };

  // Calculate width based on distance from hovered item (wave effect)
  // Note: This now only applies to hour items
  const calculateWaveWidth = (
    itemIndex: number,
    defaultWidth: number,
    maxWidth: number,
  ): number => {
    if (!hoveredItemInfo || hoveredItemInfo.type !== 'hour') return defaultWidth;

    const distance = Math.abs(itemIndex - hoveredItemInfo.index);
    if (distance === 0) return maxWidth; // Hovered item gets max width
    if (distance <= waveRadius) {
      // Calculate decreasing effect based on distance
      const factor = 1 - distance / (waveRadius + 1);
      return defaultWidth + (maxWidth - defaultWidth) * factor;
    }

    return defaultWidth;
  };

  // Handle mouse movement over the container
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    // Get mouse position relative to container
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setMouseY(y);

    // Find closest HOUR line to current mouse position
    // We now only consider hour lines for the animation
    if (linePositions.length > 0) {
      let closestHourLine: LinePosition | null = null;
      let minDistance = Infinity;

      // Only consider hour lines for animation
      const hourLinePositions = linePositions.filter((line) => line.type === 'hour');

      for (const line of hourLinePositions) {
        const distance = Math.abs(line.y - y);
        if (distance < minDistance) {
          minDistance = distance;
          closestHourLine = line;
        }
      }

      if (closestHourLine) {
        setHoveredItemInfo({
          type: closestHourLine.type,
          index: closestHourLine.index,
          subIndex: closestHourLine.subIndex,
          groupIndex: closestHourLine.groupIndex,
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setMouseY(null);
    setHoveredItemInfo(null);
  };

  // Register line positions for hover detection
  const registerLinePosition = (
    type: 'hour' | 'skip',
    index: number,
    subIndex: number | undefined,
    element: HTMLElement,
    groupIndex?: number,
  ) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const y = elementRect.top + elementRect.height / 2 - containerRect.top;

    setLinePositions((prev) => {
      // Check if this line position already exists
      const exists = prev.some(
        (pos) => pos.type === type && pos.index === index && pos.subIndex === subIndex,
      );

      if (exists) return prev;

      return [...prev, { type, index, subIndex, y, groupIndex }];
    });
  };

  // Update line positions on resize
  useEffect(() => {
    const updateLinePositions = () => {
      setLinePositions([]); // Reset positions, they will be re-registered on render
    };

    window.addEventListener('resize', updateLinePositions);
    return () => {
      window.removeEventListener('resize', updateLinePositions);
    };
  }, []);

  const timelineItems = generateTimelineItems();

  return (
    <div
      ref={containerRef}
      className={cn('w-100 relative z-50 flex flex-col text-gray-300', className)}
      style={{ minHeight: `${hourHeight * Math.ceil((endMinutes - startMinutes) / 60)}px` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {timelineItems.map((item, index) => {
        if (item.type === 'hour') {
          const lineId = `hour-${index}`;
          const isClicked = clickedLines.has(lineId);
          const baseWidth = lineWidth;
          const maxWidth = 80;

          // Calculate the wave-effect width
          const waveWidth = calculateWaveWidth(index, baseWidth, maxWidth);
          const expandedWidth = isClicked
            ? `${maxWidth}px`
            : hoveredItemInfo
              ? `${waveWidth}px`
              : `${baseWidth}px`;

          return (
            <div
              key={index}
              className="relative flex items-center"
              style={{ height: `${hourHeight}px` }}
            >
              <div className="flex items-center">
                <button
                  className="relative border-0 bg-transparent p-0 outline-none"
                  ref={(el) => el && registerLinePosition('hour', index, undefined, el)}
                  aria-label={`Toggle time line ${item.time}`}
                  style={{ paddingTop: '12px', paddingBottom: '12px' }}
                >
                  <div
                    className={cn('h-px bg-gray-600 transition-all duration-300 ease-in-out', {
                      'bg-red-400': index === 0,
                      'bg-blue-400': index === timelineItems.length - 1,
                    })}
                    style={{
                      width: expandedWidth,
                    }}
                  ></div>
                </button>
                <span className="ml-2 text-xs font-medium text-gray-500">{item.time}</span>
              </div>
            </div>
          );
        } else if (item.type === 'skip') {
          const skipDuration = (item.endMinutes - item.startMinutes) / 60; // Duration in hours
          const skipHeight = Math.min(skipDuration * 20, 60); // Cap the height at 60px
          const numberOfLines = Math.max(1, Math.min(Math.ceil(skipDuration), 5)); // Show 1-5 lines based on duration

          // Fixed width for free slot lines - no animation
          const skipLineWidth = 32;

          return (
            <div
              key={index}
              className="relative flex flex-col items-start justify-center"
              style={{ height: `${skipHeight}px` }}
            >
              <div className="flex items-center">
                <div className="flex flex-col gap-3">
                  {[...Array(numberOfLines)].map((_, i) => {
                    return (
                      <button
                        key={i}
                        className="relative border-0 bg-transparent p-0 outline-none"
                        aria-label={`Toggle skip line ${i + 1}`}
                        ref={(el) => el && registerLinePosition('skip', index, i, el, index)}
                      >
                        <div
                          className="h-px bg-gray-700"
                          style={{
                            width: `${skipLineWidth}px`,
                          }}
                        ></div>
                      </button>
                    );
                  })}
                </div>
                <span className="ml-2 text-[10px] font-medium text-gray-600">
                  Free Slot{numberOfLines > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
