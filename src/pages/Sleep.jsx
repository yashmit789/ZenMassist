import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Sleep = () => {
    const { user } = useAuth();
    const [hours, setHours] = useState('');

    const logSleep = async (e) => {
        e.preventDefault();
        await supabase.from('sleep_logs').insert([{ hours: parseFloat(hours), user_id: user.id }]);
        setHours('');
        alert("Sleep logged!");
    };

    return (
        <div className="max-w-xl mx-auto p-6 mt-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Sleep Tracker</h1>
            <form onSubmit={logSleep} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Hours Slept Last Night</label>
                <input type="number" step="0.5" className="w-full border border-gray-200 p-4 rounded-xl mb-6 text-2xl" value={hours} onChange={(e) => setHours(e.target.value)} required />
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">Log Sleep</button>
            </form>
        </div>
    );
};
export default Sleep;