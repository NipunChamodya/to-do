import React from 'react';

// This component displays a placeholder while data is loading.
const TaskSkeleton = () => {
  return (
    <div className="task-item skeleton">
      <div className="skeleton-drag-handle"></div>
      <div className="skeleton-main-content">
        <div className="skeleton-line title"></div>
        <div className="skeleton-line description"></div>
        <div className="skeleton-meta">
          <div className="skeleton-line meta-short"></div>
          <div className="skeleton-line meta-long"></div>
        </div>
      </div>
    </div>
  );
};

export default TaskSkeleton;
