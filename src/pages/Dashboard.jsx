import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const { user } = useAuth();
    
    // Stats State
    const [stats, setStats] = useState({
        totalGoals: 0,
        completedGoals: 0,
        highestStreak: 0,
        habitCount: 0,
        avgSleep: 0,
        completionRate: 0
    });

    // Data State for UI components
    const [goals, setGoals] = useState([]);
    const [sleepData, setSleepData] = useState([]);
    const [loading, setLoading] = useState(true);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch the consolidated summary from your backend
                const response = await fetch(`${BACKEND_URL}/api/data/summary`, {
                    method: 'GET',
                    credentials: 'include' // CRITICAL: Sends the secure cookie
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // 1. Update basic stats
                    setStats(data.stats);

                    // 2. Save raw goals for the "Your Schedule" section
                    setGoals(data.rawGoals || []);

                    // 3. Format Sleep Data for Recharts
                    if (data.charts.sleepData && data.charts.sleepData.length > 0) {
                        const chartFormat = data.charts.sleepData.map(log => ({
                            name: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            hours: parseFloat(log.hours)
                        }));
                        setSleepData(chartFormat);
                    }
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchDashboardData();
    }, [user, BACKEND_URL]);

    // Grouping logic for the "Your Schedule" section
    const goalsByDate = goals.reduce((acc, goal) => {
        const date = goal.target_date || 'No Date';
        if (!acc[date]) acc[date] = [];
        acc[date].push(goal);
        return acc;
    }, {});

    if (loading) return <div className="p-10 text-center font-medium text-gray-500">Loading your wellness overview...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 mt-6">
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Welcome back</h1>
                <p className="text-gray-500 text-lg">Here's your productivity & wellness overview</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Active Goals</p>
                            <h2 className="text-4xl font-extrabold text-gray-800">{stats.activeGoals}</h2>
                        </div>
                        <div className="text-gray-400 text-xl">🎯</div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">{stats.completedCount} completed</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Habit Streaks</p>
                            <h2 className="text-4xl font-extrabold text-orange-500">{stats.totalStreak}</h2>
                        </div>
                        <div className="text-orange-400 text-xl">🔥</div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Across all habits</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Avg Sleep</p>
                            <h2 className="text-4xl font-extrabold text-blue-400">{stats.avgSleep}h</h2>
                        </div>
                        <div className="text-blue-400 text-xl">🌙</div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Last 7 days</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Progress</p>
                            <h2 className="text-4xl font-extrabold text-yellow-500">{stats.progress}%</h2>
                        </div>
                        <div className="text-yellow-500 text-xl">📈</div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Goals completion</p>
                </div>
            </div>

            {/* Schedule Section */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Schedule</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.keys(goalsByDate).length > 0 ? (
                        Object.keys(goalsByDate).map(date => (
                            <div key={date} className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                                <h3 className="font-bold text-blue-800 border-b border-gray-100 pb-3 mb-4">
                                    {date === 'No Date' ? 'Unscheduled' : new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </h3>
                                <ul className="space-y-4">
                                    {goalsByDate[date].map(goal => (
                                        <li key={goal.id} className="flex items-start gap-3">
                                            <span className="mt-0.5 text-sm">{goal.completed ? '✅' : '⏳'}</span>
                                            <p className={`font-semibold text-sm ${goal.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                                {goal.title}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-gray-400 italic">No goals found. Add some in the Work Goals tab!</div>
                    )}
                </div>
            </div>

            {/* Bottom Section: Sleep Graph & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 min-h-[350px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Sleep Pattern</h2>
                        <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full">LAST 7 DAYS</span>
                    </div>
                    
                    <div className="flex-1 w-full min-h-[200px]">
                        {sleepData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sleepData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#9CA3AF', fontSize: 12}} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#9CA3AF', fontSize: 12}} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="hours" 
                                        stroke="#3B82F6" 
                                        strokeWidth={3} 
                                        fillOpacity={1} 
                                        fill="url(#colorHours)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                No sleep data yet.
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 min-h-[350px] flex flex-col">
                    <h2 className="text-2xl font-bold text-gray-900 mb-auto">Exercise Activity</h2>
                    <div className="flex items-center justify-center flex-1 text-gray-400">
                        No exercise data yet. Start tracking your health!
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;