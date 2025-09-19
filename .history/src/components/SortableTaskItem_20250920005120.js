import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Avatar from './Avatar';
import { motion } from 'framer-motion'; // NEW: Import motion

export function SortableTaskItem({ task, toggleTaskCompletion, handleEdit, handleDeleteTask, editingTaskId, editingText, setEditingText, handleUpdateTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatTimestamp = (firebaseTimestamp) => {
    const date = firebaseTimestamp?.toDate();
    if (!date) return '';
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  const isOverdue = task.dueDate && !task.isCompleted && (new Date(task.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0));

  // NEW: Animation properties for the task item
  const animationVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    // NEW: The main div is now a motion.div with animation props
    <motion.div
      ref={setNodeRef}
      style={style}
      variants={animationVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout // This smoothly animates reordering when items are deleted
      className={`task-item ${task.isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
    >
      <div className="task-drag-handle" {...attributes} {...listeners}></div>
      {editingTaskId === task.id ? (
        <form onSubmit={handleUpdateTask} className="edit-form">
          <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} autoFocus />
          <button type="submit">Save</button>
        </form>
      ) : (
        <div className="task-main-content">
            <div className="task-header">
                <div className="task-content" onClick={() => toggleTaskCompletion(task)}>
                    <h3>{task.title}</h3>
                    {task.priority && <span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>}
                </div>
                <div className="task-actions">
                    <button className="edit-btn" title="Edit Title" onClick={() => handleEdit(task)}>✎</button>
                    <button className="delete-btn" title="Delete Task" onClick={() => {
                      if (window.confirm('Are you sure you want to delete this task?')) {
                        handleDeleteTask(task.id);
                      }
                    }}>×</button>
                </div>
            </div>
            {task.description && <p className="task-description">{task.description}</p>}
            <div className="task-meta">
                <div className="assignee-info">
                  <Avatar name={task.assignee} />
                  <span>{task.assignee}</span>
                </div>
                <div className="creator-info">
                  <span>Added By: <strong>{task.creator}</strong></span>
                </div>
            </div>
            <div className="task-footer">
                {task.dueDate && <span className="due-date">Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                <span>Created: {formatTimestamp(task.createdAt)}</span>
            </div>
        </div>
      )}
    </motion.div>
  );
}

