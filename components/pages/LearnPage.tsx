
import React, { useState, useRef, useEffect } from 'react';
import { LEARNING_RESOURCES } from '../../constants';
import { askResearchAssistant } from '../../services/geminiService';
import { AppMode } from '../../types';
import Accordion from '../ui/Accordion';
import Icon from '../ui/Icon';

const simpleMarkdownToHtml = (text: string, baseColor: string = 'teal') => {
    if (!text) return '';
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\[(\d+)\]/g, `<sup><a href="#source-$1" class="text-${baseColor}-600 no-underline hover:underline font-bold">[$1]</a></sup>`);
    return html.split('\n').map(p => p.trim()).filter(p => p.length > 0).map(p => `<p>${p}</p>`).join('');
};

interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    sources?: any[];
    suggestedQuestions?: string[];
}

interface LearnPageProps {
    mode: AppMode;
    baseColor?: string;
    onStartLiveSage: () => void;
}

const CollapsibleSources: React.FC<{ sources: any[], baseColor: string }> = ({ sources, baseColor }) => {
    const [isOpen, setIsOpen] = useState(false);
    const validSources = Array.isArray(sources) ? sources.filter(source => source && source.web && source.web.uri) : [];

    if (validSources.length === 0) return null;

    return (
        <div className="mt-3 pt-2 border-t border-gray-200/50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-${baseColor}-600 transition-colors mb-1 focus:outline-none`}
            >
                <Icon name={isOpen ? "chevron-down" : "chevron-right"} className="w-3.5 h-3.5" />
                <span>{isOpen ? 'Hide Sources' : `Show Research Sources (${validSources.length})`}</span>
            </button>

            {isOpen && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {validSources.map((source, index) => (
                        <a 
                            key={`${source.web.uri}-${index}`} 
                            id={`source-${index + 1}`}
                            href={source.web.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`inline-flex items-center gap-2 bg-white/80 border border-gray-200 hover:border-${baseColor}-400 hover:bg-white rounded-md px-2.5 py-1.5 transition-all text-left no-underline group max-w-full`}
                        >
                            <span className={`flex-shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-${baseColor}-100 text-[9px] font-bold text-${baseColor}-700`}>
                                {index + 1}
                            </span>
                            <span className={`text-[11px] text-gray-600 truncate max-w-[180px] group-hover:text-${baseColor}-800 font-medium`}>
                                {source.web.title || 'Source'}
                            </span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

const LearnPage: React.FC<LearnPageProps> = ({ mode, baseColor = 'teal', onStartLiveSage }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const content = LEARNING_RESOURCES[mode] || { guides: [], research: [] };

    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;
        if (isLoading || messages.length === 0) {
             container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
             return;
        }
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'user') {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        } else if (lastMsg.role === 'model') {
            setTimeout(() => {
                const msgElement = document.getElementById(`msg-${lastMsg.id}`);
                if (msgElement) container.scrollTo({ top: msgElement.offsetTop - 24, behavior: 'smooth' });
            }, 100);
        }
    }, [messages, isLoading]);

    const handleAskAI = async (overrideQuestion?: string) => {
        const textToAsk = overrideQuestion || query;
        if (!textToAsk.trim()) return;
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToAsk };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setIsLoading(true);
        try {
            const history = messages.map(m => ({ role: m.role, text: m.text }));
            const response = await askResearchAssistant(history, textToAsk);
            const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: response.answer, sources: response.sources, suggestedQuestions: response.suggestedQuestions };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            const errorMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: "I encountered an error. Please try again." };
            setMessages(prev => [...prev, errorMsg]);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Live Sage CTA */}
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                    <Icon name="mic" className="w-48 h-48" />
                </div>
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center animate-pulse">
                         <Icon name="mic" className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                        <h3 className="text-2xl font-black mb-2 leading-tight">Try Sage Live</h3>
                        <p className="text-violet-100 text-sm font-medium mb-4">Hands messy? Talk to Sage in real-time about feeding safety, portions, and quick recipes.</p>
                        <button 
                            onClick={onStartLiveSage}
                            className="bg-white text-violet-600 px-6 py-2.5 rounded-full font-bold text-sm shadow-lg hover:bg-violet-50 transition-colors active:scale-95"
                        >
                            Start Voice Assistant
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Research Lab</h2>
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 bg-gray-50 border-b flex items-center gap-3">
                        <div className="p-2 bg-violet-100 rounded-full"><Icon name="brain-circuit" className="w-5 h-5 text-violet-600" /></div>
                        <div><h2 className="text-lg font-semibold text-gray-800">Ask Sage</h2><p className="text-xs text-gray-500">Research-backed answers for every stage.</p></div>
                    </div>

                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white scroll-smooth relative">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
                                <Icon name="message-square" className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm font-medium text-gray-500">I'm Sage, your research assistant.</p>
                                <p className="text-xs mt-2 max-w-xs mx-auto">Try asking: "What foods are high in iron?" or "How do I serve steak safely?"</p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} id={`msg-${msg.id}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? `bg-${baseColor}-600 text-white rounded-tr-none` : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                                    {msg.role === 'user' ? <p>{msg.text}</p> : (
                                        <>
                                            <div className="prose-static prose-sm max-w-none prose-p:my-1" dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(msg.text, baseColor) }} />
                                            {msg.sources && msg.sources.length > 0 && <CollapsibleSources sources={msg.sources} baseColor={baseColor} />}
                                            {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                                                <div className="mt-4 pt-2 border-t border-gray-200/50">
                                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-wider">Suggested Questions</p>
                                                    <div className="flex flex-col gap-2">
                                                        {msg.suggestedQuestions.map((question, idx) => (
                                                            <button key={idx} onClick={() => handleAskAI(question)} className="text-left text-xs bg-white border border-violet-200 hover:bg-violet-50 hover:border-violet-300 text-violet-700 px-3 py-2 rounded-lg transition-colors shadow-sm">{question}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && <div className="flex justify-start"><div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div></div></div>}
                    </div>

                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="flex gap-2">
                            <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAskAI()} placeholder="Type your question..." className="flex-grow block w-full rounded-full border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm px-4 py-3" disabled={isLoading} />
                            <button onClick={() => handleAskAI()} disabled={isLoading || !query.trim()} className="inline-flex justify-center items-center p-3 border border-transparent rounded-full shadow-sm text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><Icon name="send" className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><Icon name="book-open" className={`w-5 h-5 text-${baseColor}-600`} /> Resource Library</h3>
                <div className="space-y-3">
                    {content.guides.map((guide, index) => (
                        <Accordion key={`guide-${index}`} title={guide.title} icon={guide.icon} defaultOpen={false} baseColor={baseColor}><div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: guide.content }}></div></Accordion>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LearnPage;
