
import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, MealPlan, TriedFoodLog } from '../../types';
import { categorizeShoppingList } from '../../services/geminiService';
import { allFoods } from '../../constants';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';

const parseIngredients = (text: string) => {
    if (typeof text !== 'string') return [];
    return text.split('\n')
        .map(line => line.trim().replace(/^[\*\-\s]|^(\d+\.\s)/, ''))
        .filter(line => line.length > 0);
};

interface ShoppingListModalProps {
    recipes: Recipe[];
    mealPlan: MealPlan;
    triedFoods: TriedFoodLog[];
    onClose: () => void;
}

const NoMealsIllustration = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20,25 L28,70 H72 L80,25 Z" />
        <circle cx="35" cy="80" r="5" />
        <circle cx="65" cy="80" r="5" />
        <line x1="20" y1="25" x2="80" y2="25"/>
        <line x1="45" y1="25" x2="55" y2="10" />
    </svg>
);

const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ recipes, mealPlan, triedFoods, onClose }) => {
    const [categorizedList, setCategorizedList] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addedItems, setAddedItems] = useState<string[]>([]);
    
    // Manual Add State
    const [manualInput, setManualInput] = useState('');
    const [showRecipeAdder, setShowRecipeAdder] = useState(false);

    // Calculate Top 5 Favorites (Reaction >= 5)
    const favorites = useMemo(() => {
        const counts: Record<string, number> = {};
        triedFoods.forEach(log => {
            if (log.reaction >= 5) {
                counts[log.id] = (counts[log.id] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([id]) => id);
    }, [triedFoods]);

    const toggleAddedItem = (item: string) => {
        if (addedItems.includes(item)) {
            setAddedItems(prev => prev.filter(i => i !== item));
        } else {
            setAddedItems(prev => [...prev, item]);
        }
    };

    const handleAddManualItem = () => {
        if (manualInput.trim()) {
            toggleAddedItem(manualInput.trim());
            setManualInput('');
        }
    };

    const handleAddRecipeIngredients = (recipe: Recipe) => {
        const ingredients = parseIngredients(recipe.ingredients);
        setAddedItems(prev => {
            const newSet = new Set([...prev, ...ingredients]);
            return Array.from(newSet);
        });
        setShowRecipeAdder(false);
    };

    useEffect(() => {
        const generateList = async () => {
            setLoading(true);
            setError(null);
            
            const allIngredients = new Set<string>();
            const weekStartDate = new Date(); // Assuming current week for simplicity
            weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay() + (weekStartDate.getDay() === 0 ? -6 : 1));

            for (let i = 0; i < 7; i++) {
                const dayDate = new Date(weekStartDate);
                dayDate.setDate(weekStartDate.getDate() + i);
                const dateStr = dayDate.toISOString().split('T')[0];
                const dayPlan = mealPlan[dateStr];

                if (dayPlan) {
                    for (const meal of Object.values(dayPlan)) {
                         if (meal && typeof meal === 'object' && 'id' in meal && typeof (meal as any).id === 'string') {
                            const recipe = recipes.find(r => r.id === (meal as { id: string }).id);
                            if (recipe && recipe.ingredients) {
                                parseIngredients(recipe.ingredients).forEach(ing => allIngredients.add(ing));
                            }
                        }
                    }
                }
            }
            
            const ingredientsList = [...allIngredients];
            if (ingredientsList.length === 0) {
                setLoading(false);
                return;
            }

            try {
                const categories = await categorizeShoppingList(ingredientsList);
                
                // Robust validation of AI response
                const validatedCategories: Record<string, string[]> = {};
                let isValid = true;
                if (typeof categories === 'object' && categories !== null && !Array.isArray(categories)) {
                    for (const [key, value] of Object.entries(categories)) {
                        if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
                            validatedCategories[key] = value;
                        } else {
                            isValid = false;
                            break;
                        }
                    }
                } else {
                    isValid = false;
                }
                
                if (isValid && Object.keys(validatedCategories).length > 0) {
                    setCategorizedList(validatedCategories);
                } else {
                    throw new Error("AI response was not in the expected format.");
                }
            } catch (err) {
                setError("AI categorization failed. Displaying a simple list.");
                setCategorizedList({ 'All Items': ingredientsList });
            } finally {
                setLoading(false);
            }
        };

        generateList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recipes, mealPlan]);

    const isPlanEmpty = Object.keys(categorizedList).length === 0;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[500]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-semibold text-gray-800">Shopping List</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
                </div>
                
                <div className="p-4 bg-gray-50 border-b space-y-3">
                    {/* Manual Entry */}
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddManualItem()}
                            placeholder="Add item (e.g. Diapers)..."
                            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm"
                        />
                        <button onClick={handleAddManualItem} className="bg-teal-600 text-white px-3 rounded-lg hover:bg-teal-700">
                            <Icon name="plus" className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Add Recipe Ingredients */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowRecipeAdder(!showRecipeAdder)}
                            className="text-xs font-bold text-teal-700 flex items-center gap-1 hover:underline"
                        >
                            <Icon name="plus-circle" className="w-3 h-3" /> Add ingredients from a Saved Plate
                        </button>
                        
                        {showRecipeAdder && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto p-2">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">Select a Plate</h4>
                                {recipes.length > 0 ? recipes.map(recipe => (
                                    <button 
                                        key={recipe.id}
                                        onClick={() => handleAddRecipeIngredients(recipe)}
                                        className="w-full text-left px-3 py-2 hover:bg-teal-50 rounded-lg text-sm text-gray-700 flex justify-between items-center"
                                    >
                                        <span className="truncate">{recipe.title}</span>
                                        <Icon name="plus" className="w-3 h-3 text-teal-500" />
                                    </button>
                                )) : (
                                    <p className="text-xs text-gray-400 px-2 pb-2">No saved recipes.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 modal-scroll-content overflow-y-auto">
                    {/* Manual / Quick Adds Category */}
                    {addedItems.length > 0 && (
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6">
                            <h4 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
                                <Icon name="shopping-basket" className="w-4 h-4"/> Added Items
                            </h4>
                            <ul className="space-y-2">
                                {addedItems.map((item, index) => (
                                    <li key={`added-${index}`} className="flex items-center justify-between group">
                                        <span className="flex items-center gap-2 text-indigo-900 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                            {item}
                                        </span>
                                        <button onClick={() => toggleAddedItem(item)} className="text-indigo-300 hover:text-red-500">
                                            <Icon name="x" className="w-3 h-3" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center p-6">
                            <div className="spinner mx-auto"></div>
                            <p className="mt-4 text-sm text-gray-600">Checking your meal plan...</p>
                        </div>
                    ) : isPlanEmpty && addedItems.length === 0 ? (
                        <EmptyState
                            illustration={<NoMealsIllustration />}
                            title="List is Empty"
                            message="Add items manually or plan some meals to auto-generate a list."
                        >
                            {/* Favorites Quick Add */}
                            {favorites.length > 0 && (
                                <div className="mt-6 text-left w-full">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 text-center">Quick Add Favorites</h4>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {favorites.map(foodName => {
                                            const foodObj = allFoods.flatMap(c => c.items).find(f => f.name === foodName);
                                            const emoji = foodObj?.emoji || '🍎';
                                            return (
                                                <button
                                                    key={foodName}
                                                    onClick={() => toggleAddedItem(foodName)}
                                                    className="text-xs px-3 py-1.5 rounded-full border bg-white text-gray-700 border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-all flex items-center gap-1.5"
                                                >
                                                    <span>{emoji}</span> {foodName}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </EmptyState>
                    ) : (
                        <div className="prose-static space-y-6">
                            {error && <p className="text-sm text-red-600 mb-4 bg-red-50 p-2 rounded">{error}</p>}
                            
                            {/* AI Categorized Items */}
                            {Object.entries(categorizedList).map(([category, items]) => (
                                <div key={category}>
                                    <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider border-b border-gray-100 pb-1 mb-2">{category}</h4>
                                    <ul className="space-y-1">
                                        {(items as string[]).map((item, index) => (
                                            <li key={index} className="flex items-start gap-2 text-gray-700 text-sm pl-2">
                                                <div className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0"></div>
                                                <span className="leading-snug">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShoppingListModal;
