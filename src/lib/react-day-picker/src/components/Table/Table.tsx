import { addMonths, subMonths } from 'date-fns';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { useCallback, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '../../../../../components/ui/carousel';
import { Footer } from '../../components/Footer';
import { Head } from '../../components/Head';
import { Row } from '../../components/Row';
import { useDayPicker } from '../../contexts/DayPicker';
import { getMonthWeeks } from './utils/getMonthWeeks';

/** The props for the {@link Table} component. */
export interface TableProps {
  /** ID of table element */
  id?: string;
  /** The ID of the label of the table (the same given to the Caption). */
  ['aria-labelledby']?: string;
  /** The month where the table is displayed. */
  displayMonth: Date;
}

export function Table(props: TableProps): JSX.Element {
  const [currentMonth, setCurrentMonth] = useState(props.displayMonth);
  const {
    locale,
    classNames,
    styles,
    hideHead,
    fixedWeeks,
    components,
    weekStartsOn,
    firstWeekContainsDate,
    ISOWeek,
    onMonthChange, // Add this to DayPicker context if not exists
  } = useDayPicker();

  const weeks = getMonthWeeks(currentMonth, {
    useFixedWeeks: Boolean(fixedWeeks),
    ISOWeek,
    locale,
    weekStartsOn,
    firstWeekContainsDate,
  });

  const handleNextMonth = useCallback(() => {
    const nextMonth = addMonths(currentMonth, 1);
    setCurrentMonth(nextMonth);
    onMonthChange?.(nextMonth);
  }, [currentMonth, onMonthChange]);

  const handlePrevMonth = useCallback(() => {
    const prevMonth = subMonths(currentMonth, 1);
    setCurrentMonth(prevMonth);
    onMonthChange?.(prevMonth);
  }, [currentMonth, onMonthChange]);

  const onCarouselSelect = useCallback(
    (index: number) => {
      // If at last slide and trying to go forward
      if (index >= weeks.length - 1) {
        handleNextMonth();
      }
      // If at first slide and trying to go backward
      else if (index <= 0) {
        handlePrevMonth();
      }
    },
    [weeks.length, handleNextMonth, handlePrevMonth],
  );

  const HeadComponent = components?.Head ?? Head;
  const RowComponent = components?.Row ?? Row;
  const FooterComponent = components?.Footer ?? Footer;

  return (
    <div
      id={props.id}
      className={classNames.table}
      style={styles.table}
      role="grid"
      aria-labelledby={props['aria-labelledby']}
    >
      <div className={classNames.tbody} style={styles.tbody}>
        <Carousel plugins={[WheelGesturesPlugin()]} onSelect={() => onCarouselSelect}>
          <CarouselContent>
            {weeks.map((week) => (
              <CarouselItem key={week.dates[1].getTime()}>
                {!hideHead && <HeadComponent />}
                <RowComponent
                  displayMonth={currentMonth}
                  dates={week.dates}
                  weekNumber={week.weekNumber}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
      <FooterComponent displayMonth={currentMonth} />
    </div>
  );
}
