
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
    onAddCustomFood?: (initialName: string) => void;
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

// --- HELPER COMPONENTS ---

const StarRatingDisplay: React.FC<{ rating: number }> = ({ rating }) => (
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

const getFoodEmoji = (name: string, customFoods: CustomFood[] = []) => {
    const obj = allFoods.flatMap(c => c.items).find(f => f.name === name);
    if (obj) return obj.emoji;
    const custom = customFoods.find(f => f.name === name);
    return custom?.emoji || '🍽️';
};

// --- PLATE BUILDER VIEW ---

const PORTION_SIZES = [
    { label: '1 tbsp', value: '1 tbsp' },
    { label: '¼ cup', value: '0.25 cup' },
    { label: '½ cup', value: '0.5 cup' },
    { label: '1 cup', value: '1 cup' },
    { label: '1 pouch/unit', value: '1 unit' },
    { label: '1 slice', value: '1 slice' },
];

const CONSUMPTION_LEVELS = [
    { label: 'All', value: 'all', icon: 'check-circle', color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Most', value: 'most', icon: 'pie-chart', color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Some', value: 'some', icon: 'bar-chart-2', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'None', value: 'none', icon: 'x-circle', color: 'text-red-600', bg: 'bg-red-100' },
];

const FOOD_CATEGORIES_FILTER = [
    { id: 'all', label: 'All', icon: 'grid-2x2' },
    { id: 'Fruits', label: 'Fruits', icon: 'apple' },
    { id: 'Vegetables', label: 'Veggies', icon: 'carrot' },
    { id: 'Meat', label: 'Protein', icon: 'drumstick' },
    { id: 'Grains', label: 'Carbs', icon: 'croissant' },
    { id: 'Dairy & Eggs', label: 'Dairy', icon: 'milk' },
    { id: 'Snacks', label: 'Snacks', icon: 'cookie' } // 'Snacks' often in 'Custom' or new category
];

const PlateBuilderView: React.FC<{ 
    recipes: Recipe[], 
    customFoods?: CustomFood[],
    onSave: (items: LoggedItemData[], date: string, meal: string, photo?: string, notes?: string) => void, 
    onCreateRecipe?: (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'rating'>) => void;
    onAddCustomFood?: (name: string) => void;
    onScanBarcode?: () => void;
    baseColor: string;
    date: string;
    setDate: (date: string) => void;
    setMode: (mode: 'log' | 'history' | 'plan' | 'recipes') => void;
}> = ({ recipes, customFoods = [], onSave, onCreateRecipe, onAddCustomFood, onScanBarcode, baseColor, date, setDate, setMode }) => {
    const [meal, setMeal] = useState<RecipeFilter>('lunch');
    const [selectedFoods, setSelectedFoods] = useState<LoggedItemData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null); // For editing portion/status
    
    // Meta Data
    const [platePhoto, setPlatePhoto] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [presetName, setPresetName] = useState('');
    const [showSavePreset, setShowSavePreset] = useState(false);

    // Derived Foods List for Pantry
    const pantryFoods = useMemo(() => {
        let all = [...allFoods.flatMap(c => c.items.map(i => ({...i, category: c.category}))), ...customFoods.map(f => ({...f, category: 'Snacks'}))];
        
        if (searchQuery) {
            all = all.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
        } else if (categoryFilter !== 'all') {
            all = all.filter(f => f.category === categoryFilter);
        }
        
        // Remove duplicates if custom food overrides standard
        const seen = new Set();
        return all.filter(f => {
            const duplicate = seen.has(f.name);
            seen.add(f.name);
            return !duplicate;
        });
    }, [searchQuery, categoryFilter, customFoods]);

    const addFoodToPlate = (food: Food) => {
        // Prevent dupes? Maybe allow for multiple servings. Let's allow but maybe warn.
        if (selectedFoods.some(f => f.food === food.name)) return; // Simple unique for now

        setSelectedFoods(prev => [...prev, { 
            food: food.name, 
            status: 'eaten', 
            tags: [], 
            portion: '1 serving', 
            consumption: 'all' 
        }]);
    };

    const addRecipeToPlate = (recipe: Recipe) => {
        const ingredients = recipe.ingredients.split('\n').map(i => i.replace(/^[-\*•]\s*/, '').trim());
        const newItems: LoggedItemData[] = [];
        
        ingredients.forEach(rawName => {
            // Very simple matching logic
            const match = pantryFoods.find(f => rawName.toLowerCase().includes(f.name.toLowerCase()));
            if (match && !selectedFoods.some(f => f.food === match.name)) {
                newItems.push({
                    food: match.name,
                    status: 'eaten',
                    tags: [],
                    portion: '1 serving',
                    consumption: 'all'
                });
            }
        });

        if (newItems.length > 0) {
            setSelectedFoods(prev => [...prev, ...newItems]);
            alert(`Added ${newItems.length} items from "${recipe.title}"`);
        } else {
             // If no exact matches, maybe user wants to log the recipe as a custom food item?
             // For now, simple alert.
             alert("Could not match ingredients automatically.");
        }
    };

    const updateItem = (index: number, updates: Partial<LoggedItemData>) => {
        setSelectedFoods(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
    };

    const removeItem = (index: number) => {
        setSelectedFoods(prev => prev.filter((_, i) => i !== index));
        if (activeItemIndex === index) setActiveItemIndex(null);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPlatePhoto(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveLog = () => {
        if (selectedFoods.length === 0) return;

        if (showSavePreset && presetName && onCreateRecipe) {
             const ingredientsList = selectedFoods.map(f => f.food).join('\n');
             onCreateRecipe({
                title: presetName,
                ingredients: ingredientsList,
                instructions: 'Saved Plate',
                tags: ['Toddler Plate', meal],
                mealTypes: [meal]
            });
        }

        // Map consumption/status to existing logic if needed
        // We update status based on consumption for backward compatibility
        const finalItems = selectedFoods.map(item => {
            let status: FoodStatus = 'eaten';
            if (item.consumption === 'none') status = 'refused';
            if (item.consumption === 'some') status = 'touched';
            
            return { ...item, status };
        });

        onSave(finalItems, date, meal, platePhoto || undefined, notes);
        
        // Reset
        setSelectedFoods([]);
        setPlatePhoto(null);
        setNotes('');
        setPresetName('');
        setShowSavePreset(false);
        alert("Meal Logged!");
        setMode('history');
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-200">
            {/* 1. Header & Context */}
            <div className="bg-white p-3 border-b flex justify-between items-center shrink-0">
                <div className="flex gap-2">
                     <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)} 
                        className="text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-1.5"
                    />
                     <select 
                        value={meal} 
                        onChange={(e) => setMeal(e.target.value as RecipeFilter)}
                        className="text-sm border-gray-300 rounded-lg capitalize focus:ring-indigo-500 focus:border-indigo-500 py-1.5"
                    >
                        {['breakfast', 'lunch', 'dinner', 'snack'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                {onScanBarcode && (
                    <button onClick={onScanBarcode} className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200">
                        <Icon name="scan-barcode" className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* 2. Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                
                {/* LEFT: THE PLATE (Visual Builder) */}
                <div className="w-full md:w-5/12 p-4 flex flex-col items-center border-r bg-white overflow-y-auto">
                    
                    {/* The Plate Visual */}
                    <div className="relative w-64 h-64 rounded-full border-4 border-gray-100 shadow-inner bg-gray-50 flex flex-wrap content-center justify-center gap-2 p-6 mb-4 transition-all">
                        {selectedFoods.length === 0 ? (
                            <div className="text-center text-gray-300">
                                <Icon name="utensils" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm font-medium">Tap foods to build plate</p>
                            </div>
                        ) : (
                            selectedFoods.map((item, idx) => (
                                <button
                                    key={`${item.food}-${idx}`}
                                    onClick={() => setActiveItemIndex(idx)}
                                    className={`relative w-14 h-14 bg-white rounded-full shadow-md flex items-center justify-center border-2 transition-transform hover:scale-110 ${activeItemIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-200 z-10' : 'border-white'}`}
                                >
                                    <span className="text-2xl">{getFoodEmoji(item.food, customFoods)}</span>
                                    {/* Mini Indicators */}
                                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border border-white flex items-center justify-center ${item.consumption === 'none' ? 'bg-red-500' : 'bg-green-500'}`}>
                                        <span className="text-[8px] text-white font-bold">{item.consumption?.[0]?.toUpperCase()}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Active Item Editor (Contextual) */}
                    {activeItemIndex !== null && selectedFoods[activeItemIndex] && (
                        <div className="w-full bg-indigo-50 rounded-xl p-4 mb-4 animate-fadeIn border border-indigo-100">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-indigo-900 flex items-center gap-2">
                                    {getFoodEmoji(selectedFoods[activeItemIndex].food, customFoods)} {selectedFoods[activeItemIndex].food}
                                </span>
                                <button onClick={() => removeItem(activeItemIndex)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Icon name="trash-2" className="w-4 h-4" /></button>
                            </div>
                            
                            {/* Portion Control */}
                            <div className="mb-3">
                                <label className="text-[10px] uppercase font-bold text-indigo-400 mb-1 block">Portion Served</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {PORTION_SIZES.map(size => (
                                        <button 
                                            key={size.value}
                                            onClick={() => updateItem(activeItemIndex, { portion: size.value })}
                                            className={`text-xs px-2 py-1 rounded border transition-colors ${selectedFoods[activeItemIndex].portion === size.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}
                                        >
                                            {size.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Consumption Control */}
                            <div>
                                <label className="text-[10px] uppercase font-bold text-indigo-400 mb-1 block">Amount Eaten</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {CONSUMPTION_LEVELS.map(level => {
                                        const isSelected = selectedFoods[activeItemIndex].consumption === level.value;
                                        return (
                                            <button 
                                                key={level.value}
                                                onClick={() => updateItem(activeItemIndex, { consumption: level.value as any })}
                                                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${isSelected ? `${level.bg} ${level.color} border-current ring-1` : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                                            >
                                                <Icon name={level.icon} className="w-4 h-4 mb-1" />
                                                <span className="text-[9px] font-bold">{level.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Metadata (Photo, Notes) */}
                    <div className="w-full space-y-3 mt-auto">
                        <button 
                             onClick={() => document.getElementById('plate-photo-input')?.click()}
                             className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
                        >
                            {platePhoto ? <span className="text-green-600 flex items-center gap-1"><Icon name="check" className="w-3 h-3"/> Photo Added</span> : <><Icon name="camera" className="w-3 h-3"/> Add Plate Photo</>}
                        </button>
                        <input id="plate-photo-input" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        
                        <input 
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)} 
                            placeholder="Any notes?" 
                            className="w-full text-xs border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors"
                        />
                        
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="savePreset" checked={showSavePreset} onChange={e => setShowSavePreset(e.target.checked)} className="rounded text-indigo-600" />
                            <label htmlFor="savePreset" className="text-xs text-gray-600">Save as Preset?</label>
                        </div>
                        {showSavePreset && (
                            <input 
                                value={presetName}
                                onChange={e => setPresetName(e.target.value)}
                                placeholder="e.g. Monday Pasta"
                                className="w-full text-xs border-indigo-200 rounded-lg focus:ring-indigo-500"
                            />
                        )}

                        <button 
                            onClick={handleSaveLog}
                            disabled={selectedFoods.length === 0}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${selectedFoods.length > 0 ? `bg-${baseColor}-600 hover:bg-${baseColor}-700` : 'bg-gray-300'}`}
                        >
                            <Icon name="check" className="w-5 h-5" /> Log Meal
                        </button>
                    </div>
                </div>

                {/* RIGHT: THE PANTRY (Selection) */}
                <div className="w-full md:w-7/12 flex flex-col bg-gray-50/50">
                    {/* Search & Categories */}
                    <div className="p-3 bg-white border-b space-y-3">
                        <div className="flex gap-2">
                             <div className="relative flex-1">
                                <Icon name="search" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search food..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 py-2 text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                />
                             </div>
                             {onAddCustomFood && (
                                <button onClick={() => onAddCustomFood(searchQuery)} className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200">
                                    <Icon name="plus" className="w-5 h-5" />
                                </button>
                             )}
                        </div>
                        
                        {/* Categories Scroll */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {FOOD_CATEGORIES_FILTER.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategoryFilter(cat.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${categoryFilter === cat.id ? `bg-${baseColor}-600 text-white border-${baseColor}-600` : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <Icon name={cat.icon} className="w-3 h-3" />
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Pantry Grid / Recipes Toggle */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {recipes.length > 0 && !searchQuery && categoryFilter === 'all' && (
                             <div className="mb-6">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Saved Plates</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {recipes.map(recipe => (
                                        <button 
                                            key={recipe.id}
                                            onClick={() => addRecipeToPlate(recipe)}
                                            className="text-left p-3 bg-white border border-indigo-100 rounded-xl shadow-sm hover:border-indigo-300 transition-colors group"
                                        >
                                            <div className="flex justify-between items-start">
                                                <h5 className="font-bold text-gray-800 text-sm group-hover:text-indigo-700">{recipe.title}</h5>
                                                <Icon name="plus-circle" className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{recipe.ingredients.replace(/\n/g, ', ')}</p>
                                        </button>
                                    ))}
                                </div>
                             </div>
                        )}

                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Foods</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {pantryFoods.map(food => (
                                <button
                                    key={food.name}
                                    onClick={() => addFoodToPlate(food)}
                                    className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-400 hover:shadow-sm transition-all active:scale-95"
                                >
                                    <span className="text-2xl mb-1">{food.emoji}</span>
                                    <span className="text-[10px] font-bold text-gray-700 text-center leading-tight line-clamp-2">{food.name}</span>
                                </button>
                            ))}
                        </div>
                        {pantryFoods.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-400">No foods found.</p>
                                {searchQuery && onAddCustomFood && (
                                    <button onClick={() => onAddCustomFood(searchQuery)} className="mt-2 text-indigo-600 font-bold text-sm">Create "{searchQuery}"</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- HISTORY VIEW ---

const HistoryView: React.FC<{ 
    triedFoods: TriedFoodLog[]; 
    baseColor: string; 
    onAddToPlan: (log: TriedFoodLog[]) => void; // Prop for meal prep
}> = ({ triedFoods, baseColor, onAddToPlan }) => {
    // Group logs by date+meal
    const groups = useMemo(() => {
        const g: Record<string, TriedFoodLog[]> = {};
        triedFoods.forEach(log => {
            const key = `${log.date}-${log.meal}`;
            if (!g[key]) g[key] = [];
            g[key].push(log);
        });
        return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
    }, [triedFoods]);

    return (
        <div className="space-y-4">
             {groups.map(([key, items]) => {
                 const date = items[0].date;
                 const meal = items[0].meal;
                 const photo = items.find(i => i.messyFaceImage)?.messyFaceImage;
                 
                 return (
                     <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                         <div className="flex justify-between items-start mb-3">
                             <div className="flex items-center gap-3">
                                 {photo ? (
                                     <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden"><img src={photo} className="w-full h-full object-cover"/></div>
                                 ) : (
                                     <div className={`w-12 h-12 rounded-lg bg-${baseColor}-100 flex items-center justify-center text-${baseColor}-600`}>
                                         <span className="text-xl capitalize">{meal[0]}</span>
                                     </div>
                                 )}
                                 <div>
                                     <h4 className="font-bold text-gray-800 capitalize">{meal}</h4>
                                     <p className="text-xs text-gray-500">{new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                 </div>
                             </div>
                             <button 
                                onClick={() => onAddToPlan(items)}
                                className={`text-xs bg-${baseColor}-50 text-${baseColor}-700 px-3 py-1.5 rounded-full font-bold hover:bg-${baseColor}-100`}
                            >
                                Plan This
                             </button>
                         </div>
                         
                         <div className="space-y-2">
                             {items.map((item, idx) => (
                                 <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-1 last:pb-0">
                                     <span className="text-gray-700">{item.id}</span>
                                     <div className="flex items-center gap-2">
                                         {item.portion && <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 rounded">{item.portion}</span>}
                                         {item.consumption && (
                                             <span className={`text-[10px] font-bold uppercase ${item.consumption === 'none' ? 'text-red-500' : item.consumption === 'all' ? 'text-green-500' : 'text-blue-500'}`}>
                                                 {item.consumption}
                                             </span>
                                         )}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )
             })}
        </div>
    );
};

// --- MAIN CONTAINER ---

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
    onAddCustomFood,
    onScanBarcode,
    baseColor = 'teal'
}) => {
    const [activeTab, setActiveTab] = useState<'log' | 'history' | 'plan' | 'recipes'>('log');
    
    // Meal Prep / Planning State
    const [planTargetDate, setPlanTargetDate] = useState('');
    const [itemsToPlan, setItemsToPlan] = useState<TriedFoodLog[] | null>(null);

    // Passed down to LogMealView
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

    const handlePlanItems = (items: TriedFoodLog[]) => {
        setItemsToPlan(items);
        setPlanTargetDate(new Date().toISOString().split('T')[0]); // Default to today
    };

    const confirmPlan = () => {
        if (!itemsToPlan || !itemsToPlan.length) return;
        const meal = itemsToPlan[0].meal; // Assume group has same meal
        
        // Create a temporary recipe from these items to save to the plan
        // In a real app, you might want to log individual items to the future plan, 
        // but the current data structure supports linking a 'Recipe ID' to a plan slot.
        // So we might need to create a hidden recipe or just alert user 'Added to list'.
        // For this demo, let's create a "Quick Plan" recipe.
        
        const title = `${meal} copy from ${itemsToPlan[0].date}`;
        const ingredients = itemsToPlan.map(i => i.id).join('\n');
        
        if (onCreateRecipe) {
             // Create a recipe first
             const newRecipeId = crypto.randomUUID(); // Mock ID, real ID gen happens in App.tsx
             // We can't synchronously get the ID back from onCreateRecipe if it's void.
             // Workaround: We will just trigger onAddToPlan with a "Custom" placeholder for now
             // or ideally refactor App.tsx to return the ID. 
             // Simplification: Just create a recipe and alert user to add it.
             
             onCreateRecipe({
                 title: title,
                 ingredients: ingredients,
                 instructions: 'Planned from history',
                 tags: ['Planned'],
                 mealTypes: [meal as any]
             });
             
             alert(`Created recipe "${title}". Go to Meal Plan tab to assign it!`);
        }
        setItemsToPlan(null);
    };

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            {/* Top Nav */}
            <div className="flex border-b border-gray-200 overflow-x-auto shrink-0 bg-white sticky top-0 z-20">
                <button onClick={() => setActiveTab('log')} className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'log' ? `border-${baseColor}-600 text-${baseColor}-600` : 'border-transparent text-gray-500'}`}>
                    <Icon name="disc-3" className="w-4 h-4 inline-block mr-2" /> Log Meal
                </button>
                <button onClick={() => setActiveTab('history')} className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'history' ? `border-${baseColor}-600 text-${baseColor}-600` : 'border-transparent text-gray-500'}`}>
                    <Icon name="history" className="w-4 h-4 inline-block mr-2" /> History
                </button>
                <button onClick={() => setActiveTab('plan')} className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'plan' ? `border-${baseColor}-600 text-${baseColor}-600` : 'border-transparent text-gray-500'}`}>
                    <Icon name="calendar" className="w-4 h-4 inline-block mr-2" /> Plan
                </button>
                <button onClick={() => setActiveTab('recipes')} className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'recipes' ? `border-${baseColor}-600 text-${baseColor}-600` : 'border-transparent text-gray-500'}`}>
                    <Icon name="book" className="w-4 h-4 inline-block mr-2" /> Saved Plates
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {activeTab === 'log' && onBatchLog && (
                    <PlateBuilderView 
                        recipes={recipes}
                        customFoods={customFoods}
                        onSave={onBatchLog}
                        onCreateRecipe={onCreateRecipe}
                        onAddCustomFood={onAddCustomFood}
                        onScanBarcode={onScanBarcode}
                        baseColor={baseColor}
                        date={logDate}
                        setDate={setLogDate}
                        setMode={setActiveTab}
                    />
                )}

                {activeTab === 'history' && (
                    <div className="p-1">
                        <HistoryView triedFoods={triedFoods} baseColor={baseColor} onAddToPlan={handlePlanItems} />
                    </div>
                )}

                {activeTab === 'plan' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bold text-gray-800">Weekly Plan</h3>
                             <button onClick={onShowShoppingList} className={`text-sm text-${baseColor}-600 flex items-center gap-1 hover:underline`}>
                                <Icon name="shopping-cart" className="w-4 h-4"/> List
                             </button>
                        </div>
                        {/* Reuse existing logic for calendar grid, simplified for brevity in this redesign focus */}
                        <p className="text-sm text-gray-500 italic text-center py-8">
                            Select a day below to assign saved plates/recipes.
                        </p>
                        {/* Simplified list of days */}
                        <div className="space-y-3">
                            {[0,1,2,3,4,5,6].map(offset => {
                                const d = new Date();
                                d.setDate(d.getDate() + offset);
                                const dStr = formatDateString(d);
                                const dayPlan = mealPlan[dStr] || {};
                                return (
                                    <div key={dStr} className="border rounded-lg p-3">
                                        <h4 className="font-bold text-sm text-gray-700 mb-2">{d.toLocaleDateString(undefined, {weekday: 'long'})}</h4>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['breakfast', 'lunch', 'dinner', 'snack'].map(m => (
                                                <button 
                                                    key={m} 
                                                    onClick={() => onAddToPlan(dStr, m)}
                                                    className={`text-xs border rounded p-2 text-left truncate ${dayPlan[m] ? `bg-${baseColor}-50 border-${baseColor}-200 text-${baseColor}-700` : 'bg-gray-50 text-gray-400 border-dashed'}`}
                                                >
                                                    {dayPlan[m]?.title || `+ ${m}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'recipes' && (
                     <div className="p-1">
                        <div className="flex justify-end gap-2 mb-4">
                             <button onClick={onShowSuggestRecipe} className="p-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200" title="Suggest with AI">
                                 <Icon name="sparkles" className="w-5 h-5"/>
                             </button>
                             <button onClick={onShowAddRecipe} className={`flex items-center gap-2 px-4 py-2 bg-${baseColor}-600 text-white rounded-lg shadow hover:bg-${baseColor}-700`}>
                                 <Icon name="plus" className="w-4 h-4"/> New Plate
                             </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                             {recipes.length === 0 && <EmptyState illustration={<Icon name="book" className="w-12 h-12 text-gray-300"/>} title="No Saved Plates" message="Create reusable plates to make logging faster." />}
                        </div>
                    </div>
                )}
            </div>

            {/* Meal Prep Modal Overlay */}
            {itemsToPlan && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-2">Plan for Later?</h3>
                        <p className="text-sm text-gray-600 mb-4">Convert this meal log into a saved recipe so you can add it to your Meal Plan.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setItemsToPlan(null)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                            <button onClick={confirmPlan} className={`flex-1 py-2 bg-${baseColor}-600 text-white rounded-lg font-bold`}>Save as Recipe</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecipesPage;
