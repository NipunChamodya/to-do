import React, { useState, useEffect } from 'react';
import './App.css';

// A simple function to generate a unique ID
const generateId = () => `id_${new Date().getTime()}`;

function App() {
  // --- STATE MANAGEMENT ---
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // States for the new, detailed task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [creator, setCreator] = useState('');
  const [assignee, setAssignee] = useState('');

  // State for editing a task
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // NEW: State for the live clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- DATA PERSISTENCE (using localStorage) ---
  useEffect(() => {
    const savedTasks = localStorage.getItem('final_todo_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
  }, []);

  useEffect(() => {
    localStorage.setItem('final_todo_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // NEW: Effect hook to update the time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(timerId);
  }, []); // Empty dependency array means this runs only once on mount

  // --- CRUD & CORE FUNCTIONS ---
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !creator.trim() || !assignee.trim()) {
      alert("Please fill out Title, Added By, and Assign To fields.");
      return;
    }
    const newTask = { 
      id: generateId(), 
      title: taskTitle.trim(), 
      description: taskDescription.trim(),
      creator: creator.trim(),
      assignee: assignee.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString()
    };
    setTasks([newTask, ...tasks]);
    
    setTaskTitle('');
    setTaskDescription('');
    setCreator('');
    setAssignee('');
    setIsModalOpen(false);
  };

  const handleDeleteTask = (idToDelete) => {
    setTasks(tasks.filter(task => task.id !== idToDelete));
  };

  const toggleTaskCompletion = (idToToggle) => {
    setTasks(tasks.map(task => 
      task.id === idToToggle ? { ...task, isCompleted: !task.isCompleted } : task
    ));
  };

  const handleEdit = (task) => {
    setEditingTaskId(task.id);
    setEditingText(task.title);
  };

  const handleUpdateTask = (e) => {
    e.preventDefault();
    if (!editingText.trim()) {
        alert("Task title cannot be empty.");
        return;
    }
    setTasks(tasks.map(task => 
      task.id === editingTaskId ? { ...task, title: editingText.trim() } : task
    ));
    setEditingTaskId(null);
    setEditingText('');
  };

  // --- HELPER FUNCTIONS ---
  const formatTimestamp = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    });
  };
  
  // NEW: Helper to format the live time
  const formatLiveTime = (date) => {
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
  };

  // --- FILTERING & SEARCHING LOGIC ---
  const filteredTasks = tasks
    .filter(task => {
      if (filterStatus === 'active') return !task.isCompleted;
      if (filterStatus === 'completed') return task.isCompleted;
      return true;
    })
    .filter(task => {
      const search = searchTerm.toLowerCase();
      return (
        task.title.toLowerCase().includes(search) ||
        task.description.toLowerCase().includes(search) ||
        task.creator.toLowerCase().includes(search) ||
        task.assignee.toLowerCase().includes(search)
      );
    });

  return (
    <>
      {/* --- NEW: APPLE-STYLE NAVIGATION BAR --- */}
      <div className="apple-nav-bar">
        <div className="nav-app-name"><strong>Notice Board</strong></div>
        <div className="clock">{formatLiveTime(currentTime)}</div>
      </div>

      <div className="app-container">
        {/* --- MODAL FOR ADDING TASK --- */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="close-button" onClick={() => setIsModalOpen(false)}>×</button>
              <div className="form-card">
                <h2>Add a New Task</h2>
                <form onSubmit={handleAddTask}>
                  <input type="text" placeholder="Task Title*" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required autoFocus />
                  <textarea placeholder="Description (optional)" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)}></textarea>
                  <div className="form-row">
                      <input type="text" placeholder="Added By*" value={creator} onChange={(e) => setCreator(e.target.value)} required />
                      <input type="text" placeholder="Assign To*" value={assignee} onChange={(e) => setAssignee(e.target.value)} required />
                  </div>
                  <button type="submit">Add Task</button>
                </form>
              </div>
            </div>
          </div>
        )}

        <header className="app-header">
          <h1>Task Manager</h1>
          <button className="add-notice-btn" onClick={() => setIsModalOpen(true)}>
            + New Task
          </button>
        </header>
        
        <div className="controls-container">
          <input
            type="text"
            className="search-bar"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="filter-buttons">
            <button onClick={() => setFilterStatus('all')} className={filterStatus === 'all' ? 'active' : ''}>All</button>
            <button onClick={() => setFilterStatus('active')} className={filterStatus === 'active' ? 'active' : ''}>Active</button>
            <button onClick={() => setFilterStatus('completed')} className={filterStatus === 'completed' ? 'active' : ''}>Completed</button>
          </div>
        </div>

        <main>
          <div className="task-list">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <div key={task.id} className={`task-item ${task.isCompleted ? 'completed' : ''}`}>
                  {editingTaskId === task.id ? (
                    <form onSubmit={handleUpdateTask} className="edit-form">
                      <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} autoFocus />
                      <button type="submit">Save</button>
                    </form>
                  ) : (
                    <>
                      <div className="task-main-content">
                          <div className="task-header">
                              <div className="task-content" onClick={() => toggleTaskCompletion(task.id)}>
                                  <h3>{task.title}</h3>
                              </div>
                              <div className="task-actions">
                                  <button className="edit-btn" title="Edit Title" onClick={() => handleEdit(task)}>✎</button>
                                  <button className="delete-btn" title="Delete Task" onClick={() => handleDeleteTask(task.id)}>×</button>
                              </div>
                          </div>
                          {task.description && <p className="task-description">{task.description}</p>}
                          <div className="task-meta">
                              <span>Added By: <strong>{task.creator}</strong></span>
                              <span>Assigned To: <strong>{task.assignee}</strong></span>
                          </div>
                          <div className="task-footer">
                              <span>Created: {formatTimestamp(task.createdAt)}</span>
                          </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="no-tasks-message">No tasks match your criteria.</p>
            )}
          </div>
        </main>

        <div className="footer-info">
          <p>
            <strong>
              {tasks.filter(task => !task.isCompleted).length} active tasks
            </strong>
          </p>
        </div>
      </div>
    </>
  );
}

export default App;