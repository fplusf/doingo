import React from 'react';
import {
  Timeline as MuiTimeline,
  TimelineItem as MuiTimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import { styled } from '@mui/material/styles';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import './timeline.css';

// Styled components to match the existing UI
const StyledTimeline = styled(MuiTimeline)({
  marginLeft: '20px',
  padding: 0,
});

const StyledTimelineItem = styled(MuiTimelineItem)({
  '&:before': {
    display: 'none',
  },
  minHeight: '50px',
  padding: 0,
  '&:last-child .MuiTimelineConnector-root': {
    display: 'none',
  },
  '& .MuiTimelineSeparator-root': {
    width: '2px',
    minHeight: '50px',
    position: 'relative',
  },
  '& .MuiTimelineConnector-root': {
    backgroundColor: '#374151',
    position: 'absolute',
    width: '2px',
    left: '24px',
    top: '35px',
  },
});

export interface CustomTimelineProps {
  children: React.ReactNode;
  className?: string;
  pixelsPerMinute?: number;
}

export const CustomTimeline = ({
  children,
  className,
  pixelsPerMinute = 2,
  ...props
}: CustomTimelineProps) => {
  // Convert children to array to access adjacent items
  const childrenArray = React.Children.toArray(children);

  return (
    <StyledTimeline className={cn('custom-timeline', className)} {...props}>
      {childrenArray.map((child, index) => {
        if (React.isValidElement<CustomTimelineItemProps>(child)) {
          // Pass the next item's start time to the current item
          const nextStartTime =
            index < childrenArray.length - 1 &&
            React.isValidElement<CustomTimelineItemProps>(childrenArray[index + 1])
              ? (childrenArray[index + 1] as React.ReactElement<CustomTimelineItemProps>).props
                  .startTime
              : undefined;

          return React.cloneElement(child, {
            ...child.props,
            nextStartTime,
            pixelsPerMinute,
            key: index,
          });
        }
        return child;
      })}
    </StyledTimeline>
  );
};

export interface CustomTimelineItemProps {
  children: React.ReactNode;
  dotColor?: string;
  time?: string;
  startTime?: Date;
  nextStartTime?: Date;
  pixelsPerMinute?: number;
  className?: string;
  completed?: boolean;
  strikethrough?: boolean;
}

export const CustomTimelineItem = ({
  children,
  dotColor = '#3B82F6',
  time,
  startTime,
  nextStartTime,
  pixelsPerMinute = 2,
  className,
  completed = false,
  strikethrough = false,
  ...props
}: CustomTimelineItemProps) => {
  const lineHeight = React.useMemo(() => {
    if (!startTime || !nextStartTime) return 70; // default height

    // Calculate time difference in minutes
    const timeDiffMinutes = (nextStartTime.getTime() - startTime.getTime()) / (1000 * 60);
    const timeDiffHours = timeDiffMinutes / 60;

    // Different height thresholds based on duration
    if (timeDiffHours > 3) {
      return 170; // Max height for tasks longer than 3 hours
    } else if (timeDiffHours >= 1) {
      return 100; // Medium height for tasks between 1-3 hours
    } else {
      // For tasks less than 1 hour, use standard size with some proportional scaling
      return Math.max(70, Math.min(85, (timeDiffMinutes * pixelsPerMinute) / 2));
    }
  }, [startTime, nextStartTime, pixelsPerMinute]);

  return (
    <StyledTimelineItem
      className={cn(
        'timeline-item-wrapper',
        className,
        strikethrough && 'text-gray-500 line-through',
      )}
      sx={{
        minHeight: lineHeight ? `${lineHeight}px` : '50px',
      }}
      {...props}
    >
      <TimelineSeparator>
        <TimelineDot
          sx={{
            width: '12px',
            height: '12px',
            margin: '14px 0 0 19px',
            padding: 0,
            backgroundColor: dotColor,
            boxShadow: 'none',
            position: 'relative',
            zIndex: 1,
          }}
        />
        <TimelineConnector
          sx={{
            width: '2px',
            backgroundColor: '#374151',
            height: lineHeight ? `${lineHeight - 32}px` : 'calc(100% - 32px)',
            transition: 'height 0.3s ease-in-out',
            position: 'absolute',
            left: '25px',
            top: '32px',
          }}
        />
      </TimelineSeparator>
      <TimelineContent
        sx={{
          padding: '0 0 0 60px',
          width: 'calc(100% - 80px)',
          height: '100%',
        }}
      >
        <div className="flex w-full flex-col">
          {time && <div className="mb-1 text-sm text-gray-400">{time}</div>}
          <div className="flex w-full items-start justify-between">
            <div className="flex-grow">{children}</div>
            <div
              className={cn(
                'ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-600',
                completed && 'border-green-500 bg-green-500',
              )}
            >
              {completed && <Check className="h-4 w-4 text-white" />}
            </div>
          </div>
        </div>
      </TimelineContent>
    </StyledTimelineItem>
  );
};
