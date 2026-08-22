import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Sparkles, Loader2, 
  Trash2, BrainCircuit, ChevronRight, Terminal, Home
} from 'lucide-react';
import { processTextWithAI } from '../services/geminiService';
import { AIAction } from '../types';
import { marked } from 'marked';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AiLab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      // For the AI Lab, we use AIAction.EXPLAIN which acts as a general assistant.
      const response = await processTextWithAI(text, AIAction.EXPLAIN);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-panel animate-modern overflow-hidden">
      <header className="h-16 border-b border-base px-8 flex items-center justify-between bg-app/30 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate-home'))}
            className="p-2 rounded-xl hover:bg-white/5 text-muted hover:text-primary transition-all md:hidden"
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-primary">AI Research Lab</h2>
            <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">Powered by Gemini 3 Pro</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate-home'))}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-app border border-base text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary hover:border-accent transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            Back to Home
          </button>
          <button 
            onClick={clearChat}
            className="p-2.5 rounded-xl hover:bg-red-500/10 text-muted hover:text-red-500 transition-all"
            title="Clear Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-purple-500 to-accent flex items-center justify-center shadow-2xl shadow-purple-500/20">
                <Sparkles className="w-12 h-12 text-white animate-pulse" />
              </div>
              <div className="absolute -inset-4 bg-purple-500/20 blur-3xl -z-10 animate-pulse" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-3xl font-black tracking-tightest uppercase">Welcome to the Lab</h3>
              <p className="text-muted leading-relaxed">
                Experiment with advanced AI reasoning. Ask technical questions, request code reviews, or brainstorm complex document structures.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              {[
                "Explain PipeRun API integration",
                "Review my document structure",
                "Generate a complex JSON schema",
                "Optimize this SQL query"
              ].map(suggestion => (
                <button 
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="p-4 bg-app border border-base rounded-2xl text-xs font-bold text-muted hover:border-purple-500 hover:text-primary transition-all text-left group flex items-center justify-between"
                >
                  {suggestion}
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-modern`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              msg.role === 'user' 
                ? 'bg-accent text-white shadow-accent/20' 
                : 'bg-purple-500 text-white shadow-purple-500/20'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            
            <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className={`p-6 rounded-3xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-accent text-white' 
                  : 'bg-app border border-base text-primary'
              }`}>
                <div 
                  className="markdown-body prose prose-sm dark:prose-invert max-w-none text-gray-900 dark:text-gray-100" 
                  dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }} 
                />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted/40 px-2">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-6 animate-modern">
            <div className="w-10 h-10 rounded-2xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div className="bg-app border border-base p-6 rounded-3xl flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-app/30 backdrop-blur-xl border-t border-base">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-accent rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
          <div className="relative flex items-center bg-panel border-2 border-base rounded-[1.8rem] p-2 focus-within:border-purple-500 transition-all">
            <div className="pl-4 pr-2 text-muted">
              <Terminal className="w-5 h-5" />
            </div>
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask the AI Lab anything..."
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium py-3 px-2 text-primary placeholder:text-muted/50"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center hover:bg-purple-600 active:scale-95 transition-all disabled:opacity-20 shadow-xl shadow-purple-500/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-center mt-4 text-[9px] font-bold text-muted uppercase tracking-widest opacity-40">
          Experimental Lab • Responses may contain inaccuracies
        </p>
      </div>
    </div>
  );
};

export default AiLab;
