import React from 'react';
import Task from './Task';

const TaskTimeline = () => {
  const tasks = [
    { time: '09:00', title: 'Something', duration: '15 min' },
    { time: '10:00', title: 'Rise and Shine', completed: true },
    { time: '10:00-11:00', title: 'Answer Emails', duration: '1 hr' },
    { time: '11:00-12:30', title: 'Whatever Else', duration: '1.5 hr' },
    { time: '20:00', title: 'Wind Down' },
  ];

  return (
    <div className="m-auto w-1/2">
      {tasks.map((task, idx) => (
        <Task key={idx} {...task} />
      ))}
    </div>
  );
};

export default TaskTimeline;
