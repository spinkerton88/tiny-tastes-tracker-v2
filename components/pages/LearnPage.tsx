
import React, { useState, useRef, useEffect } from 'react';
import { LEARNING_RESOURCES } from '../../constants';
import { askResearchAssistant } from '../../services/geminiService';
import { AppMode } from '../../types';
import Accordion from '../ui/Accordion';
import Icon from '../ui/Icon';

const simpleMarkdownToHtml = (text: string) => {
    if (!text) return '';
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\[(\d+)\]/g, '<sup><a href="#source-$1" class="text-teal-600 no-underline hover:underline font-bold">[$1]</a></sup>');
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
}

const CollapsibleSources: React.FC<{ sources: any[] }> = ({ sources }) => {
    const [isOpen, setIsOpen] = useState(false);
    const validSources = sources.filter(source => source && source.web && source.web.uri);

    if (validSources.length === 0) return null;

    return (
        <div className="mt-3 pt-2 border-t border-gray-200/50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-teal-600 transition-colors mb-1 focus:outline-none"
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
                            className="inline-flex items-center gap-2 bg-white/80 border border-gray-200 hover:border-teal-400 hover:bg-white rounded-md px-2.5 py-1.5 transition-all text-left no-underline group max-w-full"
                        >
                            <span className="flex-shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-teal-100 text-[9px] font-bold text-teal-700">
                                {index + 1}
                            </span>
                            <span className="text-[11px] text-gray-600 truncate max-w-[180px] group-hover:text-teal-800 font-medium">
                                {source.web.title || 'Source'}
                            </span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

const LearnPage: React.FC<LearnPageProps> = ({ mode }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const content = LEARNING_RESOURCES[mode];

    // Smart scrolling logic
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        if (isLoading) {
             // When loading, scroll to bottom to show spinner
             container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
             return;
        }

        if (messages.length === 0) return;
        
        const lastMsg = messages[messages.length - 1];

        if (lastMsg.role === 'user') {
            // User sent a message: scroll to bottom
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        } else if (lastMsg.role === 'model') {
            // AI Replied: scroll to the TOP of the response
            setTimeout(() => {
                const msgElement = document.getElementById(`msg-${lastMsg.id}`);
                if (msgElement) {
                    // Scroll container to the element's top position minus some padding
                    // This prevents the whole page from bouncing
                    container.scrollTo({ 
                        top: msgElement.offsetTop - 24, 
                        behavior: 'smooth' 
                    });
                }
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
            // Prepare history for API (exclude current message as it's passed separately, and sources)
            const history = messages.map(m => ({ role: m.role, text: m.text }));
            
            const response = await askResearchAssistant(history, textToAsk);
            
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: response.answer,
                sources: response.sources,
                suggestedQuestions: response.suggestedQuestions
            };
            
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "I'm sorry, I encountered an error while searching. Please try again."
            };
            setMessages(prev => [...prev, errorMsg]);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Primary Feature: AI Chat */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sage AI</h2>
                
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 bg-gray-50 border-b flex items-center gap-3">
                        <div className="p-2 bg-violet-100 rounded-full">
                            <Icon name="brain-circuit" className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Ask Sage</h2>
                            <p className="text-xs text-gray-500">Get instant answers about feeding, safety, and development.</p>
                        </div>
                    </div>

                    {/* Chat Area - Added relative positioning for accurate scrolling */}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white scroll-smooth relative">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
                                <Icon name="message-square" className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm font-medium text-gray-500">I'm Sage, your research assistant.</p>
                                <p className="text-xs mt-2 max-w-xs mx-auto">
                                    {mode === 'NEWBORN' ? 'Try asking: "How many wet diapers per day?" or "Signs of growth spurt?"' : 
                                     mode === 'TODDLER' ? 'Try asking: "Healthy snack ideas" or "How to handle food throwing?"' :
                                     'Try asking: "What foods are high in iron?" or "How do I serve steak safely?"'}
                                </p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                id={`msg-${msg.id}`}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div 
                                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-teal-600 text-white rounded-tr-none' 
                                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                    }`}
                                >
                                    {msg.role === 'user' ? (
                                        <p>{msg.text}</p>
                                    ) : (
                                        <>
                                            <div 
                                                className="prose-static prose-sm max-w-none prose-p:my-1 prose-a:text-blue-600" 
                                                dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(msg.text) }} 
                                            />
                                            
                                            {/* Collapsible Sources */}
                                            {msg.sources && msg.sources.length > 0 && (
                                                <CollapsibleSources sources={msg.sources} />
                                            )}

                                            {/* Suggested Questions */}
                                            {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                                                <div className="mt-4 pt-2 border-t border-gray-200/50">
                                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-wider">Suggested Questions</p>
                                                    <div className="flex flex-col gap-2">
                                                        {msg.suggestedQuestions.map((question, idx) => (
                                                            <button 
                                                                key={idx}
                                                                onClick={() => handleAskAI(question)}
                                                                className="text-left text-xs bg-white border border-violet-200 hover:bg-violet-50 hover:border-violet-300 text-violet-700 px-3 py-2 rounded-lg transition-colors shadow-sm"
                                                            >
                                                                {question}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
                                placeholder="Type your question..." 
                                className="flex-grow block w-full rounded-full border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm px-4 py-3"
                                disabled={isLoading}
                            />
                            <button 
                                onClick={() => handleAskAI()}
                                disabled={isLoading || !query.trim()}
                                className="inline-flex justify-center items-center p-3 border border-transparent rounded-full shadow-sm text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Icon name="send" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Section: Common Questions */}
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Icon name="book-open" className="w-5 h-5 text-teal-600" />
                    Common Questions & Resources ({mode === 'EXPLORER' ? '6-12m' : mode.charAt(0) + mode.slice(1).toLowerCase()})
                </h3>
                <div className="space-y-3">
                    {/* Mode Specific Guides */}
                    {content.guides.map((guide, index) => (
                        <Accordion key={`guide-${index}`} title={guide.title} icon={guide.icon} defaultOpen={false}>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: guide.content }}></div>
                        </Accordion>
                    ))}
                    
                    {/* Mode Specific Research Data */}
                    {content.research.map((item, index) => (
                        <Accordion key={`research-${index}`} title={item.title} icon={item.icon} defaultOpen={false}>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.content }} />
                        </Accordion>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LearnPage;
