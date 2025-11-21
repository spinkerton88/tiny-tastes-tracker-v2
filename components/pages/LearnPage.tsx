
import React, { useState } from 'react';
import { guidesData, researchData } from '../../constants';
import { askResearchAssistant } from '../../services/geminiService';
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

const LearnPage: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState<{ answer: string; sources: any[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAskAI = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setAiResponse(null);
        try {
            const response = await askResearchAssistant(query);
            if (!response.answer) {
                setError("The AI assistant couldn't find an answer to your question based on the available research. Please try rephrasing your question.");
            } else {
                setAiResponse(response);
            }
        } catch (err) {
            setError('An error occurred while fetching the answer. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-gray-800">Learning Hub</h2>
                <div className="mt-6 space-y-3">
                    {guidesData.map((guide, index) => (
                        <Accordion key={index} title={guide.title} icon={guide.icon} defaultOpen={true}>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: guide.content }}></div>
                        </Accordion>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-start gap-4">
                    <Icon name="brain-circuit" className="w-8 h-8 text-violet-500 flex-shrink-0 mt-1" />
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800">AI-Powered Research Assistant</h2>
                        <p className="text-sm text-gray-600 mt-2">Ask a question about baby-led weaning, and our AI will search peer-reviewed journals and research studies to give you a cited answer.</p>
                    </div>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <input 
                        type="text" 
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
                        placeholder="e.g., What does research say about gagging vs choking?" 
                        className="flex-grow block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    />
                    <button 
                        onClick={handleAskAI}
                        disabled={isLoading}
                        className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
                    >
                        {isLoading ? <div className="spinner h-5 w-5 border-2"></div> : <><Icon name="search" className="w-4 h-4" /> Ask</>}
                    </button>
                </div>
                {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
                {aiResponse && (
                    <div className="mt-6 border-t pt-4">
                        <div 
                            className="prose-static prose-sm max-w-none" 
                            dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(aiResponse.answer) }} 
                        />
                        {aiResponse.sources && aiResponse.sources.length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-md font-semibold text-gray-700">Sources</h4>
                                <ol className="list-decimal list-outside pl-5 mt-2 space-y-1 text-xs">
                                    {aiResponse.sources
                                        .filter(source => source && source.web && source.web.uri)
                                        .map((source, index) => (
                                        <li key={`${source.web.uri}-${index}`} id={`source-${index + 1}`} className="text-gray-600">
                                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                {source.web.title || source.web.uri}
                                            </a>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Essential BLW Guidelines</h3>
                <p className="text-sm text-gray-600 mb-6">This information is for educational purposes only. Always consult with your pediatrician for personalized medical advice.</p>
                <div className="space-y-3">
                    {researchData.map((item, index) => (
                        <Accordion key={item.title} title={item.title} icon={item.icon} defaultOpen={index === 0}>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.content }} />
                        </Accordion>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LearnPage;
