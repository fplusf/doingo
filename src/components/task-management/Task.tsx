import { CheckCircle, Circle } from 'lucide-react';
import React from 'react';

type TaskProps = {
  time: string;
  title: string;
  duration?: string;
  completed?: boolean;
};

const Task = ({ time, title, duration, completed = false }: TaskProps) => {
  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm text-gray-400">{time}</span>
      <div className="flex-1">
        <h3 className={`font-semibold ${completed ? 'line-through' : ''}`}>{title}</h3>
        {duration && <p className="text-xs text-gray-500">{duration}</p>}
      </div>
      {completed ? (
        <CheckCircle className="text-green-500" />
      ) : (
        <Circle className="text-gray-500" />
      )}
    </div>
  );
};

export default Task;
