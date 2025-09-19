import React, { useState } from 'react';

// This component now manages its own form state.
function AddTaskModal({ onAddTask, onClose }) {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [creator, setCreator] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !creator.trim() || !assignee.trim()) {
      alert("Please fill out Title, Added By, and Assign To fields.");
      return;
    }
    // Pass the new task data up to the App component
    onAddTask({
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      creator: creator.trim(),
      assignee: assignee.trim(),
      dueDate,
      priority,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <div className="form-card">
          <h2>Add a New Task</h2>
          <form onSubmit={handleSubmit}>
             <input type="text" placeholder="Task Title*" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required autoFocus />
             <textarea placeholder="Description (optional)" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)}></textarea>
             <div className="form-row">
                 <input type="text" placeholder="Added By*" value={creator} onChange={(e) => setCreator(e.target.value)} required />
                 <input type="text" placeholder="Assign To*" value={assignee} onChange={(e) => setAssignee(e.target.value)} required />
             </div>
             <div className="form-row">
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                </select>
             </div>
             <button type="submit">Add Task</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddTaskModal;
