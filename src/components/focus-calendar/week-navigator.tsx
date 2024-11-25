import React, { useState } from 'react';
import { Calendar } from '../ui/calendar';
import { CarouselApi } from '../ui/carousel';

interface WeekNavigatorProps {
  selectedDate: Date;
  onDateChange: (newDate: Date) => void;
}

const WeekNavigator: React.FC<WeekNavigatorProps> = ({ selectedDate, onDateChange }) => {
  const [api, setApi] = useState<CarouselApi>();

  return <Calendar />;
};

export default WeekNavigator;
