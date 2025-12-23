
import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, MealPlan, TriedFoodLog, ManualShoppingItem } from '../../types';
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
    manualItems: ManualShoppingItem[];
    checkedItems: Record<string, string>; // Maps itemName -> ISO string date
    onAddManualItem: (name: string) => void;
    onToggleItem: (name: string, isChecked: boolean) => void;
    onClearChecked: () => void;
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

const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ 
    recipes, 
    mealPlan, 
    triedFoods, 
    manualItems, 
    checkedItems, 
    onAddManualItem, 
    onToggleItem, 
    onClearChecked, 
    onClose 
}) => {
    const [categorizedList, setCategorizedList] = useState<Record<string, string[]>>({});
    const [planIngredients, setPlanIngredients] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
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

    const handleAddManualItemClick = () => {
        if (manualInput.trim()) {
            onAddManualItem(manualInput.trim());
            setManualInput('');
        }
    };

    const handleAddRecipeIngredients = (recipe: Recipe) => {
        const ingredients = parseIngredients(recipe.ingredients);
        ingredients.forEach(ing => onAddManualItem(ing));
        setShowRecipeAdder(false);
    };

    // Derived full list of items to categorize (Plan + Manual)
    const allItemsToCategorize = useMemo(() => {
        const manualNames = manualItems.map(i => i.name);
        // Combine sets to avoid duplicates
        return Array.from(new Set([...planIngredients, ...manualNames]));
    }, [planIngredients, manualItems]);

    // Load Plan Ingredients
    useEffect(() => {
        const allIngredients = new Set<string>();
        const weekStartDate = new Date(); 
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
        setPlanIngredients(Array.from(allIngredients));
    }, [recipes, mealPlan]);

    // AI Categorization Effect
    useEffect(() => {
        const generateList = async () => {
            if (allItemsToCategorize.length === 0) {
                setCategorizedList({});
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // Check if we have cached categories or if we need to call AI
                // For simplicity in this demo, we call AI if the count is small or just once. 
                // A better approach would be to cache locally.
                
                const categories = await categorizeShoppingList(allItemsToCategorize);
                
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
                console.error(err);
                // Fallback: Dump everything in "Uncategorized"
                setCategorizedList({ 'Items': allItemsToCategorize });
            } finally {
                setLoading(false);
            }
        };

        generateList();
    }, [allItemsToCategorize]);

    const isListEmpty = allItemsToCategorize.length === 0;
    const hasCheckedItems = Object.keys(checkedItems).length > 0;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[500]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-semibold text-gray-800">Shopping List</h2>
                    <div className="flex items-center gap-2">
                        {hasCheckedItems && (
                            <button onClick={onClearChecked} className="text-xs font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors">
                                Clear Checked
                            </button>
                        )}
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><Icon name="x" /></button>
                    </div>
                </div>
                
                <div className="p-4 bg-gray-50 border-b space-y-3">
                    {/* Manual Entry */}
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddManualItemClick()}
                            placeholder="Add item (e.g. Diapers)..."
                            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm"
                        />
                        <button onClick={handleAddManualItemClick} className="bg-teal-600 text-white px-3 rounded-lg hover:bg-teal-700">
                            <Icon name="plus" className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Add Recipe Ingredients */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowRecipeAdder(!showRecipeAdder)}
                            className="text-xs font-bold text-teal-700 flex items-center gap-1 hover:underline"
                        >
                            <Icon name="plus-circle" className="w-3 h-3" /> Add from Saved Plate
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
                    {loading ? (
                        <div className="text-center p-6">
                            <div className="spinner mx-auto"></div>
                            <p className="mt-4 text-sm text-gray-600">Organizing your list...</p>
                        </div>
                    ) : isListEmpty ? (
                        <EmptyState
                            illustration={<NoMealsIllustration />}
                            title="List is Empty"
                            message="Add items manually or plan some meals to auto-generate a list."
                        >
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
                                                    onClick={() => onAddManualItem(foodName)}
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
                        <div className="space-y-6">
                            {error && <p className="text-sm text-red-600 mb-4 bg-red-50 p-2 rounded">{error}</p>}
                            
                            {/* Categories */}
                            {Object.entries(categorizedList).map(([category, items]) => {
                                // Filter out checked items for the main list if we wanted to move them to bottom, 
                                // but for now we just show them strikethrough.
                                const categoryItems = items as string[];
                                
                                return (
                                    <div key={category}>
                                        <h4 className="text-sm font-bold text-teal-800 uppercase tracking-wider border-b border-teal-100 pb-1 mb-2">{category}</h4>
                                        <ul className="space-y-2">
                                            {categoryItems.map((item, index) => {
                                                const isChecked = !!checkedItems[item];
                                                const checkedDate = checkedItems[item];
                                                
                                                return (
                                                    <li key={`${category}-${index}`} className={`flex items-start justify-between group p-2 rounded-lg transition-colors ${isChecked ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                                                        <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => onToggleItem(item, !isChecked)}>
                                                            <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-teal-500 border-teal-500' : 'bg-white border-gray-300'}`}>
                                                                {isChecked && <Icon name="check" className="w-3.5 h-3.5 text-white" />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className={`text-sm leading-snug ${isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item}</span>
                                                                {isChecked && checkedDate && (
                                                                    <span className="text-[10px] text-teal-600 font-medium">Added to cart on {new Date(checkedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShoppingListModal;
