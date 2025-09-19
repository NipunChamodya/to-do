import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch } from 'firebase/firestore';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- FIXED: Task Item is now a standalone component, moved outside of App ---
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

  const isOverdue = task.dueDate && !task.isCompleted && (new Date(task.dueDate) < new Date());

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`task-item ${task.isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
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
                  <span>Added By: <strong>{task.creator}</strong></span>
                  <span>Assigned To: <strong>{task.assignee}</strong></span>
              </div>
              <div className="task-footer">
                  {task.dueDate && <span className="due-date">Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                  <span>Created: {formatTimestamp(task.createdAt)}</span>
              </div>
          </div>
        </>
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

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setTasks(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !creator.trim() || !assignee.trim()) {
      alert("Please fill out Title, Added By, and Assign To fields.");
      return;
    }
    await addDoc(collection(db, 'tasks'), {
      title: taskTitle.trim(), description: taskDescription.trim(), creator: creator.trim(),
      assignee: assignee.trim(), isCompleted: false, createdAt: new Date(),
      order: tasks.length,
      dueDate: dueDate,
      priority: priority
    });
    setTaskTitle(''); setTaskDescription(''); setCreator(''); setAssignee('');
    setDueDate(''); setPriority('Medium'); setIsModalOpen(false);
  };

  const handleDeleteTask = async (idToDelete) => {
    await deleteDoc(doc(db, 'tasks', idToDelete));
  };

  const toggleTaskCompletion = async (task) => {
    await updateDoc(doc(db, 'tasks', task.id), { isCompleted: !task.isCompleted });
  };

  const handleEdit = (task) => {
    setEditingTaskId(task.id);
    setEditingText(task.title);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingText.trim()) return;
    await updateDoc(doc(db, 'tasks', editingTaskId), { title: editingText.trim() });
    setEditingTaskId(null); setEditingText('');
  };
  
  const onDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(reorderedTasks);
      const batch = writeBatch(db);
      reorderedTasks.forEach((task, index) => {
        const taskRef = doc(db, 'tasks', task.id);
        batch.update(taskRef, { order: index });
      });
      await batch.commit();
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

