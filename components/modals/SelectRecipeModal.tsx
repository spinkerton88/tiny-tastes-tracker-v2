
import React from 'react';
import { Recipe } from '../../types';
import Icon from '../ui/Icon';

interface SelectRecipeModalProps {
    recipes: Recipe[];
    meal: string;
    onClose: () => void;
    onSelect: (recipe: Recipe) => void;
}

const SelectRecipeModal: React.FC<SelectRecipeModalProps> = ({ recipes, meal, onClose, onSelect }) => {
    const filteredRecipes = recipes.filter(recipe => {
        if (!recipe.mealTypes || recipe.mealTypes.length === 0) return true;
        return recipe.mealTypes.includes(meal as any);
    });

    const getIngredientsPreview = (ingredients: string): string => {
        if (!ingredients) return '';
        return ingredients.replace(/\n/g, ', ');
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[500]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-semibold text-gray-800">Select a Recipe for {meal}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
                </div>
                <div className="p-2 modal-scroll-content">
                    {filteredRecipes.length > 0 ? (
                        filteredRecipes.map(recipe => (
                            <button key={recipe.id} onClick={() => onSelect(recipe)} className="block w-full text-left p-3 rounded-md transition-colors hover:bg-teal-50">
                                <h4 className="font-medium text-teal-600">{recipe.title}</h4>
                                <p className="text-sm text-gray-600 line-clamp-2">{getIngredientsPreview(recipe.ingredients)}</p>
                            </button>
                        ))
                    ) : (
                        <p className="p-4 text-center text-gray-500">No recipes found for "{meal}". You can add recipes from the "My Recipes" tab.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SelectRecipeModal;
