import React, { useState } from 'react';
import { CarouselApi } from '../ui/carousel';
import { Calendar } from './custom-calendar';

interface WeekNavigatorProps {
  selectedDate: Date;
  onDateChange: (newDate: Date) => void;
}

const WeekNavigator: React.FC<WeekNavigatorProps> = ({ selectedDate, onDateChange }) => {
  const [api, setApi] = useState<CarouselApi>();

  return <Calendar className="w-full" onDateSelect={onDateChange} />;
};

export default WeekNavigator;
