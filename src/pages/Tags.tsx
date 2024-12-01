import { Link, Outlet } from '@tanstack/react-router';
import React from 'react';

const Tags: React.FC = () => {
  const groupList = ['Group 1', 'Group 2', 'Group 3', 'Group 4'];

  return (
    <div>
      <h1>Groups</h1>
      <ul>
        {groupList.map((group, index) => (
          <li key={index}>
            <Link
              to={group}
              activeProps={{
                style: {
                  color: 'red',
                },
              }}
              className="m-4 p-2"
            >
              {group}
            </Link>
          </li>
        ))}
      </ul>

      {/* This will render the child route content */}
      <Outlet />
    </div>
  );
};

export default Tags;
