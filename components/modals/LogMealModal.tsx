
import React, { useState } from 'react';
import { Recipe, RecipeFilter } from '../../types';
import { flatFoodList, allFoods } from '../../constants';
import Icon from '../ui/Icon';

interface LogMealModalProps {
    recipes: Recipe[];
    onClose: () => void;
    onSave: (foodNames: string[], date: string, meal: string) => void;
    baseColor?: string;
}

const LogMealModal: React.FC<LogMealModalProps> = ({ recipes, onClose, onSave, baseColor = 'teal' }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [meal, setMeal] = useState<RecipeFilter>('lunch');
    const [activeTab, setActiveTab] = useState<'foods' | 'recipe'>('foods');
    
    // Tab 1: Food Selection
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFoods, setSelectedFoods] = useState<Set<string>>(new Set());

    // Tab 2: Recipe Selection
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');

    const filteredFoods = flatFoodList.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));

    const toggleFood = (food: string) => {
        const newSet = new Set(selectedFoods);
        if (newSet.has(food)) newSet.delete(food);
        else newSet.add(food);
        setSelectedFoods(newSet);
    };

    const handleSave = () => {
        let foodsToLog: string[] = [];

        if (activeTab === 'foods') {
            foodsToLog = Array.from(selectedFoods);
        } else {
            const recipe = recipes.find(r => r.id === selectedRecipeId);
            if (recipe) {
                // Heuristic to extract known foods from recipe ingredients
                const combinedText = (recipe.title + ' ' + recipe.ingredients).toUpperCase();
                flatFoodList.forEach(food => {
                    // Simple check if food name exists in recipe text
                    // Adding spaces to avoid partial matches like "PEA" matching "PEAR"
                    if (combinedText.includes(food) || combinedText.includes(food.slice(0, -1))) { // crude singular check
                         foodsToLog.push(food);
                    }
                });
                
                // Fallback: If no ingredients matched (unlikely), just log nothing or handle gracefully?
                // For now, if empty, we might just log nothing but the action is recorded. 
                // But let's alert user if 0 foods found.
                if (foodsToLog.length === 0) {
                    alert("We couldn't automatically match ingredients to our food list. Please log individual foods using the 'Select Foods' tab for accurate tracking.");
                    return;
                }
            }
        }

        if (foodsToLog.length === 0) {
            alert("Please select at least one food to log.");
            return;
        }

        onSave(foodsToLog, date, meal);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[500]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-semibold text-gray-800">Log Meal</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
                </div>

                <div className="p-4 border-b bg-gray-50 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Date</label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={(e) => setDate(e.target.value)} 
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${baseColor}-500 focus:ring-${baseColor}-500 sm:text-sm`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Meal</label>
                        <select 
                            value={meal} 
                            onChange={(e) => setMeal(e.target.value as RecipeFilter)}
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${baseColor}-500 focus:ring-${baseColor}-500 sm:text-sm capitalize`}
                        >
                            {['breakfast', 'lunch', 'dinner', 'snack'].map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex border-b">
                    <button 
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'foods' ? `border-b-2 border-${baseColor}-600 text-${baseColor}-600 bg-white` : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('foods')}
                    >
                        Select Foods
                    </button>
                    <button 
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'recipe' ? `border-b-2 border-${baseColor}-600 text-${baseColor}-600 bg-white` : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('recipe')}
                    >
                        From Recipe
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 modal-scroll-content">
                    {activeTab === 'foods' ? (
                        <>
                            <div className="relative mb-3">
                                <Icon name="search" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search foods..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full pl-9 rounded-md border-gray-300 shadow-sm focus:border-${baseColor}-500 focus:ring-${baseColor}-500 sm:text-sm`}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {filteredFoods.map(food => {
                                    // Find emoji for display
                                    const foodObj = allFoods.flatMap(c => c.items).find(f => f.name === food);
                                    const isSelected = selectedFoods.has(food);
                                    return (
                                        <button 
                                            key={food} 
                                            onClick={() => toggleFood(food)}
                                            className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${isSelected ? `bg-${baseColor}-50 border-${baseColor}-500 ring-1 ring-${baseColor}-500` : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <span className="text-xl">{foodObj?.emoji || '🍽️'}</span>
                                            <span className={`text-sm font-medium truncate ${isSelected ? `text-${baseColor}-900` : 'text-gray-700'}`}>{food}</span>
                                            {isSelected && <Icon name="check" className={`ml-auto w-4 h-4 text-${baseColor}-600`} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                            {recipes.length > 0 ? recipes.map(recipe => (
                                <button 
                                    key={recipe.id}
                                    onClick={() => setSelectedRecipeId(recipe.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${selectedRecipeId === recipe.id ? `bg-${baseColor}-50 border-${baseColor}-500 ring-1 ring-${baseColor}-500` : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                >
                                    <h4 className={`font-semibold ${selectedRecipeId === recipe.id ? `text-${baseColor}-900` : 'text-gray-800'}`}>{recipe.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{recipe.ingredients.replace(/\n/g, ', ')}</p>
                                </button>
                            )) : (
                                <p className="text-center text-gray-500 py-8">No recipes saved yet.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50">
                    <button 
                        onClick={handleSave}
                        className={`w-full py-2 px-4 rounded-md shadow-sm text-sm font-bold text-white bg-${baseColor}-600 hover:bg-${baseColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${baseColor}-500`}
                    >
                        Log {activeTab === 'foods' ? `${selectedFoods.size} Foods` : 'Meal'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogMealModal;
