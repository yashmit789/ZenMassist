import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Health = () => {
    const { user } = useAuth();
    const [water, setWater] = useState('');
    const [exercise, setExercise] = useState('');

    const logHealth = async (e) => {
        e.preventDefault();
        await supabase.from('health_logs').insert([{ water_glasses: parseInt(water), exercise_minutes: parseInt(exercise), user_id: user.id }]);
        setWater(''); setExercise('');
        alert("Health stats logged!");
    };

    return (
        <div className="max-w-xl mx-auto p-6 mt-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Health Logs</h1>
            <form onSubmit={logHealth} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Glasses of Water</label>
                    <input type="number" className="w-full border p-3 rounded-xl" value={water} onChange={(e) => setWater(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Exercise Minutes</label>
                    <input type="number" className="w-full border p-3 rounded-xl" value={exercise} onChange={(e) => setExercise(e.target.value)} />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-xl font-bold">Save Today's Stats</button>
            </form>
        </div>
    );
};
export default Health;