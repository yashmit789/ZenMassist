import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Habits = () => {
    const { user } = useAuth();
    const [habits, setHabits] = useState([]);
    const [newHabit, setNewHabit] = useState('');

    useEffect(() => { if (user) fetchHabits(); }, [user]);

    const fetchHabits = async () => {
        const { data } = await supabase.from('habits').select('*').order('name');
        if (data) setHabits(data);
    };

    const addHabit = async (e) => {
        e.preventDefault();
        const { data } = await supabase.from('habits').insert([{ name: newHabit, user_id: user.id }]).select();
        if (data) { setHabits([...habits, data[0]]); setNewHabit(''); }
    };

    const incrementStreak = async (id, currentStreak) => {
        const today = new Date().toISOString().split('T')[0];
        const { error } = await supabase.from('habits').update({ streak: currentStreak + 1, last_completed: today }).eq('id', id);
        if (!error) fetchHabits();
    };

    return (
        <div className="max-w-4xl mx-auto p-6 mt-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Daily Habits</h1>
            <form onSubmit={addHabit} className="flex gap-4 mb-8">
                <input className="flex-1 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none" value={newHabit} onChange={(e) => setNewHabit(e.target.value)} placeholder="Add a new habit to track..." required />
                <button type="submit" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold">Add</button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {habits.map(h => (
                    <div key={h.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">{h.name}</h3>
                            <p className="text-sm text-orange-500 font-bold">🔥 {h.streak} Day Streak</p>
                        </div>
                        <button onClick={() => incrementStreak(h.id, h.streak)} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold hover:bg-green-200">Done Today</button>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Habits;