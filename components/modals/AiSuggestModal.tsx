
import React, { useState } from 'react';
import { Recipe, UserProfile } from '../../types';
import { suggestRecipe } from '../../services/geminiService';
import { calculateAgeInMonths, getAppMode } from '../../utils';
import Icon from '../ui/Icon';

interface AiSuggestModalProps {
  onClose: () => void;
  onRecipeParsed: (recipe: Partial<Recipe>) => void;
  userProfile: UserProfile | null;
}

const HIDDEN_CATEGORIES = [
    { value: 'none', label: 'None (Normal Recipe)' },
    { value: 'Vegetables', label: 'Vegetables' },
    { value: 'Fruits', label: 'Fruits' },
    { value: 'Protein', label: 'Protein / Meat' },
];

const AiSuggestModal: React.FC<AiSuggestModalProps> = ({ onClose, onRecipeParsed, userProfile }) => {
    const [prompt, setPrompt] = useState('');
    const [hiddenCategory, setHiddenCategory] = useState('none');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mode = getAppMode(userProfile);

    const handleSubmit = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const ageInMonths = calculateAgeInMonths(userProfile?.birthDate);
            
            let finalPrompt = prompt;
            if (hiddenCategory !== 'none') {
                finalPrompt = `Create a recipe that hides ${hiddenCategory} using these ingredients: ${prompt}. The child is picky and dislikes ${hiddenCategory}, so mask the flavor/texture.`;
            }

            const recipeData = await suggestRecipe(finalPrompt, ageInMonths);
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

                    {mode === 'TODDLER' && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Picky Eater Mode</label>
                            <div className="bg-violet-50 p-3 rounded-lg border border-violet-100">
                                <p className="text-xs text-violet-800 mb-2">Need to hide a specific food group?</p>
                                <select 
                                    value={hiddenCategory} 
                                    onChange={(e) => setHiddenCategory(e.target.value)}
                                    className="block w-full rounded-md border-violet-300 text-sm focus:border-violet-500 focus:ring-violet-500"
                                >
                                    {HIDDEN_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button onClick={handleSubmit} disabled={loading} className="w-full inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50">
                         {loading ? <div className="spinner h-5 w-5 border-2"></div> : 'Generate Recipe Idea'}
                    </button>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                         <p className="text-xs text-gray-500 text-center">
                            <strong>Disclaimer:</strong> AI recipes may not be perfect. Always ensure textures are age-appropriate and safe for your baby.
                         </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiSuggestModal;
