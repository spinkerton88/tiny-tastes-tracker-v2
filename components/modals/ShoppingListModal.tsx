
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
    const [isEmpty, setIsEmpty] = useState(false);
    const [addedItems, setAddedItems] = useState<string[]>([]);

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

    const toggleQuickAdd = (item: string) => {
        if (addedItems.includes(item)) {
            setAddedItems(prev => prev.filter(i => i !== item));
        } else {
            setAddedItems(prev => [...prev, item]);
        }
    };

    useEffect(() => {
        const generateList = async () => {
            setLoading(true);
            setError(null);
            setIsEmpty(false);
            
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
                setIsEmpty(true);
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

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[500]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-semibold text-gray-800">Weekly Shopping List</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
                </div>
                <div className="p-6 modal-scroll-content overflow-y-auto">
                    {/* Quick Add Favorites Section */}
                    {favorites.length > 0 && (
                        <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Icon name="heart" className="w-3.5 h-3.5" /> Quick Add Favorites
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {favorites.map(foodName => {
                                    const foodObj = allFoods.flatMap(c => c.items).find(f => f.name === foodName);
                                    const emoji = foodObj?.emoji || '🍎';
                                    const isAdded = addedItems.includes(foodName);
                                    return (
                                        <button
                                            key={foodName}
                                            onClick={() => toggleQuickAdd(foodName)}
                                            className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 font-medium ${
                                                isAdded
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                                                : 'bg-white text-gray-700 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50'
                                            }`}
                                        >
                                            <span>{emoji}</span> {foodName} {isAdded && <Icon name="check" className="w-3 h-3" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center p-6">
                            <div className="spinner mx-auto"></div>
                            <p className="mt-4 text-sm text-gray-600">Categorizing planned meals with AI...</p>
                        </div>
                    ) : isEmpty && addedItems.length === 0 ? (
                        <EmptyState
                            illustration={<NoMealsIllustration />}
                            title="No Meals Planned"
                            message="Add recipes to your meal plan or tap your Favorites above to start a list."
                        />
                    ) : (
                        <div className="prose-static space-y-4">
                            {error && <p className="text-sm text-red-600 mb-4 bg-red-50 p-2 rounded">{error}</p>}
                            
                            {/* Quick Added Items Category */}
                            {addedItems.length > 0 && (
                                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                                    <h4 className="text-md font-bold text-indigo-700 mb-2 flex items-center gap-2">
                                        <Icon name="shopping-basket" className="w-4 h-4"/> Quick Adds
                                    </h4>
                                    <ul className="list-none space-y-2 pl-1">
                                        {addedItems.map((item, index) => (
                                            <li key={`added-${index}`} className="flex items-center gap-2 text-indigo-900 text-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* AI Categorized Items */}
                            {Object.entries(categorizedList).map(([category, items]) => (
                                <div key={category}>
                                    <h4 className="text-md font-semibold text-teal-700 mt-2 border-b border-gray-100 pb-1 mb-2">{category}</h4>
                                    <ul className="list-disc list-outside pl-5 space-y-1 text-gray-700">
                                        {(items as string[]).map((item, index) => <li key={index}>{item}</li>)}
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
