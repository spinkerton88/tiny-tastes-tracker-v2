
import React, { useState } from 'react';
import { Recipe, RecipeFilter, MealPlan, TriedFoodLog, Food, CustomFood } from '../../types';
import { flatFoodList, allFoods } from '../../constants';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';

interface RecipesPageProps {
    recipes: Recipe[];
    mealPlan: MealPlan;
    triedFoods?: TriedFoodLog[];
    customFoods?: CustomFood[];
    onShowAddRecipe: () => void;
    onShowImportRecipe: () => void;
    onShowSuggestRecipe: () => void;
    onViewRecipe: (recipe: Recipe) => void;
    onAddToPlan: (date: string, meal: string) => void;
    onShowShoppingList: () => void;
    onBatchLog?: (foodNames: string[], date: string, meal: string) => void;
    onCreateRecipe?: (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'rating'>) => void;
    onFoodClick?: (food: Food) => void;
    baseColor?: string;
}

const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

const formatDateString = (date: Date) => date.toISOString().split('T')[0];

const NoRecipesIllustration = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M25,15 h50 a5,5 0 0 1 5,5 v60 a5,5 0 0 1 -5,5 h-50 a5,5 0 0 1 -5,-5 v-60 a5,5 0 0 1 5,-5 z" />
        <line x1="28" y1="15" x2="28" y2="85" />
        <path d="M40 30 H 70 M 40 40 H 70 M 40 50 H 60" strokeDasharray="3 3" />
        <path d="M 45 60 H 65 L 55 75 Z" />
    </svg>
);

const StarRatingDisplay: React.FC<{ rating: number }> = ({ rating }) => {
    return (
        <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                    key={star}
                    name="star"
                    className={`w-3 h-3 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                />
            ))}
        </div>
    );
};

const LogMealView: React.FC<{ 
    recipes: Recipe[], 
    triedFoods: TriedFoodLog[],
    customFoods?: CustomFood[],
    onSave: (foodNames: string[], date: string, meal: string) => void, 
    onCreateRecipe?: (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'rating'>) => void;
    onFoodClick?: (food: Food) => void;
    baseColor: string 
}> = ({ recipes, triedFoods, customFoods = [], onSave, onCreateRecipe, onFoodClick, baseColor }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [meal, setMeal] = useState<RecipeFilter>('lunch');
    const [activeTab, setActiveTab] = useState<'foods' | 'recipe'>('foods');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFoods, setSelectedFoods] = useState<Set<string>>(new Set());
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
    
    // Save as Recipe State
    const [saveAsRecipe, setSaveAsRecipe] = useState(false);
    const [recipeName, setRecipeName] = useState('');

    const filteredFoods = flatFoodList.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));

    // Get log history for current week relative to selected date
    const selectedDateObj = new Date(date);
    const startOfWeek = getStartOfWeek(selectedDateObj);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weeklyLogs = triedFoods.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startOfWeek && logDate <= endOfWeek;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Group logs by date and meal for display
    const historyGrouped: Record<string, Record<string, string[]>> = {};
    weeklyLogs.forEach(log => {
        if (!historyGrouped[log.date]) historyGrouped[log.date] = {};
        if (!historyGrouped[log.date][log.meal]) historyGrouped[log.date][log.meal] = [];
        historyGrouped[log.date][log.meal].push(log.id);
    });

    const toggleFood = (food: string) => {
        const newSet = new Set(selectedFoods);
        if (newSet.has(food)) newSet.delete(food);
        else newSet.add(food);
        setSelectedFoods(newSet);
    };

    const handleSaveLog = () => {
        let foodsToLog: string[] = [];

        if (activeTab === 'foods') {
            foodsToLog = Array.from(selectedFoods);
        } else {
            const recipe = recipes.find(r => r.id === selectedRecipeId);
            if (recipe) {
                const combinedText = (recipe.title + ' ' + recipe.ingredients).toUpperCase();
                flatFoodList.forEach(food => {
                    if (combinedText.includes(food) || combinedText.includes(food.slice(0, -1))) {
                         foodsToLog.push(food);
                    }
                });
                
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

        // Handle Save as Recipe Logic
        if (activeTab === 'foods' && saveAsRecipe && onCreateRecipe) {
            if (!recipeName.trim()) {
                alert("Please enter a name for your new recipe.");
                return;
            }
            onCreateRecipe({
                title: recipeName,
                ingredients: foodsToLog.join(', '),
                instructions: 'Combine ingredients and serve.',
                tags: ['Quick Log'],
                mealTypes: [meal]
            });
        }

        onSave(foodsToLog, date, meal);
        setSelectedFoods(new Set());
        setSelectedRecipeId('');
        setSaveAsRecipe(false);
        setRecipeName('');
        alert("Meal logged!");
    };

    const handleFoodItemClick = (foodName: string) => {
        if (!onFoodClick) return;
        
        // Find the Food object
        let foodObj = allFoods.flatMap(c => c.items).find(f => f.name === foodName);
        
        // If not found in standard foods, check custom foods
        if (!foodObj) {
            foodObj = customFoods.find(f => f.name === foodName);
        }
        
        // Fallback if somehow still not found (e.g., imported legacy data)
        if (!foodObj) {
            foodObj = { name: foodName, emoji: '🍽️' };
        }
        
        onFoodClick(foodObj);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b grid grid-cols-2 gap-4">
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

                <div className="p-4 h-64 overflow-y-auto">
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
                
                {/* Save as Recipe Option */}
                {activeTab === 'foods' && selectedFoods.size > 0 && onCreateRecipe && (
                    <div className={`px-4 py-3 bg-${baseColor}-50 border-t border-${baseColor}-100`}>
                        <div className="flex items-center gap-2 mb-2">
                            <input 
                                type="checkbox" 
                                id="saveRecipeInline" 
                                checked={saveAsRecipe} 
                                onChange={(e) => setSaveAsRecipe(e.target.checked)}
                                className={`rounded border-gray-300 text-${baseColor}-600 focus:ring-${baseColor}-500`}
                            />
                            <label htmlFor="saveRecipeInline" className={`text-sm font-medium text-${baseColor}-800`}>Save combination as a Recipe?</label>
                        </div>
                        {saveAsRecipe && (
                            <div className="animate-fadeIn">
                                <input 
                                    type="text" 
                                    placeholder="e.g., Avocado Toast Plate" 
                                    value={recipeName}
                                    onChange={(e) => setRecipeName(e.target.value)}
                                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${baseColor}-500 focus:ring-${baseColor}-500 sm:text-sm`}
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="p-4 border-t bg-gray-50">
                    <button 
                        onClick={handleSaveLog}
                        className={`w-full py-2 px-4 rounded-md shadow-sm text-sm font-bold text-white bg-${baseColor}-600 hover:bg-${baseColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${baseColor}-500`}
                    >
                        Log {activeTab === 'foods' ? `${selectedFoods.size} Foods` : 'Meal'}
                        {saveAsRecipe && activeTab === 'foods' ? ' & Save Recipe' : ''}
                    </button>
                </div>
            </div>

            {/* History Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Meal History (Week of {startOfWeek.toLocaleDateString()})</h3>
                {Object.keys(historyGrouped).length > 0 ? (
                    <div className="space-y-4">
                        {Object.entries(historyGrouped).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([logDate, meals]) => (
                            <div key={logDate} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                                <h4 className={`font-bold text-${baseColor}-800 border-b border-gray-100 pb-2 mb-2`}>
                                    {new Date(logDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                </h4>
                                <div className="space-y-3">
                                    {Object.entries(meals).map(([mealType, foods]) => (
                                        <div key={mealType} className="flex gap-3">
                                            <div className="w-20 font-medium text-gray-500 text-sm capitalize pt-1">{mealType}</div>
                                            <div className="flex-1 flex flex-wrap gap-1.5">
                                                {foods.map((foodName, idx) => (
                                                    <button 
                                                        key={idx} 
                                                        onClick={() => handleFoodItemClick(foodName)}
                                                        className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-teal-50 hover:text-teal-700 hover:shadow-sm transition-all border border-transparent hover:border-teal-200"
                                                        title="Tap to edit details"
                                                    >
                                                        {foodName} <Icon name="edit-2" className="w-3 h-3 ml-1 opacity-40"/>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm">
                        No meals logged for this week yet.
                    </div>
                )}
            </div>
        </div>
    );
};

const MyRecipesView: React.FC<{ recipes: Recipe[], onViewRecipe: (recipe: Recipe) => void, onShowAddRecipe: () => void, baseColor: string }> = ({ recipes, onViewRecipe, onShowAddRecipe, baseColor }) => {
    const [filter, setFilter] = useState<RecipeFilter>('all');

    const filteredRecipes = recipes.filter(recipe => {
        if (filter === 'all') return true;
        const mealTypes = recipe.mealTypes || [];
        return mealTypes.length === 0 || mealTypes.includes(filter);
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const getIngredientsPreview = (ingredients: string): string => {
        if (!ingredients) return 'No ingredients listed.';
        return ingredients.replace(/\n/g, ', ');
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-4">
                {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as RecipeFilter[]).map(f => (
                    <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`recipe-filter-btn ${filter === f ? `bg-${baseColor}-600 text-white` : 'bg-gray-100 text-gray-700'}`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>
            <div className="space-y-4">
                {filteredRecipes.length > 0 ? filteredRecipes.map(recipe => (
                    <button key={recipe.id} onClick={() => onViewRecipe(recipe)} className="w-full text-left bg-white shadow rounded-lg p-4 transition-all hover:shadow-md">
                        <div className="flex justify-between items-start">
                            <h3 className={`text-lg font-semibold text-${baseColor}-700 pr-2`}>{recipe.title}</h3>
                            {recipe.rating && recipe.rating > 0 && <StarRatingDisplay rating={recipe.rating} />}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {[...(recipe.mealTypes || []), ...(recipe.tags || [])].map(tag => (
                                <span key={tag} className={`text-xs ${['breakfast', 'lunch', 'dinner', 'snack'].includes(tag) ? 'bg-blue-100 text-blue-700' : `bg-${baseColor}-100 text-${baseColor}-700`} px-2 py-0.5 rounded-full`}>{tag}</span>
                            ))}
                        </div>
                        <p className="text-sm text-gray-600 mt-3 line-clamp-2">{getIngredientsPreview(recipe.ingredients)}</p>
                    </button>
                )) : (
                    <EmptyState
                        illustration={<NoRecipesIllustration />}
                        title={filter === 'all' ? 'Your Recipe Box is Empty' : 'No Recipes Found'}
                        message={filter === 'all' ? 'Get started by adding your first baby-friendly recipe!' : `No recipes match the "${filter}" filter.`}
                    >
                        {filter === 'all' && (
                             <button onClick={onShowAddRecipe} className={`inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-${baseColor}-600 hover:bg-${baseColor}-700`}>
                                <Icon name="plus" className="w-4 h-4" /> Add First Recipe
                            </button>
                        )}
                    </EmptyState>
                )}
            </div>
        </div>
    );
};

const MealPlannerView: React.FC<{ mealPlan: MealPlan, recipes: Recipe[], onAddToPlan: (date: string, meal: string) => void, onShowShoppingList: () => void, baseColor: string }> = ({ mealPlan, recipes, onAddToPlan, onShowShoppingList, baseColor }) => {
    const [weekStartDate, setWeekStartDate] = useState(getStartOfWeek(new Date()));

    const changeWeek = (amount: number) => {
        const newDate = new Date(weekStartDate);
        newDate.setDate(newDate.getDate() + amount);
        setWeekStartDate(newDate);
    };

    const getWeekDisplay = (startDate: Date) => {
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        return `${startDate.toLocaleDateString(undefined, options)} - ${endDate.toLocaleDateString(undefined, options)}`;
    };

    return (
        <div>
            <div className="bg-white p-4 rounded-lg shadow mb-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">Weekly Plan</h3>
                    <div className="flex-shrink-0 flex gap-2">
                        <button onClick={onShowShoppingList} className={`inline-flex items-center gap-2 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-${baseColor}-600 hover:bg-${baseColor}-700`}>
                            <Icon name="shopping-cart" className="w-4 h-4" /> Shopping List
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <button onClick={() => changeWeek(-7)} className="p-2 rounded-md hover:bg-gray-100"><Icon name="chevron-left" className="w-5 h-5" /></button>
                    <div className="flex-1 text-center">
                        <button onClick={() => setWeekStartDate(getStartOfWeek(new Date()))} className={`text-sm font-medium text-${baseColor}-600 hover:underline`}>Today</button>
                        <p className="text-sm font-medium text-gray-700">{getWeekDisplay(weekStartDate)}</p>
                    </div>
                    <button onClick={() => changeWeek(7)} className="p-2 rounded-md hover:bg-gray-100"><Icon name="chevron-right" className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="space-y-4">
                {Array.from({ length: 7 }).map((_, i) => {
                    const dayDate = new Date(weekStartDate);
                    dayDate.setDate(weekStartDate.getDate() + i);
                    const dateStr = formatDateString(dayDate);
                    const dayPlan = mealPlan[dateStr] || {};
                    return (
                        <div key={dateStr} className="bg-white rounded-lg shadow p-3">
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`text-lg font-bold text-${baseColor}-600`}>{dayDate.getDate()}</span>
                                <span className="text-sm font-medium text-gray-700">{dayDate.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                            </div>
                            <div className="space-y-2">
                                {(['breakfast', 'lunch', 'dinner'] as const).map(meal => {
                                    const plannedMeal = dayPlan[meal];
                                    const recipeExists = plannedMeal && recipes.some(r => r.id === plannedMeal.id);
                                    return (
                                        <div key={meal} className={`meal-slot rounded-lg p-2 transition-all hover:bg-${baseColor}-50 hover:border-${baseColor}-600`}>
                                            <span className="text-xs font-medium text-gray-500">{meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
                                            {plannedMeal ? (
                                                <div className={`planned-meal-item bg-${baseColor}-50 border border-${baseColor}-200 rounded-md p-2 mt-1 ${!recipeExists ? 'is-deleted' : ''}`} >
                                                    <p className={`text-sm font-medium text-${baseColor}-800`}>{recipeExists ? plannedMeal.title : 'Deleted Recipe'}</p>
                                                </div>
                                            ) : (
                                                <button onClick={() => onAddToPlan(dateStr, meal)} className={`add-meal-btn mt-1 hover:text-${baseColor}-600`}>
                                                    <Icon name="plus" className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const RecipesPage: React.FC<RecipesPageProps> = (props) => {
    // Set default subpage to 'log-meal' if log feature is enabled, otherwise 'my-recipes'
    const [subPage, setSubPage] = useState<'log-meal' | 'my-recipes' | 'meal-planner'>(props.onBatchLog ? 'log-meal' : 'my-recipes');
    const baseColor = props.baseColor || 'teal';

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold text-gray-800">Recipes & Meals</h2>
                </div>
                <div className="flex-shrink-0 flex flex-wrap gap-2">
                    <button onClick={props.onShowSuggestRecipe} className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700">
                        <Icon name="sparkles" className="w-4 h-4" /> Suggest
                    </button>
                    <button onClick={props.onShowImportRecipe} className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                        <Icon name="camera" className="w-4 h-4" /> Import
                    </button>
                    <button onClick={props.onShowAddRecipe} className={`inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-${baseColor}-600 hover:bg-${baseColor}-700`}>
                        <Icon name="plus" className="w-4 h-4" /> Add New
                    </button>
                </div>
            </div>

            <div className="border-b border-gray-200 mb-4">
                <nav className="flex -mb-px overflow-x-auto">
                    {props.onBatchLog && (
                        <button 
                            onClick={() => setSubPage('log-meal')} 
                            className={`recipe-sub-nav-btn whitespace-nowrap ${subPage === 'log-meal' ? `text-${baseColor}-600 border-${baseColor}-600` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            <Icon name="utensils" className="w-4 h-4 inline-block -mt-1 mr-1" /> Log Meal
                        </button>
                    )}
                    <button 
                        onClick={() => setSubPage('my-recipes')} 
                        className={`recipe-sub-nav-btn whitespace-nowrap ${subPage === 'my-recipes' ? `text-${baseColor}-600 border-${baseColor}-600` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        <Icon name="notebook-pen" className="w-4 h-4 inline-block -mt-1 mr-1" /> My Recipes
                    </button>
                    <button 
                        onClick={() => setSubPage('meal-planner')} 
                        className={`recipe-sub-nav-btn whitespace-nowrap ${subPage === 'meal-planner' ? `text-${baseColor}-600 border-${baseColor}-600` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        <Icon name="calendar-days" className="w-4 h-4 inline-block -mt-1 mr-1" /> Meal Planner
                    </button>
                </nav>
            </div>
            
            {subPage === 'log-meal' && props.onBatchLog && (
                <LogMealView 
                    recipes={props.recipes} 
                    triedFoods={props.triedFoods || []}
                    customFoods={props.customFoods}
                    onSave={props.onBatchLog} 
                    onCreateRecipe={props.onCreateRecipe}
                    onFoodClick={props.onFoodClick}
                    baseColor={baseColor} 
                />
            )}
            {subPage === 'my-recipes' && <MyRecipesView recipes={props.recipes} onViewRecipe={props.onViewRecipe} onShowAddRecipe={props.onShowAddRecipe} baseColor={baseColor} />}
            {subPage === 'meal-planner' && <MealPlannerView mealPlan={props.mealPlan} recipes={props.recipes} onAddToPlan={props.onAddToPlan} onShowShoppingList={props.onShowShoppingList} baseColor={baseColor} />}
        </>
    );
};

export default RecipesPage;
