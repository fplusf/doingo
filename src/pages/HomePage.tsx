import React from 'react';
import { useTranslation } from 'react-i18next';
import TaskTimeline from '../components/task-management/TaskTimeline';

export default function HomePage() {
  const { t } = useTranslation();

  const title = 'Welcome to Slack';
  const message = 'You have new messages';
  const time = '2 mins ago';

  return (
    <>
      <TaskTimeline />
    </>
  );
}
