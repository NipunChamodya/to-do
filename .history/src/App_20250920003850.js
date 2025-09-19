import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch } from 'firebase/firestore';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Standalone Avatar Component ---
const Avatar = ({ name }) => {
  const getInitials = (nameString) => {
    if (!nameString) return '?';
    const names = nameString.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return nameString.substring(0, 2);
  };

  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };

  const initials = getInitials(name).toUpperCase();
  const avatarColor = stringToColor(name);

  return (
    <div className="avatar" style={{ backgroundColor: avatarColor }} title={name}>
      {initials}
    </div>
  );
};


// --- Task Item Component (with corrected JSX structure) ---
function SortableTaskItem({ task, toggleTaskCompletion, handleEdit, handleDeleteTask, editingTaskId, editingText, setEditingText, handleUpdateTask }) {
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

  return (
    <div ref={setNodeRef} style={style} className={`task-item ${task.isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
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
    </div>
  );
}


function App() {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [creator, setCreator] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setTasks(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => {
      console.error("Error fetching tasks:", error);
      alert("Could not fetch tasks. Check browser console for errors, likely a Firebase issue.");
    });
    return () => unsubscribe();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !creator.trim() || !assignee.trim()) {
      alert("Please fill out Title, Added By, and Assign To fields.");
      return;
    }
    try {
      await addDoc(collection(db, 'tasks'), {
        title: taskTitle.trim(), description: taskDescription.trim(), creator: creator.trim(),
        assignee: assignee.trim(), isCompleted: false, createdAt: new Date(),
        order: tasks.length,
        dueDate: dueDate,
        priority: priority
      });
      setTaskTitle(''); setTaskDescription(''); setCreator(''); setAssignee('');
      setDueDate(''); setPriority('Medium'); setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task. Check console for errors.");
    }
  };

  const handleDeleteTask = async (idToDelete) => {
    try {
      await deleteDoc(doc(db, 'tasks', idToDelete));
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task. Check console for errors.");
    }
  };

  const toggleTaskCompletion = async (task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), { isCompleted: !task.isCompleted });
    } catch (error) {
      console.error("Error updating task completion:", error);
      alert("Failed to update task. Check console for errors.");
    }
  };

  const handleEdit = (task) => {
    setEditingTaskId(task.id);
    setEditingText(task.title);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingText.trim()) return;
    try {
      await updateDoc(doc(db, 'tasks', editingTaskId), { title: editingText.trim() });
      setEditingTaskId(null); setEditingText('');
    } catch (error) {
      console.error("Error updating task title:", error);
      alert("Failed to save task title. Check console for errors.");
    }
  };
  
  const onDragEnd = async (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(reorderedTasks);
      try {
        const batch = writeBatch(db);
        reorderedTasks.forEach((task, index) => {
          const taskRef = doc(db, 'tasks', task.id);
          batch.update(taskRef, { order: index });
        });
        await batch.commit();
      } catch (error) {
        console.error("Error reordering tasks:", error);
        alert("Failed to save new task order. Check console for errors.");
      }
    }
  };

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
      <button onClick={toggleTheme} className="theme-toggle-button">
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

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
      )}

      <header className="app-header">
        <h1>Task Manager</h1>
        <button className="add-notice-btn" onClick={() => setIsModalOpen(true)}>
          + Add New Task
        </button>
      </header>
      
      <div className="controls-container">
        <input type="text" className="search-bar" placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <div className="filter-buttons">
          <button onClick={() => setFilterStatus('all')} className={filterStatus === 'all' ? 'active' : ''}>All</button>
          <button onClick={() => setFilterStatus('active')} className={filterStatus === 'active' ? 'active' : ''}>Active</button>
          <button onClick={() => setFilterStatus('completed')} className={filterStatus === 'completed' ? 'active' : ''}>Completed</button>
        </div>
      </div>

      <main>
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className="task-list">
            <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    toggleTaskCompletion={toggleTaskCompletion}
                    handleEdit={handleEdit}
                    handleDeleteTask={handleDeleteTask}
                    editingTaskId={editingTaskId}
                    editingText={editingText}
                    setEditingText={setEditingText}
                    handleUpdateTask={handleUpdateTask}
                  />
                ))
              ) : (
                <p className="no-tasks-message">No tasks found. Add one!</p>
              )}
            </SortableContext>
          </div>
        </DndContext>
      </main>

      <div className="footer-info">
        <p><strong>{tasks.filter(task => !task.isCompleted).length} active tasks</strong></p>
      </div>
    </div>
  );
}

export default App;

