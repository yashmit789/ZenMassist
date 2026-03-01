import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';

const Insights = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [userContext, setUserContext] = useState('');
    const chatEndRef = useRef(null);

    // Initialize Gemini SDK directly on the frontend
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

    useEffect(() => {
        if (user) {
            fetchChatHistory();
            fetchUserContext();
        }
    }, [user]);

    // Auto-scroll to the bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 1. Fetch User's Data to give the AI context
    // 1. Fetch User's Data to give the AI context
    // 1. Fetch User's Data to give the AI context
    const fetchUserContext = async () => {
        const { data: goals } = await supabase
            .from('goals')
            .select('title, description')
            .eq('completed', false)
            .eq('user_id', user.id);
        const { data: habits } = await supabase.from('habits').select('name, streak').eq('user_id', user.id);
        const { data: sleep } = await supabase.from('sleep_logs').select('hours').order('date', {ascending: false}).limit(1);
        let contextString = `You are Zen AI, an intelligent and conversational assistant inside the "ZenFlow" app. 

        CRITICAL RULES CONCERNING USER DATA:
        1. PASSIVE KNOWLEDGE ONLY: You possess the user's active goals, but you MUST NEVER mention them, ask about them, or bring them up unless the user EXPLICITLY asks about their goals, tasks, or wellness.
        2. NO FORCED PIVOTS: If the user asks a general knowledge question (e.g., history, coding, science, trivia), answer it directly and concisely. DO NOT pivot the conversation back to their goals. DO NOT append phrases like "By the way, how are your goals?" at the end of a factual answer.
        3. BE NORMAL: If the user is just chatting, just chat back. Match their energy and length.
        4. Use Google Search to ground your answers for factual or real-time questions.

        USER DATA (STRICTLY FOR BACKGROUND CONTEXT):
        `;

        if (goals && goals.length > 0) contextString += `- Active Goals: ${goals.map(g => g.title).join(', ')}\n`;
        if (habits && habits.length > 0) contextString += `- Habits Tracked: ${habits.map(h => `${h.name} (${h.streak} day streak)`).join(', ')}\n`;
        if (sleep && sleep.length > 0) contextString += `- Hours slept last night: ${sleep[0].hours} hours\n`;

        contextString += `EXAMPLES OF DESIRED BEHAVIOR:
        User: "Who is the prime minister of India?"
        Zen AI: "The Prime Minister of India is Narendra Modi." (Notice: No mention of goals, no unsolicited advice).
        
        User: "What should I focus on today?"
        Zen AI: "Looking at your list, you have [Goal Name]. Would you like to tackle that, or are you looking to start something new?"
        
        User: "hi"
        Zen AI: "Hi there! How can I help you today?"`;

        setUserContext(contextString);
    };

    // 2. Fetch Chat History
    const fetchChatHistory = async () => {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
        
        if (error) console.error("Error loading chat:", error);
        if (data) setMessages(data);
    };

    // 3. Handle Sending Message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input;
        const userMessage = { role: 'user', content: userText };
        
        // Optimistically update UI
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Save user message to Supabase
            await supabase.from('chat_messages').insert([{ 
                role: 'user', 
                content: userText, 
                user_id: user.id 
            }]);

            // Format history for Gemini (Needs { role, parts: [{ text }] })
            const formattedHistory = messages.map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user', // Gemini strictly requires 'user' or 'model'
                parts: [{ text: msg.content }]
            }));

            // Initialize Model with Search Tool
            const model = genAI.getGenerativeModel({
                model: "gemini-3-flash-preview",
                systemInstruction: userContext,
                tools: [{ googleSearch: {} }] 
            });

            // Send to Gemini
            const chat = model.startChat({ history: formattedHistory });
            const result = await chat.sendMessage(userText);
            const botResponseText = result.response.text();

            const botMessage = { role: 'model', content: botResponseText };
            setMessages(prev => [...prev, botMessage]);

            // Save AI response to Supabase
            await supabase.from('chat_messages').insert([{ 
                role: 'model', 
                content: botResponseText, 
                user_id: user.id 
            }]);

        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { 
                role: 'model', 
                content: "Sorry, I ran into a network error. Your ISP might be acting up again!" 
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 mt-6 h-[85vh] flex flex-col">
            <div className="mb-6">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Zen AI Insights</h1>
                <p className="text-gray-500 text-lg">Your personal assistant, securely synced to your goals.</p>
            </div>

            {/* Chat Container */}
            <div className="flex-1 bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] rounded-3xl border border-gray-100 p-6 flex flex-col overflow-hidden">
                
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-4 mb-4 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-400 mt-10">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <p className="text-lg font-medium text-gray-600">Say hi to Zen AI!</p>
                            <p className="text-sm">Try asking: "Can you create a schedule for my active goals?"</p>
                        </div>
                    )}
                    
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-5 rounded-3xl shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-gray-900 text-white rounded-br-none' 
                                : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-none'
                            }`}>
                                <div className="text-sm md:text-base leading-relaxed flex flex-col gap-2">
    <ReactMarkdown>{msg.content}</ReactMarkdown>
</div>
                            </div>
                        </div>
                    ))}
                    
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-50 border border-gray-100 text-gray-500 p-5 rounded-3xl rounded-bl-none animate-pulse flex items-center gap-2 shadow-sm">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="flex gap-4 pt-4 border-t border-gray-100">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask for advice, research, or a wellness plan..."
                        className="flex-1 bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition text-gray-700 placeholder-gray-400"
                        disabled={loading}
                    />
                    <button 
                        type="submit" 
                        disabled={loading || !input.trim()}
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        <span>Send</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Insights;