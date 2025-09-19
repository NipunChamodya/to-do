import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch } from 'firebase/firestore';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskItem } from './components/SortableTaskItem'; // Import from new location
import AddTaskModal from './components/AddTaskModal'; // Import new component

function App() {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Editing state remains here as it affects the whole list
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Search/Filter state also remains here
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Firebase listener to get tasks
  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setTasks(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => {
      console.error("Error fetching tasks:", error);
      alert("Could not fetch tasks. Check browser console for errors.");
    });
    return () => unsubscribe();
  }, []);

  // --- CRUD FUNCTIONS ---
  // These stay in App.js as they are the source of truth for data manipulation
  const handleAddTask = async (taskData) => {
    try {
      await addDoc(collection(db, 'tasks'), {
        ...taskData,
        isCompleted: false, 
        createdAt: new Date(),
        order: tasks.length,
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task.");
    }
  };

  const handleDeleteTask = async (idToDelete) => {
    try {
      await deleteDoc(doc(db, 'tasks', idToDelete));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const toggleTaskCompletion = async (task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), { isCompleted: !task.isCompleted });
    } catch (error) {
      console.error("Error updating task completion:", error);
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
      setEditingTaskId(null); 
      setEditingText('');
    } catch (error) {
      console.error("Error updating task title:", error);
    }
  };
  
  const onDragEnd = async (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(reorderedTasks); // Optimistic update for smooth UI
      try {
        const batch = writeBatch(db);
        reorderedTasks.forEach((task, index) => {
          const taskRef = doc(db, 'tasks', task.id);
          batch.update(taskRef, { order: index });
        });
        await batch.commit();
      } catch (error) {
        console.error("Error reordering tasks:", error);
        // Optionally revert state if Firebase fails
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
      {isModalOpen && <AddTaskModal onAddTask={handleAddTask} onClose={() => setIsModalOpen(false)} />}

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

