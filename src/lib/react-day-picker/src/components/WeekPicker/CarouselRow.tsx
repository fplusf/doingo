import { getUnixTime } from 'date-fns';
import { useState } from 'react';
import { Day } from '../../components/Day';
import { WeekNumber } from '../../components/WeekNumber';
import { useDayPicker } from '../../contexts/DayPicker';
import { RowProps } from '../Row';

interface CarouselRowProps extends RowProps {
  weeks: RowProps[];
}

export function CarouselRow(props: CarouselRowProps): JSX.Element {
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const { styles, classNames } = useDayPicker();

  const nextWeek = () => {
    setCurrentWeekIndex((prev) => (prev < props.weeks.length - 1 ? prev + 1 : prev));
  };

  const previousWeek = () => {
    setCurrentWeekIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  return (
    <div className="carousel-container" style={{ position: 'relative' }}>
      <button onClick={previousWeek} disabled={currentWeekIndex === 0}>
        &lt;
      </button>

      <div className="carousel-content" style={{ overflow: 'hidden' }}>
        <Row
          displayMonth={props.weeks[currentWeekIndex].displayMonth}
          weekNumber={props.weeks[currentWeekIndex].weekNumber}
          dates={props.weeks[currentWeekIndex].dates}
        />
      </div>

      <button onClick={nextWeek} disabled={currentWeekIndex === props.weeks.length - 1}>
        &gt;
      </button>
    </div>
  );
}

function Row(props: RowProps): JSX.Element {
  const { styles, classNames, showWeekNumber, components } = useDayPicker();
  const DayComponent = components?.Day ?? Day;
  const WeeknumberComponent = components?.WeekNumber ?? WeekNumber;

  let weekNumberCell;
  if (showWeekNumber) {
    weekNumberCell = (
      <td className={classNames.cell} style={styles.cell}>
        <WeeknumberComponent number={props.weekNumber} dates={props.dates} />
      </td>
    );
  }

  return (
    <tr className={classNames.row} style={styles.row}>
      {weekNumberCell}
      {props.dates.map((date) => (
        <td
          className={classNames.cell}
          style={styles.cell}
          key={getUnixTime(date)}
          role="presentation"
        >
          <DayComponent displayMonth={props.displayMonth} date={date} />
        </td>
      ))}
    </tr>
  );
}
