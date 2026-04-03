import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

const Insights = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // 1. Fetch history from BACKEND on load
    const fetchChatHistory = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/ai/history`, {
                method: 'GET',
                credentials: 'include' // Sends the secure cookie
            });
            const data = await response.json();
            
            if (response.ok) {
                setMessages(data);
            } else if (response.status === 401) {
                console.error("Session expired on history fetch");
            }
        } catch (error) {
            console.error("Failed to load history:", error);
        }
    };

    useEffect(() => {
        if (user) fetchChatHistory();
    }, [user]);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userText = input;
        // Optimistic UI update (shows user message immediately)
        setMessages(prev => [...prev, { role: 'user', content: userText }]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message: userText })
            });

            const data = await response.json();

            if (response.ok && data.reply) {
                setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
            } else if (response.status === 401) {
                alert("Session expired. Please login again.");
                window.location.href = '/login';
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    // 2. Clear chat via BACKEND
    const handleClearChat = async () => {
        if (!window.confirm("Are you sure you want to clear your chat history?")) return;
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/ai/history`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setMessages([]);
            } else {
                alert("Failed to clear history.");
            }
        } catch (error) {
            console.error("Clear chat error:", error);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 h-[85vh] flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Zen AI Insights</h1>
                <button 
                    onClick={handleClearChat} 
                    className="text-red-500 text-sm font-medium hover:text-red-600 transition"
                >
                    Clear History
                </button>
            </div>

            <div className="flex-1 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                    {messages.length === 0 && !loading && (
                        <div className="h-full flex items-center justify-center text-gray-400 italic">
                            Start a conversation to see AI insights...
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-gray-900 text-white rounded-tr-none' 
                                : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-none'
                            }`}>
                                <div className="prose prose-sm max-w-none prose-invert">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl animate-pulse text-gray-400 text-sm">
                                Zen AI is thinking...
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t border-gray-50">
                    <input 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        className="flex-1 bg-gray-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 transition" 
                        placeholder="Ask Zen AI..."
                        disabled={loading}
                    />
                    <button 
                        type="submit" 
                        disabled={loading || !input.trim()} 
                        className="bg-blue-600 text-white px-8 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-200"
                    >
                        {loading ? '...' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Insights;