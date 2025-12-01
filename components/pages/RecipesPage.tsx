
import React, { useState, useMemo } from 'react';
import { Recipe, RecipeFilter, MealPlan, TriedFoodLog, Food, CustomFood, LoggedItemData, FoodStatus } from '../../types';
import { flatFoodList, allFoods, STATUS_CONFIG, BEHAVIOR_TAGS } from '../../constants';
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
    onBatchLog?: (items: LoggedItemData[], date: string, meal: string, photo?: string, notes?: string) => void;
    onCreateRecipe?: (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'rating'>) => void;
    onFoodClick?: (food: Food) => void;
    onScanBarcode?: () => void;
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

// HELPER: Get emoji
const getFoodEmoji = (name: string) => {
    const obj = allFoods.flatMap(c => c.items).find(f => f.name === name);
    return obj?.emoji || '🍽️';
};

const LogMealView: React.FC<{ 
    recipes: Recipe[], 
    triedFoods: TriedFoodLog[],
    customFoods?: CustomFood[],
    onSave: (items: LoggedItemData[], date: string, meal: string, photo?: string, notes?: string) => void, 
    onCreateRecipe?: (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'rating'>) => void;
    onFoodClick?: (food: Food) => void;
    baseColor: string;
    date: string;
    setDate: (date: string) => void;
}> = ({ recipes, triedFoods, customFoods = [], onSave, onCreateRecipe, onFoodClick, baseColor, date, setDate }) => {
    const [step, setStep] = useState<'SELECT' | 'REVIEW'>('SELECT');
    const [meal, setMeal] = useState<RecipeFilter>('lunch');
    
    // Step 1: Selection
    const [activeTab, setActiveTab] = useState<'foods' | 'recipe'>('foods');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFoods, setSelectedFoods] = useState<Set<string>>(new Set());
    
    // Step 2: Review Data
    const [itemData, setItemData] = useState<Record<string, { status: FoodStatus; tags: Set<string> }>>({});
    const [platePhoto, setPlatePhoto] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [saveAsPreset, setSaveAsPreset] = useState(false);
    const [presetName, setPresetName] = useState('');

    const filteredFoods = useMemo(() => {
        return (flatFoodList as string[]).filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery]);

    const toggleFood = (food: string) => {
        const newSet = new Set(selectedFoods);
        if (newSet.has(food)) {
            newSet.delete(food);
            const newData = { ...itemData };
            delete newData[food];
            setItemData(newData);
        } else {
            newSet.add(food);
            setItemData(prev => ({ ...prev, [food]: { status: 'eaten', tags: new Set() } }));
        }
        setSelectedFoods(newSet);
    };

    const handleAddRecipeToTray = (recipe: Recipe) => {
        const ingredients = recipe.ingredients.split('\n').map(i => i.replace('-', '').trim());
        const newSet = new Set(selectedFoods);
        const newData = { ...itemData };

        (flatFoodList as string[]).forEach(food => {
            const foodLower = food.toLowerCase();
            if (ingredients.some(i => i.toLowerCase().includes(foodLower))) {
                newSet.add(food);
                if (!newData[food]) newData[food] = { status: 'eaten', tags: new Set() };
            }
        });
        
        setSelectedFoods(newSet);
        setItemData(newData);
        setActiveTab('foods');
    };

    const setStatus = (food: string, status: FoodStatus) => {
        setItemData(prev => ({
            ...prev,
            [food]: { ...prev[food], status, tags: new Set() }
        }));
    };

    const toggleTag = (food: string, tag: string) => {
        setItemData(prev => {
            const currentTags = new Set(prev[food].tags);
            if (currentTags.has(tag)) currentTags.delete(tag);
            else currentTags.add(tag);
            return { ...prev, [food]: { ...prev[food], tags: currentTags } };
        });
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPlatePhoto(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleFinalSave = () => {
        if (selectedFoods.size === 0) return;
        const foodsList: string[] = Array.from(selectedFoods) as string[];

        if (saveAsPreset && onCreateRecipe && presetName) {
            onCreateRecipe({
                title: presetName,
                ingredients: foodsList.join('\n'),
                instructions: 'Quick Log Preset',
                tags: ['Toddler Meal', meal],
                mealTypes: [meal]
            });
        }

        const itemsPayload: LoggedItemData[] = foodsList.map((f: string) => ({
            food: f,
            status: itemData[f]?.status || 'eaten',
            tags: Array.from(itemData[f]?.tags || [])
        }));

        onSave(itemsPayload, date, meal, platePhoto || undefined, notes);
        
        // Reset state
        setSelectedFoods(new Set());
        setItemData({});
        setPlatePhoto(null);
        setNotes('');
        setSaveAsPreset(false);
        setPresetName('');
        setStep('SELECT');
        alert("Meal logged successfully!");
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {/* Header / Date Controls */}
            <div className="p-4 bg-gray-50 border-b grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Date</label>
                    <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)} 
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${baseColor}-500 focus:ring-${baseColor}-500 sm:text-sm`}
                        disabled={step === 'REVIEW'}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Meal</label>
                    <select 
                        value={meal} 
                        onChange={(e) => setMeal(e.target.value as RecipeFilter)}
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-${baseColor}-500 focus:ring-${baseColor}-500 sm:text-sm capitalize`}
                        disabled={step === 'REVIEW'}
                    >
                        {['breakfast', 'lunch', 'dinner', 'snack'].map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* --- STEP 1: SELECT --- */}
            {step === 'SELECT' && (
                <>
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
                            Use Preset / Recipe
                        </button>
                    </div>

                    <div className="p-4 h-[400px] overflow-y-auto">
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
                                    {filteredFoods.map((food: string) => {
                                        const isSelected = selectedFoods.has(food);
                                        return (
                                            <button 
                                                key={food} 
                                                onClick={() => toggleFood(food)}
                                                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${isSelected ? `bg-${baseColor}-50 border-${baseColor}-500 ring-1 ring-${baseColor}-500` : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <span className="text-xl">{getFoodEmoji(food)}</span>
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
                                        onClick={() => handleAddRecipeToTray(recipe)}
                                        className={`w-full text-left p-3 rounded-lg border border-gray-200 hover:border-${baseColor}-300 hover:bg-${baseColor}-50 transition-all flex justify-between items-center`}
                                    >
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{recipe.title}</h4>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{recipe.ingredients.replace(/\n/g, ', ')}</p>
                                        </div>
                                        <Icon name="plus" className={`w-4 h-4 text-${baseColor}-500`} />
                                    </button>
                                )) : (
                                    <p className="text-center text-gray-500 py-8">No presets saved yet.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer for Step 1 */}
                    <div className="p-4 border-t bg-gray-50">
                        {/* Visual Tray */}
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar h-12 items-center">
                            {selectedFoods.size === 0 ? <span className="text-sm text-gray-400 italic w-full text-center">Plate is empty...</span> : 
                                Array.from(selectedFoods).map((food: any) => (
                                    <button key={food} onClick={() => toggleFood(food as string)} className="relative shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm animate-popIn">
                                        <span className="text-lg">{getFoodEmoji(food as string)}</span>
                                        <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"><Icon name="x" className="w-2 h-2 text-white" /></div>
                                    </button>
                                ))
                            }
                        </div>
                        <button 
                            onClick={() => setStep('REVIEW')}
                            disabled={selectedFoods.size === 0}
                            className={`w-full py-3 px-4 rounded-xl shadow-lg text-sm font-bold text-white transition-all flex justify-center items-center gap-2 ${selectedFoods.size > 0 ? `bg-${baseColor}-600 hover:bg-${baseColor}-700` : 'bg-gray-300 cursor-not-allowed'}`}
                        >
                            Review & Log <Icon name="arrow-right" className="w-4 h-4" />
                        </button>
                    </div>
                </>
            )}

            {/* --- STEP 2: REVIEW --- */}
            {step === 'REVIEW' && (
                <div className="flex flex-col h-[600px]">
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
                        <div className="space-y-3">
                            {Array.from(selectedFoods).map((food: any) => {
                                const fName = food as string;
                                const currentData = itemData[fName];
                                const status = currentData?.status || 'eaten';
                                const config = STATUS_CONFIG[status];
                                const isIssue = status !== 'eaten';

                                return (
                                    <div key={fName} className={`rounded-xl border transition-all duration-300 overflow-hidden bg-white shadow-sm ${config.color}`}>
                                        <div className="flex items-center justify-between p-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{getFoodEmoji(fName)}</span>
                                                <span className="font-bold text-gray-800">{fName}</span>
                                            </div>
                                            <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                                                {(['eaten', 'touched', 'refused'] as FoodStatus[]).map((s) => {
                                                    const isS = status === s;
                                                    const c = STATUS_CONFIG[s];
                                                    return (
                                                        <button
                                                            key={s}
                                                            onClick={() => setStatus(fName, s)}
                                                            className={`p-2 rounded-md transition-all ${isS ? `${c.color} ${c.text}` : 'text-gray-400 hover:bg-gray-50'}`}
                                                            title={c.label}
                                                        >
                                                            <Icon name={c.icon} className="w-5 h-5" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {/* Expanded Card Logic */}
                                        {isIssue && (
                                            <div className="px-4 pb-4 pt-0 animate-fadeIn">
                                                <div className="h-px bg-black/5 w-full mb-3"></div>
                                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">What happened?</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(status === 'touched' ? BEHAVIOR_TAGS.touched : BEHAVIOR_TAGS.refused).map(tag => {
                                                        const isTagged = currentData.tags.has(tag);
                                                        return (
                                                            <button
                                                                key={tag}
                                                                onClick={() => toggleTag(fName, tag)}
                                                                className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                                                                    isTagged 
                                                                    ? 'bg-gray-800 text-white border-gray-800' 
                                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                                }`}
                                                            >
                                                                {tag}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Photo & Notes */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Meal Photo</label>
                                {platePhoto ? (
                                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                                        <img src={platePhoto} alt="Meal" className="w-full h-full object-cover" />
                                        <button onClick={() => setPlatePhoto(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"><Icon name="x" className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-gray-50">
                                        <Icon name="camera" className="w-6 h-6 text-gray-400 mb-1" />
                                        <span className="text-xs text-gray-500">Tap to snap a picture</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    </label>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Notes</label>
                                <textarea 
                                    className="w-full rounded-lg border-gray-300 text-sm focus:ring-teal-500 focus:border-teal-500"
                                    rows={2}
                                    placeholder="Anything else?"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Save as Preset */}
                        {onCreateRecipe && (
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <input type="checkbox" id="savePreset" checked={saveAsPreset} onChange={e => setSaveAsPreset(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                    <label htmlFor="savePreset" className="text-sm font-bold text-indigo-900">Save as Preset?</label>
                                </div>
                                {saveAsPreset && (
                                    <input type="text" placeholder="e.g. Monday Pasta Lunch" value={presetName} onChange={e => setPresetName(e.target.value)} className="w-full mt-2 rounded-lg border-indigo-200 text-sm focus:ring-indigo-500 focus:border-indigo-500" autoFocus />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white border-t flex gap-3">
                        <button onClick={() => setStep('SELECT')} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Back</button>
                        <button onClick={handleFinalSave} className={`flex-[2] py-3 text-sm font-bold text-white bg-${baseColor}-600 rounded-xl shadow-lg hover:bg-${baseColor}-700 transition-colors flex justify-center items-center gap-2`}>
                            <Icon name="check" className="w-5 h-5" /> Save Log
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const RecipesPage: React.FC<RecipesPageProps> = ({ 
    recipes, 
    mealPlan, 
    triedFoods = [], 
    customFoods = [],
    onShowAddRecipe, 
    onShowImportRecipe, 
    onShowSuggestRecipe, 
    onViewRecipe, 
    onAddToPlan, 
    onShowShoppingList,
    onBatchLog,
    onCreateRecipe,
    onFoodClick,
    onScanBarcode,
    baseColor = 'teal'
}) => {
    const [activeTab, setActiveTab] = useState<'plan' | 'recipes' | 'log'>('log');
    const [weekOffset, setWeekOffset] = useState(0);
    // Local state for LogMealView inside this page
    const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]);

    const weekStart = getStartOfWeek(new Date());
    weekStart.setDate(weekStart.getDate() + (weekOffset * 7));
    
    return (
        <div className="space-y-6">
            <div className="flex border-b border-gray-200 overflow-x-auto">
                <button onClick={() => setActiveTab('log')} className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'log' ? `border-${baseColor}-600 text-${baseColor}-600` : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Log Meal
                </button>
                <button onClick={() => setActiveTab('plan')} className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'plan' ? `border-${baseColor}-600 text-${baseColor}-600` : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Meal Plan
                </button>
                <button onClick={() => setActiveTab('recipes')} className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'recipes' ? `border-${baseColor}-600 text-${baseColor}-600` : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    My Recipes
                </button>
            </div>

            {activeTab === 'plan' && (
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-gray-800">Weekly Plan</h3>
                         <button onClick={onShowShoppingList} className={`text-sm text-${baseColor}-600 flex items-center gap-1 hover:underline`}>
                            <Icon name="shopping-cart" className="w-4 h-4"/> Shopping List
                         </button>
                    </div>
                    <div className="space-y-4">
                        {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                            const date = new Date(weekStart);
                            date.setDate(date.getDate() + dayOffset);
                            const dateStr = formatDateString(date);
                            const dayPlan = mealPlan[dateStr] || {};
                            const isToday = dateStr === formatDateString(new Date());
                            
                            return (
                                <div key={dateStr} className={`border rounded-lg p-3 ${isToday ? `bg-${baseColor}-50 border-${baseColor}-200` : 'border-gray-100'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className={`font-semibold text-sm ${isToday ? `text-${baseColor}-800` : 'text-gray-700'}`}>
                                            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </h4>
                                        {isToday && <span className={`text-[10px] font-bold bg-${baseColor}-100 text-${baseColor}-700 px-2 py-0.5 rounded-full`}>Today</span>}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                        {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => {
                                            const entry = dayPlan[meal];
                                            return (
                                                <div key={meal} className="relative group">
                                                    {entry ? (
                                                        <div className="bg-white border border-gray-200 rounded p-2 text-sm shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                                                            const r = recipes.find(rec => rec.id === entry.id);
                                                            if(r) onViewRecipe(r);
                                                        }}>
                                                            <p className="font-medium text-gray-800 truncate">{entry.title}</p>
                                                            <p className="text-xs text-gray-400 capitalize">{meal}</p>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => onAddToPlan(dateStr, meal)}
                                                            className="w-full border border-dashed border-gray-300 rounded p-2 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center gap-1"
                                                        >
                                                            <Icon name="plus" className="w-3 h-3"/> {meal}
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'recipes' && (
                <div>
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">My Recipes</h3>
                        <div className="flex gap-2">
                             <button onClick={onShowSuggestRecipe} className="p-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200" title="Suggest with AI">
                                 <Icon name="sparkles" className="w-5 h-5"/>
                             </button>
                             <button onClick={onShowImportRecipe} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200" title="Import from Photo">
                                 <Icon name="camera" className="w-5 h-5"/>
                             </button>
                             {onScanBarcode && (
                                <button onClick={onScanBarcode} className="p-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200" title="Scan Barcode">
                                    <Icon name="scan-barcode" className="w-5 h-5"/>
                                </button>
                             )}
                             <button onClick={onShowAddRecipe} className={`flex items-center gap-2 px-4 py-2 bg-${baseColor}-600 text-white rounded-lg shadow hover:bg-${baseColor}-700`}>
                                 <Icon name="plus" className="w-4 h-4"/> Add Recipe
                             </button>
                        </div>
                     </div>
                     
                     {recipes.length > 0 ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                             {recipes.map(recipe => (
                                 <div key={recipe.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewRecipe(recipe)}>
                                     <h4 className="font-bold text-gray-800 mb-1">{recipe.title}</h4>
                                     <div className="flex items-center gap-1 mb-2">
                                         <StarRatingDisplay rating={recipe.rating || 0} />
                                     </div>
                                     <div className="flex flex-wrap gap-1 mb-3">
                                         {recipe.mealTypes?.map(t => (
                                             <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{t}</span>
                                         ))}
                                     </div>
                                     <p className="text-xs text-gray-500 line-clamp-2">{recipe.ingredients}</p>
                                 </div>
                             ))}
                         </div>
                     ) : (
                         <EmptyState 
                            illustration={<NoRecipesIllustration />}
                            title="No Recipes Yet"
                            message="Add your own recipes or let AI suggest some based on what's in your fridge!"
                         />
                     )}
                </div>
            )}

            {activeTab === 'log' && onBatchLog && (
                <LogMealView 
                    recipes={recipes}
                    triedFoods={triedFoods}
                    customFoods={customFoods}
                    onSave={onBatchLog}
                    onCreateRecipe={onCreateRecipe}
                    onFoodClick={onFoodClick}
                    baseColor={baseColor}
                    date={planDate}
                    setDate={setPlanDate}
                />
            )}
        </div>
    );
};

export default RecipesPage;
