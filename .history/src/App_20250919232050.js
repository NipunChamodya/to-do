import React, { useState, useEffect } from 'react';
import './App.css';
// NEW: Import Firestore functions
import { db } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

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

  // --- NEW: REAL-TIME DATA SYNC WITH FIRESTORE ---
  useEffect(() => {
    // Create a query to get tasks, ordering by creation time
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    
    // onSnapshot is a real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksData = [];
      querySnapshot.forEach((doc) => {
        // Important: combine doc.id with doc.data()
        tasksData.push({ ...doc.data(), id: doc.id });
      });
      setTasks(tasksData);
    });

    // Cleanup function to stop listening when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs only once

  // --- CRUD FUNCTIONS NOW TALK TO FIREBASE ---
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !creator.trim() || !assignee.trim()) {
      alert("Please fill out Title, Added By, and Assign To fields.");
      return;
    }
    // Use addDoc to create a new task in the 'tasks' collection
    await addDoc(collection(db, 'tasks'), {
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      creator: creator.trim(),
      assignee: assignee.trim(),
      isCompleted: false,
      createdAt: new Date() // Use Firebase's server timestamp
    });
    
    setTaskTitle('');
    setTaskDescription('');
    setCreator('');
    setAssignee('');
    setIsModalOpen(false);
  };

  const handleDeleteTask = async (idToDelete) => {
    const taskDoc = doc(db, 'tasks', idToDelete);
    await deleteDoc(taskDoc);
  };

  const toggleTaskCompletion = async (task) => {
    const taskDoc = doc(db, 'tasks', task.id);
    await updateDoc(taskDoc, {
      isCompleted: !task.isCompleted
    });
  };

  const handleEdit = (task) => {
    setEditingTaskId(task.id);
    setEditingText(task.title);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingText.trim()) return;
    const taskDoc = doc(db, 'tasks', editingTaskId);
    await updateDoc(taskDoc, {
      title: editingText.trim()
    });
    setEditingTaskId(null);
    setEditingText('');
  };

  // --- HELPER FUNCTION ---
  const formatTimestamp = (firebaseTimestamp) => {
    const date = firebaseTimestamp?.toDate(); // Firestore timestamp needs to be converted
    if (!date) return '';
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  // --- FILTERING & SEARCHING (NO CHANGE NEEDED HERE) ---
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
        (task.description && task.description.toLowerCase().includes(search)) ||
        task.creator.toLowerCase().includes(search) ||
        task.assignee.toLowerCase().includes(search)
      );
    });

  return (
    <div className="app-container">
      {/* --- MODAL (NO CHANGE NEEDED HERE) --- */}
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
          + Add New Task
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
                            <div className="task-content" onClick={() => toggleTaskCompletion(task)}>
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
            <p className="no-tasks-message">No tasks found. Add one!</p>
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
  );
}

export default App;

