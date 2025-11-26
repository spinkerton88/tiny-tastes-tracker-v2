
import React, { useState } from 'react';
import { Recipe, UserProfile } from '../../types';
import { suggestRecipe } from '../../services/geminiService';
import { calculateAgeInMonths } from '../../utils';
import Icon from '../ui/Icon';

interface AiSuggestModalProps {
  onClose: () => void;
  onRecipeParsed: (recipe: Partial<Recipe>) => void;
  userProfile: UserProfile | null;
}

const AiSuggestModal: React.FC<AiSuggestModalProps> = ({ onClose, onRecipeParsed, userProfile }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const ageInMonths = calculateAgeInMonths(userProfile?.birthDate);
            const recipeData = await suggestRecipe(prompt, ageInMonths);
            onRecipeParsed(recipeData);
        } catch (err: any) {
            setError(err.message || "Failed to generate recipe.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[500]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-semibold text-violet-600 flex items-center gap-2">
                        <Icon name="refrigerator" className="w-5 h-5" />
                        What's in the Fridge?
                    </h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">Enter a few ingredients you have on hand, and we'll create a baby-safe recipe for you!</p>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Your Ingredients</label>
                        <textarea 
                            value={prompt} 
                            onChange={e => setPrompt(e.target.value)} 
                            placeholder="e.g., Spinach, Greek Yogurt, and Sweet Potato..." 
                            rows={3}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm" 
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button onClick={handleSubmit} disabled={loading} className="w-full inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50">
                         {loading ? <div className="spinner h-5 w-5 border-2"></div> : 'Generate Recipe Idea'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiSuggestModal;
