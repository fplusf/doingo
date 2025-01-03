import {
  Timeline as MuiTimeline,
  TimelineItem as MuiTimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { TaskPriority } from '@/store/tasks.store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import './timeline.css';

interface PriorityColors {
  high: string;
  medium: string;
  low: string;
  none: string;
}

interface PriorityLabels {
  high: string;
  medium: string;
  low: string;
  none: string;
}

const PRIORITY_COLORS: PriorityColors = {
  high: '#ef4444', // text-red-500
  medium: '#eab308', // text-yellow-500
  low: '#3b82f6', // text-blue-500
  none: '#64748b', // text-slate-500
};

const PRIORITY_LABELS: PriorityLabels = {
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Low Priority',
  none: 'No Priority',
};

interface CustomTimelineItemProps {
  children: React.ReactNode;
  time: string;
  startTime: Date;
  nextStartTime: Date;
  dotColor: TaskPriority;
  completed?: boolean;
  strikethrough?: boolean;
  onPriorityChange?: (priority: TaskPriority) => void;
}

interface CustomTimelineProps {
  children: React.ReactNode;
}

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

export const CustomTimelineItem = ({
  children,
  time,
  startTime,
  nextStartTime,
  dotColor,
  completed = false,
  strikethrough = false,
  onPriorityChange,
}: CustomTimelineItemProps) => {
  const timeDiffMinutes = React.useMemo(() => {
    return (nextStartTime.getTime() - startTime.getTime()) / (1000 * 60);
  }, [startTime, nextStartTime]);

  const lineHeight = React.useMemo(() => {
    const timeDiffHours = timeDiffMinutes / 60;
    if (timeDiffHours > 3) {
      return 170; // Max height for tasks longer than 3 hours
    } else if (timeDiffHours >= 1) {
      return 100; // Medium height for tasks between 1-3 hours
    } else {
      return Math.max(70, Math.min(85, timeDiffMinutes));
    }
  }, [timeDiffMinutes]);

  const InteractiveDot = () => (
    <Popover>
      <PopoverTrigger asChild>
        <TimelineDot
          sx={{
            width: '12px',
            height: '12px',
            margin: '14px 0 0 19px',
            padding: 0,
            backgroundColor: PRIORITY_COLORS[dotColor],
            boxShadow: 'none',
            position: 'relative',
            zIndex: 1,
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: PRIORITY_COLORS[dotColor],
              opacity: 0.8,
            },
          }}
          aria-label={`Current priority: ${PRIORITY_LABELS[dotColor]}`}
        />
      </PopoverTrigger>
      {onPriorityChange && (
        <PopoverContent className="w-48 p-2">
          <div className="flex flex-col gap-1">
            {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((priority) => (
              <Button
                key={priority}
                variant="ghost"
                className={cn(
                  'flex items-center justify-start gap-2 px-2',
                  dotColor === priority && 'bg-accent',
                )}
                onClick={() => onPriorityChange(priority)}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: PRIORITY_COLORS[priority] }}
                />
                <span className="text-sm">{PRIORITY_LABELS[priority]}</span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );

  return (
    <StyledTimelineItem
      className={cn('timeline-item-wrapper', strikethrough && 'text-gray-500 line-through')}
      sx={{
        minHeight: `${lineHeight}px`,
      }}
    >
      <TimelineSeparator>
        <InteractiveDot />
        <TimelineConnector
          sx={{
            width: '2px',
            backgroundColor: '#374151',
            height: `${lineHeight - 32}px`,
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
        <Box
          sx={{
            marginBottom: '24px',
            marginTop: '12px',
            textDecoration: strikethrough ? 'line-through' : 'none',
            opacity: completed ? 0.5 : 1,
          }}
        >
          <div className="text-sm text-muted-foreground">{time}</div>
          {children}
        </Box>
      </TimelineContent>
    </StyledTimelineItem>
  );
};

export const CustomTimeline: React.FC<CustomTimelineProps> = ({ children }) => {
  return <StyledTimeline>{children}</StyledTimeline>;
};
