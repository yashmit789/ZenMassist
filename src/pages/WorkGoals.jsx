import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const WorkGoals = () => {
    const [goals, setGoals] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [activeTimer, setActiveTimer] = useState(null);
    const { user } = useAuth();

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // 1. FETCH ALL GOALS
    const fetchGoals = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/data/goals`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                setGoals(data.sort((a, b) => new Date(a.target_date) - new Date(b.target_date)));
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    useEffect(() => {
        if (user) fetchGoals();
    }, [user]);

    // 2. ADD NEW GOAL
    const handleAddGoal = async (e) => {
        e.preventDefault();
        if (!title.trim() || !targetDate) return alert("Title and Date are required!");

        try {
            const response = await fetch(`${BACKEND_URL}/api/data/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    title, 
                    description, 
                    target_date: targetDate 
                })
            });

            const data = await response.json();

            if (response.ok) {
                setGoals(prev => [...prev, data].sort((a, b) => new Date(a.target_date) - new Date(b.target_date)));
                setTitle(''); setDescription(''); setTargetDate('');
            } else {
                console.error("Server Error:", data);
                alert(data.message || "Failed to add goal.");
            }
        } catch (err) {
            console.error("Network Error:", err);
        }
    };

    // 3. TOGGLE COMPLETE
    const toggleComplete = async (id, currentStatus) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/data/goals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ completed: !currentStatus })
            });

            if (response.ok) {
                setGoals(goals.map(g => g.id === id ? { ...g, completed: !currentStatus } : g));
            }
        } catch (err) {
            console.error("Toggle error:", err);
        }
    };

    // 4. DELETE GOAL (The Fixed Function)
    const deleteGoal = async (id) => {
        // Confirmation is always a good idea before deleting data
        if (!window.confirm("Are you sure you want to delete this goal?")) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/data/goals/${id}`, {
                method: 'DELETE',
                credentials: 'include' // This ensures the backend knows who you are
            });

            if (response.ok) {
                // Remove the deleted goal from the UI state immediately
                setGoals(prevGoals => prevGoals.filter(g => g.id !== id));
            } else {
                const errorData = await response.json();
                console.error("Delete failed:", errorData);
                alert("Failed to delete goal. Try again.");
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    // Timer Logic
    useEffect(() => {
        let interval;
        if (activeTimer) {
            interval = setInterval(() => {
                setGoals(prev => prev.map(g => 
                    g.id === activeTimer ? { ...g, duration_seconds: (g.duration_seconds || 0) + 1 } : g
                ));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeTimer]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="max-w-4xl mx-auto p-6 mt-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Work Goals</h1>
            
            {/* Minimalist Form */}
            <form onSubmit={handleAddGoal} className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 mb-10 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Goal Name</label>
                        <input className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Finish the React project" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Date</label>
                        <input type="date" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition text-gray-600" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description (Optional)</label>
                    <input className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add some details..." />
                </div>
                <button type="submit" className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition shadow-md">
                    Assign Goal
                </button>
            </form>

            {/* Clean Goal List */}
            <div className="space-y-4">
                {goals.map(goal => (
                    <div key={goal.id} className={`p-5 rounded-2xl border transition-all ${goal.completed ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white shadow-sm border-gray-100'}`}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-start gap-4">
                                <input type="checkbox" checked={goal.completed} onChange={() => toggleComplete(goal.id, goal.completed)} className="mt-1.5 w-5 h-5 accent-gray-900 cursor-pointer rounded" />
                                <div>
                                    <h3 className={`font-bold text-lg ${goal.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{goal.title}</h3>
                                    {goal.description && <p className="text-sm text-gray-500 mt-1">{goal.description}</p>}
                                    <p className="text-xs font-medium text-gray-400 mt-2">Due: {new Date(goal.target_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                {/* The Red Delete Button */}
                                <button 
                                    onClick={() => deleteGoal(goal.id)} 
                                    className="text-gray-300 hover:text-red-500 transition p-1 hover:bg-red-50 rounded"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-sm">{formatTime(goal.duration_seconds || 0)}</span>
                                    <button onClick={() => setActiveTimer(activeTimer === goal.id ? null : goal.id)} className={`px-3 py-1 rounded-md text-xs font-bold text-white transition ${activeTimer === goal.id ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-800 hover:bg-gray-900'}`}>
                                        {activeTimer === goal.id ? 'Stop' : 'Start'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WorkGoals;