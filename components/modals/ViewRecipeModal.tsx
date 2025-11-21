
import React from 'react';
import { Recipe } from '../../types';
import Icon from '../ui/Icon';

interface ViewRecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const formatRecipeText = (text: string) => {
    const lines = typeof text === 'string' ? text.split('\n') : [];
    if (lines.length === 0) return null;

    return lines.map((line, index) => {
        line = line.trim();
        if (line.startsWith('-') || line.startsWith('*')) {
            return <li key={index} className="ml-4">{line.substring(1).trim()}</li>;
        }
        if (/^\d+\./.test(line)) {
            return <li key={index} className="ml-4">{line.replace(/^\d+\./, '').trim()}</li>;
        }
        return line ? <p key={index}>{line}</p> : null;
    }).filter(Boolean);
};

const ViewRecipeModal: React.FC<ViewRecipeModalProps> = ({ recipe, onClose, onDelete }) => {
    const allTags = [...(recipe.mealTypes || []), ...(recipe.tags || [])];

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this recipe? This cannot be undone.")) {
            onDelete(recipe.id);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[500]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto flex flex-col">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-semibold text-teal-600">{recipe.title}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
                </div>
                <div className="p-6 modal-scroll-content prose-static">
                    <div className="mb-4 flex flex-wrap gap-2">
                        {allTags.length > 0 ? allTags.map(tag => (
                             <span key={tag} className={`text-xs ${['breakfast', 'lunch', 'dinner', 'snack'].includes(tag) ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'} px-2 py-0.5 rounded-full`}>{tag}</span>
                        )) : <span className="text-xs text-gray-500">No tags</span>}
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">Ingredients</h3>
                    <div className="mb-4 list-disc list-inside">{formatRecipeText(recipe.ingredients) || <p>No ingredients listed.</p>}</div>
                    <h3 className="text-lg font-medium text-gray-800">Instructions</h3>
                    <div className="list-decimal list-inside">{formatRecipeText(recipe.instructions) || <p>No instructions provided.</p>}</div>
                </div>
                <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 rounded-b-lg">
                    <button type="button" onClick={handleDelete} className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">Delete Recipe</button>
                </div>
            </div>
        </div>
    );
};

export default ViewRecipeModal;
