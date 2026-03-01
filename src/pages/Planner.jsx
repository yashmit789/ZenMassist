import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Planner = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => { if (user) fetchEvents(); }, [user]);

    const fetchEvents = async () => {
        const { data } = await supabase.from('planner_events').select('*').order('event_date');
        if (data) setEvents(data);
    };

    const addEvent = async (e) => {
        e.preventDefault();
        await supabase.from('planner_events').insert([{ title, event_date: date, user_id: user.id }]);
        setTitle(''); setDate(''); fetchEvents();
    };

    return (
        <div className="max-w-4xl mx-auto p-6 mt-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Schedule & Planner</h1>
            <form onSubmit={addEvent} className="flex gap-4 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <input className="flex-1 border p-3 rounded-xl" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event Title" required />
                <input type="date" className="border p-3 rounded-xl" value={date} onChange={(e) => setDate(e.target.value)} required />
                <button type="submit" className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold">Schedule</button>
            </form>
            <div className="space-y-3">
                {events.map(ev => (
                    <div key={ev.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between">
                        <span className="font-bold text-gray-800">{ev.title}</span>
                        <span className="text-gray-500">{new Date(ev.event_date).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Planner;