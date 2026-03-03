import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Sparkles, Loader2, BookOpen } from "lucide-react";
import { askAI } from "../services/Api";

const Chatbot = ({ initialContext = "", placeholder = "Ask anything about our book collection..." }) => {
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem("booksphere_chat_history");
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        }
        return [
            { role: "ai", content: "Hello! I am BookSphere's AI librarian. How can I help you discover your next great read today?" }
        ];
    });
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
        localStorage.setItem("booksphere_chat_history", JSON.stringify(messages));
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput("");

        // Add user message to UI
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            // If we have an initialContext (e.g. from Book Details page asking to read the book), we might prepend it
            const prompt = initialContext ? `Context: ${initialContext}\n\nUser Question: ${userMessage}` : userMessage;

            const res = await askAI(prompt);

            setMessages(prev => [...prev, {
                role: "ai",
                content: res.answer,
                bookContext: res.book,
                isCached: res.from_cache
            }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: "ai", content: "I'm having trouble connecting to the library archives right now. Please try again in a moment.", isError: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl overflow-hidden shadow-2xl relative border border-slate-700/50">
            {/* Header */}
            <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center gap-3 relative z-10">
                <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/20 shadow-inner">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-white font-bold tracking-wide flex items-center gap-2">
                        AI Librarian
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">Online</span>
                    </h3>
                    <p className="text-xs text-slate-400">Ask about books, summaries, or recommendations</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent min-h-[300px] max-h-[500px]">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-gradient-to-tr from-blue-600 to-blue-500 text-white' : 'bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 text-blue-400'
                            }`}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>

                        {/* Bubble */}
                        <div className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-3 rounded-2xl shadow-sm ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                : msg.isError
                                    ? 'bg-red-500/10 text-red-200 border border-red-500/20 rounded-tl-sm'
                                    : 'bg-white/10 text-slate-200 border border-white/5 rounded-tl-sm backdrop-blur-sm'
                                }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap font-[450]">{msg.content}</p>
                            </div>

                            {/* Metadata tags */}
                            <div className="flex gap-2 px-1">
                                {msg.isCached && (
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                        ⚡ Cached
                                    </span>
                                )}
                                {msg.bookContext && (
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full cursor-help hover:bg-blue-500/20 transition-colors" title={`Based on data for: ${msg.bookContext.title}`}>
                                        <BookOpen className="w-3 h-3" /> {msg.bookContext.title}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 text-blue-400 flex items-center justify-center shrink-0 shadow-lg">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/5 rounded-tl-sm flex items-center gap-3 backdrop-blur-sm shadow-sm">
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                            <span className="text-sm text-slate-400 font-medium tracking-wide">Reading the archives...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900/50 relative z-10 border-t border-white/5 backdrop-blur-md">
                <div className="flex items-end gap-2 bg-slate-800/80 border border-white/10 rounded-2xl p-2 transition-all focus-within:border-blue-500/50 focus-within:bg-slate-800 shadow-inner">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 px-3 py-2 text-sm outline-none resize-none max-h-32 min-h-[44px] scrollbar-thin scrollbar-thumb-white/20"
                        rows="1"
                        style={{ minHeight: '44px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-gradient-to-tr from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl transition-all disabled:opacity-50 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 shrink-0 shadow-md transform active:scale-95"
                    >
                        <Send className="w-4.5 h-4.5" />
                    </button>
                </div>
            </div>

            {/* Decorative Blur */}
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        </div>
    );
};

export default Chatbot;
