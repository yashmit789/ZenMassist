import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Planner = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // 1. Fetch Events from Backend
    const fetchEvents = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/data/planner`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                setEvents(data);
            }
        } catch (err) {
            console.error("Failed to fetch events:", err);
        }
    };

    useEffect(() => {
        if (user) fetchEvents();
    }, [user]);

    // 2. Add Event via Backend
    const addEvent = async (e) => {
        e.preventDefault();
        if (!title.trim() || !date) return;
        setLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/data/planner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title, event_date: date })
            });

            if (response.ok) {
                const newEvent = await response.json();
                setEvents(prev => [...prev, newEvent].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)));
                setTitle(''); 
                setDate('');
            }
        } catch (err) {
            console.error("Failed to add event:", err);
        } finally {
            setLoading(false);
        }
    };

    // 3. Delete Event (Added for convenience)
    const deleteEvent = async (id) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/data/planner/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.ok) {
                setEvents(events.filter(ev => ev.id !== id));
            }
        } catch (err) {
            console.error("Failed to delete event:", err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 mt-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Schedule & Planner</h1>
            
            <form onSubmit={addEvent} className="flex flex-col md:flex-row gap-4 mb-10 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <input 
                    className="flex-1 border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 transition" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="What's happening?" 
                    required 
                />
                <input 
                    type="date" 
                    className="border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 transition text-gray-600" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    required 
                />
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-100 disabled:opacity-50"
                >
                    {loading ? '...' : 'Schedule'}
                </button>
            </form>

            <div className="space-y-4">
                {events.length === 0 ? (
                    <p className="text-center text-gray-400 py-10 italic">No plans yet. What's on the horizon?</p>
                ) : (
                    events.map(ev => (
                        <div key={ev.id} className="group bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center transition-all hover:border-purple-200 hover:bg-purple-50/30">
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-800 text-lg">{ev.title}</span>
                                <span className="text-xs font-medium text-purple-500 uppercase tracking-wider mt-1">
                                    {new Date(ev.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                            <button 
                                onClick={() => deleteEvent(ev.id)}
                                className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Planner;