import React, { useState } from 'react';
import { Recipe, RecipeFilter, MealPlan } from '../../types';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';

interface RecipesPageProps {
    recipes: Recipe[];
    mealPlan: MealPlan;
    onShowAddRecipe: () => void;
    onShowImportRecipe: () => void;
    onShowSuggestRecipe: () => void;
    onViewRecipe: (recipe: Recipe) => void;
    onAddToPlan: (date: string, meal: string) => void;
    onShowShoppingList: () => void;
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

const MyRecipesView: React.FC<{ recipes: Recipe[], onViewRecipe: (recipe: Recipe) => void, onShowAddRecipe: () => void }> = ({ recipes, onViewRecipe, onShowAddRecipe }) => {
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
                        className={`recipe-filter-btn ${filter === f ? 'active' : ''}`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>
            <div className="space-y-4">
                {filteredRecipes.length > 0 ? filteredRecipes.map(recipe => (
                    <button key={recipe.id} onClick={() => onViewRecipe(recipe)} className="w-full text-left bg-white shadow rounded-lg p-4 transition-all hover:shadow-md">
                        <h3 className="text-lg font-semibold text-teal-700">{recipe.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {[...(recipe.mealTypes || []), ...(recipe.tags || [])].map(tag => (
                                <span key={tag} className={`text-xs ${['breakfast', 'lunch', 'dinner', 'snack'].includes(tag) ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'} px-2 py-0.5 rounded-full`}>{tag}</span>
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
                             <button onClick={onShowAddRecipe} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700">
                                <Icon name="plus" className="w-4 h-4" /> Add First Recipe
                            </button>
                        )}
                    </EmptyState>
                )}
            </div>
        </div>
    );
};

const MealPlannerView: React.FC<{ mealPlan: MealPlan, recipes: Recipe[], onAddToPlan: (date: string, meal: string) => void, onShowShoppingList: () => void }> = ({ mealPlan, recipes, onAddToPlan, onShowShoppingList }) => {
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
                        <button onClick={onShowShoppingList} className="inline-flex items-center gap-2 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                            <Icon name="shopping-cart" className="w-4 h-4" /> Shopping List
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <button onClick={() => changeWeek(-7)} className="p-2 rounded-md hover:bg-gray-100"><Icon name="chevron-left" className="w-5 h-5" /></button>
                    <div className="flex-1 text-center">
                        <button onClick={() => setWeekStartDate(getStartOfWeek(new Date()))} className="text-sm font-medium text-teal-600 hover:underline">Today</button>
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
                                <span className="text-lg font-bold text-teal-600">{dayDate.getDate()}</span>
                                <span className="text-sm font-medium text-gray-700">{dayDate.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                            </div>
                            <div className="space-y-2">
                                {(['breakfast', 'lunch', 'dinner'] as const).map(meal => {
                                    const plannedMeal = dayPlan[meal];
                                    const recipeExists = plannedMeal && recipes.some(r => r.id === plannedMeal.id);
                                    return (
                                        <div key={meal} className="meal-slot rounded-lg p-2">
                                            <span className="text-xs font-medium text-gray-500">{meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
                                            {plannedMeal ? (
                                                <div className={`planned-meal-item bg-teal-50 border border-teal-200 rounded-md p-2 mt-1 ${!recipeExists ? 'is-deleted' : ''}`} >
                                                    <p className="text-sm font-medium text-teal-800">{recipeExists ? plannedMeal.title : 'Deleted Recipe'}</p>
                                                </div>
                                            ) : (
                                                <button onClick={() => onAddToPlan(dateStr, meal)} className="add-meal-btn mt-1">
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
    const [subPage, setSubPage] = useState<'my-recipes' | 'meal-planner'>('my-recipes');

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Recipes & Planner</h2>
                <div className="flex-shrink-0 flex gap-2">
                    <button onClick={props.onShowSuggestRecipe} className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700">
                        <Icon name="sparkles" className="w-4 h-4" /> Suggest
                    </button>
                    <button onClick={props.onShowImportRecipe} className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                        <Icon name="camera" className="w-4 h-4" /> Import
                    </button>
                    <button onClick={props.onShowAddRecipe} className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700">
                        <Icon name="plus" className="w-4 h-4" /> Add New
                    </button>
                </div>
            </div>

            <div className="border-b border-gray-200 mb-4">
                <nav className="flex -mb-px">
                    <button onClick={() => setSubPage('my-recipes')} className={`recipe-sub-nav-btn ${subPage === 'my-recipes' ? 'active' : ''}`}>
                        <Icon name="notebook-pen" className="w-4 h-4 inline-block -mt-1 mr-1" /> My Recipes
                    </button>
                    <button onClick={() => setSubPage('meal-planner')} className={`recipe-sub-nav-btn ${subPage === 'meal-planner' ? 'active' : ''}`}>
                        <Icon name="calendar-days" className="w-4 h-4 inline-block -mt-1 mr-1" /> Meal Planner
                    </button>
                </nav>
            </div>
            
            {subPage === 'my-recipes' && <MyRecipesView recipes={props.recipes} onViewRecipe={props.onViewRecipe} onShowAddRecipe={props.onShowAddRecipe} />}
            {subPage === 'meal-planner' && <MealPlannerView mealPlan={props.mealPlan} recipes={props.recipes} onAddToPlan={props.onAddToPlan} onShowShoppingList={props.onShowShoppingList} />}
        </>
    );
};

export default RecipesPage;
