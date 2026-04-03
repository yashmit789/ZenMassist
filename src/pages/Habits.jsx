import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Habits = () => {
    const { user } = useAuth();
    const [habits, setHabits] = useState([]);
    const [newHabit, setNewHabit] = useState('');
    const [loading, setLoading] = useState(false);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // 1. FETCH ALL HABITS
    const fetchHabits = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/data/habits`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                setHabits(data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    useEffect(() => {
        if (user) fetchHabits();
    }, [user]);

    // 2. ADD HABIT
    const addHabit = async (e) => {
        e.preventDefault();
        if (!newHabit.trim() || loading) return;

        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/data/habits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: newHabit })
            });

            if (response.ok) {
                const addedHabit = await response.json();
                setHabits(prev => [...prev, addedHabit].sort((a, b) => a.name.localeCompare(b.name)));
                setNewHabit('');
            }
        } catch (err) {
            console.error("Add error:", err);
        } finally {
            setLoading(false);
        }
    };

    // 3. INCREMENT STREAK
    const incrementStreak = async (id, currentStreak) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/data/habits/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ streak: currentStreak + 1 })
            });

            if (response.ok) {
                const updatedHabit = await response.json();
                setHabits(habits.map(h => h.id === id ? updatedHabit : h));
            }
        } catch (err) {
            console.error("Update error:", err);
        }
    };

    // 4. DELETE HABIT
    const deleteHabit = async (id) => {
        if (!window.confirm("Remove this habit?")) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/data/habits/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setHabits(habits.filter(h => h.id !== id));
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 mt-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Daily Habits</h1>
            
            <form onSubmit={addHabit} className="flex gap-4 mb-10 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <input 
                    className="flex-1 border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition" 
                    value={newHabit} 
                    onChange={(e) => setNewHabit(e.target.value)} 
                    placeholder="E.g., Morning Meditation, Coding Practice..." 
                    required 
                />
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-100 disabled:opacity-50"
                >
                    {loading ? '...' : 'Start Tracking'}
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {habits.length === 0 ? (
                    <p className="col-span-full text-center text-gray-400 py-10 italic">No habits yet. Brick by brick!</p>
                ) : (
                    habits.map(h => (
                        <div key={h.id} className="group bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:border-orange-200">
                            <div>
                                <h3 className="font-extrabold text-xl text-gray-800">{h.name}</h3>
                                <p className="text-sm text-orange-500 font-black mt-1 flex items-center gap-1 uppercase tracking-tighter">
                                    <span className="text-lg">🔥</span> {h.streak} Day Streak
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <button 
                                    onClick={() => deleteHabit(h.id)}
                                    className="text-gray-200 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                                <button 
                                    onClick={() => incrementStreak(h.id, h.streak)} 
                                    className="bg-green-50 text-green-700 px-5 py-2.5 rounded-xl font-black text-sm hover:bg-green-100 hover:text-green-800 transition active:scale-95 shadow-sm shadow-green-50"
                                >
                                    Done Today
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Habits;