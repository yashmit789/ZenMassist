import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Health = () => {
    const { user } = useAuth();
    const [water, setWater] = useState('');
    const [exercise, setExercise] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const logHealth = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setSuccess(false);

        try {
            const response = await fetch(`${BACKEND_URL}/api/data/health`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Sends the secure session cookie
                body: JSON.stringify({ 
                    water_glasses: water, 
                    exercise_minutes: exercise 
                })
            });

            if (response.ok) {
                setWater('');
                setExercise('');
                setSuccess(true);
                // Reset success message after a few seconds
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const errData = await response.json();
                console.error("Failed to log health data:", errData);
                alert("Error saving stats. Please check your connection.");
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
                <h1 className="text-4xl font-black text-gray-900 mb-2">Health Logs</h1>
                <p className="text-gray-500 italic">Fuel your body, focus your mind.</p>
            </div>

            <form onSubmit={logHealth} className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-50 space-y-8 relative overflow-hidden">
                {/* Success Message */}
                {success && (
                    <div className="absolute top-0 left-0 w-full bg-green-500 text-white py-2 text-sm font-bold text-center animate-bounce">
                        Stats saved for today! 🥤🏃
                    </div>
                )}

                <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                        Glasses of Water
                    </label>
                    <div className="flex items-center gap-4">
                        <input 
                            type="number" 
                            className="flex-1 bg-blue-50 border-none p-5 rounded-2xl text-2xl font-bold text-blue-700 outline-none focus:ring-4 focus:ring-blue-100 transition" 
                            value={water} 
                            onChange={(e) => setWater(e.target.value)} 
                            placeholder="0"
                            required 
                        />
                        <span className="text-2xl">💧</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                        Exercise Minutes
                    </label>
                    <div className="flex items-center gap-4">
                        <input 
                            type="number" 
                            className="flex-1 bg-green-50 border-none p-5 rounded-2xl text-2xl font-bold text-green-700 outline-none focus:ring-4 focus:ring-green-100 transition" 
                            value={exercise} 
                            onChange={(e) => setExercise(e.target.value)} 
                            placeholder="0"
                            required 
                        />
                        <span className="text-2xl">⚡</span>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-green-100 hover:bg-green-700 hover:shadow-none transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Today\'s Stats'}
                </button>
            </form>

            <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <p className="text-gray-500 text-xs text-center leading-relaxed">
                    Logging your physical health helps <strong>Zen AI</strong> provide better wellness insights 
                    regarding your productivity and focus levels.
                </p>
            </div>
        </div>
    );
};

export default Health;