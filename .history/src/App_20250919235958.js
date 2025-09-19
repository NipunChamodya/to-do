import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch } from 'firebase/firestore';
// NEW: Import from dnd-kit
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// NEW: Task Item is now its own component for better structure
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`task-item ${task.isCompleted ? 'completed' : ''}`}>
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
  );
}


function App() {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [creator, setCreator] = useState('');
  const [assignee, setAssignee] = useState('');
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
      order: tasks.length
    });
    setTaskTitle(''); setTaskDescription(''); setCreator(''); setAssignee(''); setIsModalOpen(false);
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
  
  // MODIFIED: Drag and drop logic for dnd-kit
  const onDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
      
      // Update local state immediately for smooth UI
      setTasks(reorderedTasks);

      // Update Firestore in the background
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

