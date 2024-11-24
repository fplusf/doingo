import React from 'react';

const Groups: React.FC = () => {
  const groupList = ['Group 1', 'Group 2', 'Group 3', 'Group 4'];

  return (
    <div>
      <h1>Groups</h1>
      <ul>
        {groupList.map((group, index) => (
          <li key={index}>{group}</li>
        ))}
      </ul>
    </div>
  );
};

export default Groups;
