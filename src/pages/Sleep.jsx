import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Sleep = () => {
    const { user } = useAuth();
    const [hours, setHours] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const logSleep = async (e) => {
        e.preventDefault();
        if (!hours || loading) return;

        setLoading(true);
        setSuccess(false);

        try {
            const response = await fetch(`${BACKEND_URL}/api/data/sleep`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Sends the secure cookie
                body: JSON.stringify({ hours: parseFloat(hours) })
            });

            if (response.ok) {
                setHours('');
                setSuccess(true);
                // Hide success message after 3 seconds
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const err = await response.json();
                console.error("Failed to log sleep:", err);
                alert("Error logging sleep. Please try again.");
            }
        } catch (error) {
            console.error("Network error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 mt-12">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-black text-gray-900 mb-2">Sleep Tracker</h1>
                <p className="text-gray-500">Rest is productive. How did you sleep?</p>
            </div>

            <form onSubmit={logSleep} className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-50 text-center relative overflow-hidden">
                {/* Success Banner */}
                {success && (
                    <div className="absolute top-0 left-0 w-full bg-green-500 text-white py-2 text-sm font-bold animate-pulse">
                        Sleep logged successfully! 🌙
                    </div>
                )}

                <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">
                    Hours Slept Last Night
                </label>
                
                <div className="relative inline-block mb-8">
                    <input 
                        type="number" 
                        step="0.5" 
                        min="0" 
                        max="24"
                        className="w-48 text-center bg-gray-50 border-none p-6 rounded-3xl text-5xl font-black text-blue-600 outline-none focus:ring-4 focus:ring-blue-100 transition" 
                        value={hours} 
                        onChange={(e) => setHours(e.target.value)} 
                        placeholder="0"
                        required 
                    />
                    <span className="absolute -right-10 bottom-4 text-gray-300 font-bold text-xl uppercase">hrs</span>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-none transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? 'Logging...' : 'Log Sleep Data'}
                </button>
            </form>

            <div className="mt-10 grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                    <p className="text-blue-800 font-bold text-sm">Pro Tip</p>
                    <p className="text-blue-600 text-xs mt-1">Aim for 7-9 hours to maximize cognitive performance for your TI prep.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                    <p className="text-purple-800 font-bold text-sm">Dashboard</p>
                    <p className="text-purple-600 text-xs mt-1">Check your insights to see how sleep affects your goal completion.</p>
                </div>
            </div>
        </div>
    );
};

export default Sleep;