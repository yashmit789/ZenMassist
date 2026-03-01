import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const GoalTracker = () => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const { user } = useAuth();

  // 1. Fetch Goals from Supabase on load
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching goals:', error);
    else setGoals(data);
  };

  // 2. Add a new Goal
  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.trim()) return;

    const { data, error } = await supabase
      .from('goals')
      .insert([{ title: newGoal, user_id: user.id }])
      .select();

    if (error) {
      alert(error.message);
    } else {
      setGoals([data[0], ...goals]); // Update UI instantly
      setNewGoal('');
    }
  };

  // 3. Toggle Completion
  const toggleGoal = async (id, isCompleted) => {
    const { error } = await supabase
      .from('goals')
      .update({ completed: !isCompleted })
      .eq('id', id);

    if (!error) {
      setGoals(goals.map(g => g.id === id ? { ...g, completed: !isCompleted } : g));
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">My Wellness Goals</h2>
      
      {/* Input Form */}
      <form onSubmit={handleAddGoal} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          placeholder="e.g., Meditate for 10 mins"
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
          Add
        </button>
      </form>

      {/* Goals List */}
      <ul className="space-y-3">
        {goals.map((goal) => (
          <li key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className={goal.completed ? "line-through text-gray-400" : "text-gray-800"}>
              {goal.title}
            </span>
            <input
              type="checkbox"
              checked={goal.completed}
              onChange={() => toggleGoal(goal.id, goal.completed)}
              className="w-5 h-5 accent-green-500 cursor-pointer"
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GoalTracker;