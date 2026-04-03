import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [habitCount, setHabitCount] = useState(0);
    const [highestStreak, setHighestStreak] = useState(0);
    const [avgSleep, setAvgSleep] = useState(0);
    const [sleepData, setSleepData] = useState([]); // State for the graph

    useEffect(() => {
        if (user) {
            // 1. Fetch Goals
            supabase.from('goals').select('*').order('target_date', { ascending: true })
                .then(({ data }) => setGoals(data || []));
            
            // 2. Fetch Habits & Streaks
            supabase.from('habits').select('streak')
                .then(({ data }) => {
                    if (data) {
                        setHabitCount(data.length);
                        const maxStreak = data.length > 0 ? Math.max(...data.map(h => h.streak || 0)) : 0;
                        setHighestStreak(maxStreak);
                    }
                });
            
            // 3. Fetch Sleep Data for Graph & Average
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const formattedDate = sevenDaysAgo.toISOString().split('T')[0];

            supabase.from('sleep_logs')
                .select('date, hours')
                .gte('date', formattedDate)
                .order('date', { ascending: true })
                .then(({ data }) => {
                    if (data && data.length > 0) {
                        // Calculate Average
                        const total = data.reduce((acc, log) => acc + parseFloat(log.hours), 0);
                        setAvgSleep((total / data.length).toFixed(1));

                        // Format for Recharts (e.g., "2026-04-01" -> "Apr 1")
                        const chartFormat = data.map(log => ({
                            name: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            hours: parseFloat(log.hours)
                        }));
                        setSleepData(chartFormat);
                    } else {
                        setAvgSleep(0);
                        setSleepData([]);
                    }
                });
        }
    }, [user]);

    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.completed).length;
    const completionRate = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

    const goalsByDate = goals.reduce((acc, goal) => {
        const date = goal.target_date || 'No Date';
        if (!acc[date]) acc[date] = [];
        acc[date].push(goal);
        return acc;
    }, {});

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
                            <h2 className="text-4xl font-extrabold text-gray-800">{totalGoals}</h2>
                        </div>
                        <div className="text-gray-400">🎯</div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">{completedGoals} completed</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Habit Streaks</p>
                            <h2 className="text-4xl font-extrabold text-orange-500">{highestStreak}</h2>
                        </div>
                        <div className="text-orange-400">🔥</div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">{habitCount} habits tracked</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Avg Sleep</p>
                            <h2 className="text-4xl font-extrabold text-blue-400">{avgSleep}h</h2>
                        </div>
                        <div className="text-blue-400">🌙</div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Last 7 days</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Progress</p>
                            <h2 className="text-4xl font-extrabold text-yellow-500">{completionRate}%</h2>
                        </div>
                        <div className="text-yellow-500">📈</div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Goals completion</p>
                </div>
            </div>

            {/* Schedule Section */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Schedule</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.keys(goalsByDate).map(date => (
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
                    ))}
                </div>
            </div>

            {/* Bottom Section: Sleep Graph & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* DYNAMIC SLEEP PATTERN CHART */}
                <div className="bg-white p-8 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 min-h-[350px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Sleep Pattern</h2>
                        <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full">LAST 7 DAYS</span>
                    </div>
                    
                    <div className="flex-1 w-full h-full min-h-[200px]">
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
                                No sleep data yet. Start tracking your sleep!
                            </div>
                        )}
                    </div>
                </div>

                {/* Exercise Activity Placeholder */}
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