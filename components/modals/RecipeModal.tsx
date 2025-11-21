import React, { useState, useEffect } from 'react';
import { Recipe, RecipeFilter } from '../../types';

interface RecipeModalProps {
  onClose: () => void;
  onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  initialData?: Partial<Recipe>;
}

const mealTypes: RecipeFilter[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const RecipeModal: React.FC<RecipeModalProps> = ({ onClose, onSave, initialData }) => {
    const [title, setTitle] = useState('');
    const [selectedMealTypes, setSelectedMealTypes] = useState<Set<RecipeFilter>>(new Set());
    const [ingredients, setIngredients] = useState('');
    const [instructions, setInstructions] = useState('');
    const [tags, setTags] = useState('');

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setSelectedMealTypes(new Set(initialData.mealTypes || []));
            // Ensure ingredients and instructions are always strings
            setIngredients(Array.isArray(initialData.ingredients) ? initialData.ingredients.join('\n') : initialData.ingredients || '');
            setInstructions(Array.isArray(initialData.instructions) ? initialData.instructions.join('\n') : initialData.instructions || '');
            setTags((initialData.tags || []).join(', '));
        }
    }, [initialData]);

    const handleMealTypeToggle = (type: RecipeFilter) => {
        const newSet = new Set(selectedMealTypes);
        if (newSet.has(type)) {
            newSet.delete(type);
        } else {
            newSet.add(type);
        }
        setSelectedMealTypes(newSet);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) {
            alert("Recipe title is required.");
            return;
        }
        onSave({
            title,
            ingredients,
            instructions,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            mealTypes: Array.from(selectedMealTypes),
        });
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[500]">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-semibold">Add New Recipe</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">X</button>
                </div>
                <div className="p-6 modal-scroll-content space-y-4">
                    <div>
                        <label htmlFor="recipe-title" className="block text-sm font-medium text-gray-700">Recipe Title</label>
                        <input type="text" id="recipe-title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Meal Type (Optional)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                            {mealTypes.map(type => (
                                <button key={type} type="button" onClick={() => handleMealTypeToggle(type)} className={`capitalize p-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 ${selectedMealTypes.has(type) ? 'modal-btn-selected' : ''}`}>{type}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="recipe-ingredients" className="block text-sm font-medium text-gray-700">Ingredients</label>
                        <textarea id="recipe-ingredients" value={ingredients} onChange={e => setIngredients(e.target.value)} rows={5} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm" placeholder="e.g.,&#10;- 1 cup oats&#10;- 1/2 banana, mashed"></textarea>
                    </div>
                    <div>
                        <label htmlFor="recipe-instructions" className="block text-sm font-medium text-gray-700">Instructions</label>
                        <textarea id="recipe-instructions" value={instructions} onChange={e => setInstructions(e.target.value)} rows={7} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm" placeholder="e.g.,&#10;1. Mix all ingredients."></textarea>
                    </div>
                    <div>
                        <label htmlFor="recipe-tags" className="block text-sm font-medium text-gray-700">Custom Tags (comma separated)</label>
                        <input type="text" id="recipe-tags" value={tags} onChange={e => setTags(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm" placeholder="e.g., muffin, 6m+, egg-free" />
                    </div>
                </div>
                <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">Save Recipe</button>
                </div>
            </form>
        </div>
    );
};

export default RecipeModal;