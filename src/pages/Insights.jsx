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
    const fetchUserContext = async () => {
        const { data: goals, error: goalsError } = await supabase.from('goals').select('title, description').eq('completed', false).eq('user_id', user.id);
        const { data: habits, error: habitsError } = await supabase.from('habits').select('name, streak').eq('user_id', user.id);
        const { data: sleep, error: sleepError } = await supabase.from('sleep_logs').select('hours').order('date', {ascending: false}).limit(1);
        
        // Print exactly what Supabase gives us to the browser console
        console.log("--- SUPABASE FETCH TEST ---");
        console.log("Goals:", goals, "Error:", goalsError);
        console.log("Habits:", habits, "Error:", habitsError);
        console.log("Sleep:", sleep, "Error:", sleepError);
        
        let contextString = `You are Zen AI, an intelligent and conversational assistant inside the "ZenFlow" app.\n\n`;

        contextString += `USER DATA (STRICTLY FOR BACKGROUND CONTEXT):\n`;
        if (goals && goals.length > 0) contextString += `- Active Goals: ${goals.map(g => g.title + g.description).join(', ')}\n`;
        if (habits && habits.length > 0) contextString += `- Habits Tracked: ${habits.map(h => `${h.name} (${h.streak} day streak)`).join(', ')}\n`;
        if (sleep && sleep.length > 0) contextString += `- Hours slept last night: ${sleep[0].hours} hours\n\n`;

        contextString += `CRITICAL DIRECTIVES:
1. PASSIVE KNOWLEDGE ONLY: You possess the user's active goals, but you MUST NEVER mention them, ask about them, or bring them up unless the user EXPLICITLY asks about their goals, tasks, or wellness.
2. NO FORCED PIVOTS: Answer general questions directly and concisely. DO NOT pivot the conversation back to their goals.
3. BE NORMAL: If the user is just chatting (e.g. saying "hi"), just chat back normally.
4. ZERO INNER MONOLOGUE: You must NEVER output your thought process, rules, or planning. Do not use phrases like "The user said" or "I should respond".

OUTPUT FORMAT: Return ONLY the exact, final words you want to speak to the user. No preamble, no bullet points, no thinking out loud. Just the final draft.

EXAMPLES OF REQUIRED BEHAVIOR AND FORMAT:

Example 1 (Casual Chat):
User: "hey"
Zen AI:
Thinking: The user is greeting me briefly. I must match their energy and keep it short. I will not mention their goals since they didn't ask.
*Draft:* Hey there! How can I help you today?

Example 2 (Explicit Goal Request):
User: "what should i focus on today?"
Zen AI:
Thinking: The user explicitly asked about their focus/tasks. I am allowed to use the background data to tell them their goals.
*Draft:* Looking at your list, your main active goal right now is to fix the ZenFlow app. Would you like some help brainstorming that?

Example 3 (General Knowledge Question):
User: "how do i center a div in css?"
Zen AI:
Thinking: The user asked a technical question. I must answer directly and concisely. I must NOT pivot back to their goals or habits at the end of the message.
*Draft:* The easiest way to center a div is using Flexbox. Just add "display: flex; justify-content: center; align-items: center;" to the parent container!`;

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

            // Format history for Gemini
            const formattedHistory = messages.map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user', 
                parts: [{ text: msg.content }]
            }));

            // Initialize Model
            const model = genAI.getGenerativeModel({
                model: "gemma-4-26b-a4b-it",
                systemInstruction: userContext,
                tools: [{ googleSearch: {} }] 
            });

            // Send to Gemini
            const chat = model.startChat({ history: formattedHistory });
            const result = await chat.sendMessage(userText);
            let botResponseText = result.response.text();

            // --- START OF AI SANITIZER ---
            const triggerWords = ["*Draft:*", "Draft:", "Final Answer:", "Plan:", "Output:"];
            for (let word of triggerWords) {
                if (botResponseText.includes(word)) {
                    botResponseText = botResponseText.split(word).pop().trim();
                    break;
                }
            }
            // --- END OF AI SANITIZER ---

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

    // 4. Clear Chat History
    const handleClearChat = async () => {
        if (!window.confirm("Are you sure you want to clear your chat history?")) return;

        // 1. Instantly clear the screen
        setMessages([]);

        try {
            // 2. Delete from Supabase Database
            const { error } = await supabase
                .from('chat_messages')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;
            console.log("Chat history cleared successfully!");

        } catch (error) {
            console.error("Error clearing chat:", error);
            alert("Failed to clear chat history. Please try again.");
            fetchChatHistory();
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 mt-6 h-[85vh] flex flex-col">
            
            {/* Header Area with the Clear button */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Zen AI Insights</h1>
                    <p className="text-gray-500 text-lg">Your personal assistant, securely synced to your goals.</p>
                </div>
                
                {/* NEW CLEAR CHAT BUTTON */}
                {messages.length > 0 && (
                    <button 
                        onClick={handleClearChat}
                        className="text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition border border-transparent hover:border-red-100 flex items-center gap-2 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Clear History
                    </button>
                )}
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