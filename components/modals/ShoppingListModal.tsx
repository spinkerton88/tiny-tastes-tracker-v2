import React, { useState, useEffect } from 'react';
import { Recipe, MealPlan } from '../../types';
import { categorizeShoppingList } from '../../services/geminiService';
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

const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ recipes, mealPlan, onClose }) => {
    const [categorizedList, setCategorizedList] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEmpty, setIsEmpty] = useState(false);

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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-semibold text-gray-800">Weekly Shopping List</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
                </div>
                <div className="p-6 modal-scroll-content">
                    {loading ? (
                        <div className="text-center p-6">
                            <div className="spinner mx-auto"></div>
                            <p className="mt-4 text-sm text-gray-600">Categorizing list with AI...</p>
                        </div>
                    ) : isEmpty ? (
                        <EmptyState
                            illustration={<NoMealsIllustration />}
                            title="No Meals Planned"
                            message="Add recipes to your meal plan for the current week to generate a shopping list."
                        />
                    ) : (
                        <div className="prose-static">
                            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
                            {Object.entries(categorizedList).map(([category, items]) => (
                                <div key={category}>
                                    <h4 className="text-md font-semibold text-teal-700 mt-3">{category}</h4>
                                    <ul className="list-disc list-outside pl-5 space-y-1">
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
