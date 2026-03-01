import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);

    
    // Add these state variables at the top of Dashboard.jsx
    const [habitCount, setHabitCount] = useState(0);
    const [avgSleep, setAvgSleep] = useState(0);

    // Update your useEffect to fetch the new data
    useEffect(() => {
        if (user) {
            // Fetch Goals (Already doing this)
            supabase.from('goals').select('*').order('target_date', { ascending: true })
                .then(({ data }) => setGoals(data || []));
            
            // Fetch Habit Count
            supabase.from('habits').select('*', { count: 'exact', head: true })
                .then(({ count }) => setHabitCount(count || 0));
            
            // Fetch Avg Sleep
            supabase.from('sleep_logs').select('hours')
                .then(({ data }) => {
                    if (data && data.length > 0) {
                        const total = data.reduce((acc, log) => acc + parseFloat(log.hours), 0);
                        setAvgSleep((total / data.length).toFixed(1));
                    }
                });
        }
    }, [user]);

    // Calculate Dashboard Stats
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.completed).length;
    const completionRate = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

    // Group goals by Date for Schedule
    const goalsByDate = goals.reduce((acc, goal) => {
        const date = goal.target_date || 'No Date';
        if (!acc[date]) acc[date] = [];
        acc[date].push(goal);
        return acc;
    }, {});

    return (
        <div className="max-w-6xl mx-auto p-6 mt-6">
            {/* Original Beautiful Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Welcome back</h1>
                <p className="text-gray-500 text-lg">Here's your productivity & wellness overview</p>
            </div>

            {/* Original 4-Card Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {/* Card 1: Active Goals (Dynamic) */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Active Goals</p>
                            <h2 className="text-4xl font-extrabold text-gray-800">{totalGoals}</h2>
                        </div>
                        <div className="text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><circle cx="12" cy="12" r="6" strokeWidth="2"/><circle cx="12" cy="12" r="2" strokeWidth="2"/></svg>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">{completedGoals} completed</p>
                </div>

                {/* Card 2: Habit Streaks (Static for now) */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Habit Streaks</p>
                            <h2 className="text-4xl font-extrabold text-orange-500">0</h2>
                        </div>
                        <div className="text-orange-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">0 habits tracked</p>
                </div>

                {/* Card 3: Avg Sleep (Static for now) */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Avg Sleep</p>
                            <h2 className="text-4xl font-extrabold text-blue-400">0h</h2>
                        </div>
                        <div className="text-blue-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Last 7 days</p>
                </div>

                {/* Card 4: Progress (Dynamic) */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Progress</p>
                            <h2 className="text-4xl font-extrabold text-yellow-500">{completionRate}%</h2>
                        </div>
                        <div className="text-yellow-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Goals completion</p>
                </div>
            </div>

            {/* Styled Schedule Section */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Schedule</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.keys(goalsByDate).map(date => (
                        <div key={date} className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                            <h3 className="font-bold text-blue-800 border-b border-gray-100 pb-3 mb-4">
                                {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </h3>
                            <ul className="space-y-4">
                                {goalsByDate[date].map(goal => (
                                    <li key={goal.id} className="flex items-start gap-3">
                                        <span className="mt-0.5 text-sm">{goal.completed ? '✅' : '⏳'}</span>
                                        <div>
                                            <p className={`font-semibold text-sm ${goal.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                                {goal.title}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {Object.keys(goalsByDate).length === 0 && (
                        <div className="col-span-full bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
                            No upcoming goals scheduled.
                        </div>
                    )}
                </div>
            </div>

            {/* Original Bottom Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 min-h-[300px] flex flex-col">
                    <h2 className="text-2xl font-bold text-gray-900 mb-auto">Sleep Pattern</h2>
                    <div className="flex items-center justify-center flex-1 text-gray-400">
                        No sleep data yet. Start tracking your sleep!
                    </div>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 min-h-[300px] flex flex-col">
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