
import React, { useState, useMemo } from 'react';
import { Recipe, RecipeFilter, MealPlan, TriedFoodLog, Food, CustomFood, LoggedItemData, FoodStatus, SavedStrategy } from '../../types';
import { allFoods, BEHAVIOR_TAGS } from '../../constants';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';

interface RecipesPageProps {
    recipes: Recipe[];
    mealPlan: MealPlan;
    triedFoods?: TriedFoodLog[];
    customFoods?: CustomFood[];
    savedStrategies?: SavedStrategy[];
    onShowAddRecipe: () => void;
    onShowImportRecipe: () => void;
    onShowSuggestRecipe: () => void;
    onViewRecipe: (recipe: Recipe) => void;
    onAddToPlan: (date: string, meal: string) => void;
    onShowShoppingList: () => void;
    onBatchLog?: (items: LoggedItemData[], date: string, meal: string, photo?: string, notes?: string, strategy?: string) => void;
    onUpdateBatchLog?: (originalDate: string, originalMeal: string, items: LoggedItemData[], newDate: string, newMeal: string, photo?: string, notes?: string, strategy?: string) => void;
    onCreateRecipe?: (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'rating'>) => void;
    onEditRecipe?: (recipeData: Recipe) => void; 
    onDeleteRecipe?: (id: string) => void;
    onDeleteCustomFood?: (name: string) => void;
    onFoodClick?: (food: Food) => void;
    onAddCustomFood?: (initialName: string) => void;
    onScanBarcode?: () => void;
    baseColor?: string;
}

const formatDateString = (date: Date) => date.toISOString().split('T')[0];

const PORTION_UNITS = ['serving', 'tbsp', 'cup', 'oz', 'slice', 'piece', 'bowl', 'pouch', 'handful'];
const DEFAULT_STRATEGY_TYPES = ["The Bridge", "The Stealth Mode", "The Fun Factor", "Repeated Exposure", "Food Chaining"];

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

const CONSUMPTION_LEVELS = [
    { label: 'All', value: 'all', icon: 'check-circle', color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Most', value: 'most', icon: 'pie-chart', color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Some', value: 'some', icon: 'bar-chart-2', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'None', value: 'none', icon: 'x-circle', color: 'text-red-600', bg: 'bg-red-100' },
];

const FOOD_CATEGORIES_FILTER = [
    { id: 'all', label: 'All', icon: 'grid-2x2' },
    { id: 'saved_plates', label: 'Saved Plates', icon: 'book' },
    { id: 'Fruits', label: 'Fruits', icon: 'apple' },
    { id: 'Vegetables', label: 'Veggies', icon: 'carrot' },
    { id: 'Meat', label: 'Protein', icon: 'drumstick' }, // Matches 'Meat' or 'Plant Protein'
    { id: 'Grains', label: 'Carbs', icon: 'croissant' },
    { id: 'Dairy & Eggs', label: 'Dairy', icon: 'milk' },
    { id: 'Snacks', label: 'Snacks', icon: 'cookie' } 
];

const PlateBuilderView: React.FC<{ 
    recipes: Recipe[], 
    customFoods?: CustomFood[],
    savedStrategies?: SavedStrategy[],
    onSave: (items: LoggedItemData[], date: string, meal: string, photo?: string, notes?: string, strategy?: string) => void, 
    onCreateRecipe?: (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'rating'>) => void;
    onEditRecipe?: (recipe: Recipe) => void; 
    onDeleteRecipe?: (id: string) => void;
    onDeleteCustomFood?: (name: string) => void;
    onAddCustomFood?: (name: string) => void;
    onScanBarcode?: () => void;
    baseColor: string;
    date: string;
    setDate: (date: string) => void;
    setMode: (mode: 'log' | 'history' | 'plan' | 'recipes') => void;
    editingLog?: { originalDate: string, originalMeal: string, items: TriedFoodLog[] } | null;
    onCancelEdit?: () => void;
    onUpdateLog?: (originalDate: string, originalMeal: string, items: LoggedItemData[], newDate: string, newMeal: string, photo?: string, notes?: string, strategy?: string) => void;
}> = ({ recipes, customFoods = [], savedStrategies = [], onSave, onCreateRecipe, onEditRecipe, onDeleteRecipe, onDeleteCustomFood, onAddCustomFood, onScanBarcode, baseColor, date, setDate, setMode, editingLog, onCancelEdit, onUpdateLog }) => {
    const [meal, setMeal] = useState<RecipeFilter>('lunch');
    const [selectedFoods, setSelectedFoods] = useState<LoggedItemData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null); 
    
    // Meta Data
    const [platePhoto, setPlatePhoto] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [selectedStrategy, setSelectedStrategy] = useState<string>('');
    const [presetName, setPresetName] = useState('');
    const [showSavePreset, setShowSavePreset] = useState(false);

    // Initialize from editingLog if present
    useMemo(() => {
        if (editingLog) {
            setDate(editingLog.originalDate);
            setMeal(editingLog.originalMeal as RecipeFilter);
            setNotes(editingLog.items[0]?.notes || '');
            setPlatePhoto(editingLog.items[0]?.messyFaceImage || null);
            setSelectedStrategy(editingLog.items[0]?.usedStrategy || '');
            
            const convertedItems: LoggedItemData[] = editingLog.items.map(log => ({
                food: log.id,
                status: 'eaten', 
                tags: [], 
                behavioralTags: log.behavioralTags || [],
                portion: log.portion,
                consumption: log.consumption
            }));
            setSelectedFoods(convertedItems);
        }
    }, [editingLog]);

    // Derived Foods List for Pantry
    const pantryFoods = useMemo(() => {
        // 1. Flatten all standard foods
        let all = allFoods.flatMap(c => c.items.map(i => ({...i, category: c.category})));
        
        // 2. Add custom foods with their specific categories
        const customMapped = customFoods.map(f => ({
            ...f,
            category: f.category || 'Snacks' // Fallback to Snacks if undefined
        }));
        all = [...all, ...customMapped];
        
        // 3. Search Filter
        if (searchQuery) {
            all = all.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
        } 
        // 4. Category Filter
        else if (categoryFilter !== 'all' && categoryFilter !== 'saved_plates') {
            if (categoryFilter === 'Meat') {
                // Special case: Filter "Meat" matches both "Meat" and "Plant Protein"
                all = all.filter(f => f.category === 'Meat' || f.category === 'Plant Protein' || f.category === 'Protein');
            } else {
                all = all.filter(f => f.category === categoryFilter);
            }
        }
        
        // 5. Remove Duplicates (Custom overrides Standard)
        const seen = new Set();
        return all.filter(f => {
            const duplicate = seen.has(f.name);
            seen.add(f.name);
            return !duplicate;
        });
    }, [searchQuery, categoryFilter, customFoods]);

    const addFoodToPlate = (food: Food) => {
        if (selectedFoods.some(f => f.food === food.name)) return;

        setSelectedFoods(prev => [...prev, { 
            food: food.name, 
            status: 'eaten', 
            tags: [],
            behavioralTags: [],
            portion: '1 serving', 
            consumption: 'all' 
        }]);
    };

    const addRecipeToPlate = (recipe: Recipe) => {
        const ingredients = recipe.ingredients.split('\n').map(i => i.replace(/^[-\*•]\s*/, '').trim());
        const newItems: LoggedItemData[] = [];
        
        ingredients.forEach(rawName => {
            const match = pantryFoods.find(f => rawName.toLowerCase().includes(f.name.toLowerCase()));
            const foodName = match ? match.name : rawName;
            
            if (!selectedFoods.some(f => f.food === foodName)) {
                newItems.push({
                    food: foodName,
                    status: 'eaten',
                    tags: [],
                    behavioralTags: [],
                    portion: '1 serving',
                    consumption: 'all'
                });
            }
        });

        if (newItems.length > 0) {
            setSelectedFoods(prev => [...prev, ...newItems]);
        }
    };

    const updateItem = (index: number, updates: Partial<LoggedItemData>) => {
        setSelectedFoods(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
    };

    // Helper for Portion Input
    const handlePortionChange = (index: number, amount: string, unit: string) => {
        const newVal = `${amount} ${unit}`.trim();
        updateItem(index, { portion: newVal });
    };

    const parsePortion = (portionStr?: string) => {
        if (!portionStr) return { amount: '1', unit: 'serving' };
        const parts = portionStr.split(' ');
        if (parts.length >= 2) {
            return { amount: parts[0], unit: parts.slice(1).join(' ') };
        }
        return { amount: parts[0], unit: 'serving' }; // Fallback
    };

    const toggleBehavioralTag = (index: number, tag: string) => {
        const item = selectedFoods[index];
        const currentTags = item.behavioralTags || [];
        const newTags = currentTags.includes(tag) 
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];
        updateItem(index, { behavioralTags: newTags });
    };

    const removeItem = (index: number) => {
        setSelectedFoods(prev => prev.filter((_, i) => i !== index));
        if (activeItemIndex === index) setActiveItemIndex(null);
    };

    const handleDeleteRecipeWithConfirm = (id: string, title: string) => {
        if (window.confirm(`Delete "${title}"?`)) {
            if (onDeleteRecipe) onDeleteRecipe(id);
        }
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

        const finalItems = selectedFoods.map(item => {
            let status: FoodStatus = 'eaten';
            if (item.consumption === 'none') status = 'refused';
            if (item.consumption === 'some') status = 'touched';
            
            return { ...item, status };
        });

        if (editingLog && onUpdateLog) {
            onUpdateLog(editingLog.originalDate, editingLog.originalMeal, finalItems, date, meal, platePhoto || undefined, notes, selectedStrategy);
            alert("Log Updated!");
        } else {
            onSave(finalItems, date, meal, platePhoto || undefined, notes, selectedStrategy);
            alert("Meal Logged!");
        }
        
        // Reset
        setSelectedFoods([]);
        setPlatePhoto(null);
        setNotes('');
        setPresetName('');
        setShowSavePreset(false);
        setMode('history');
    };

    const combinedBehaviors = [...BEHAVIOR_TAGS.touched, ...BEHAVIOR_TAGS.refused];

    return (
        <div className="flex flex-col h-[calc(100dvh-120px)] sm:h-[calc(100vh-140px)] bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-200">
            {/* 1. Header & Context */}
            <div className={`bg-white p-3 border-b flex justify-between items-center shrink-0 ${editingLog ? 'bg-orange-50 border-orange-200' : ''}`}>
                <div className="flex gap-2 items-center">
                     {editingLog && <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded hidden sm:inline">EDITING</span>}
                     <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)} 
                        className="text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-1.5 w-32 sm:w-auto"
                    />
                     <select 
                        value={meal} 
                        onChange={(e) => setMeal(e.target.value as RecipeFilter)}
                        className="text-sm border-gray-300 rounded-lg capitalize focus:ring-indigo-500 focus:border-indigo-500 py-1.5"
                    >
                        {['breakfast', 'lunch', 'dinner', 'snack'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="flex gap-2">
                    {editingLog && onCancelEdit && (
                        <button onClick={onCancelEdit} className="text-sm text-gray-500 underline">Cancel</button>
                    )}
                    {onScanBarcode && (
                        <button onClick={onScanBarcode} className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200">
                            <Icon name="scan-barcode" className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* 2. Main Content Area - Split Vertically on Mobile */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                
                {/* LEFT: THE PLATE (Visual Builder) */}
                <div className="w-full md:w-5/12 p-4 flex flex-col items-center border-b md:border-b-0 md:border-r bg-white overflow-y-auto flex-shrink-0 max-h-[50vh] md:max-h-full">
                    
                    {/* The Plate Visual */}
                    <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 border-gray-100 shadow-inner bg-gray-50 flex flex-wrap content-center justify-center gap-2 p-6 mb-4 transition-all shrink-0">
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
                                    className={`relative w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full shadow-md flex items-center justify-center border-2 transition-transform hover:scale-110 ${activeItemIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-200 z-10' : 'border-white'}`}
                                >
                                    <span className="text-xl sm:text-2xl">{getFoodEmoji(item.food, customFoods)}</span>
                                    {/* Mini Indicators */}
                                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border border-white flex items-center justify-center ${item.consumption === 'none' ? 'bg-red-500' : 'bg-green-500'}`}>
                                        <span className="text-[8px] text-white font-bold">{item.consumption?.[0]?.toUpperCase()}</span>
                                    </div>
                                    {item.behavioralTags && item.behavioralTags.length > 0 && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border border-white flex items-center justify-center">
                                            <span className="text-[8px] text-white font-bold">!</span>
                                        </div>
                                    )}
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
                            
                            {/* Portion Control (Updated with Input + Select) */}
                            <div className="mb-3">
                                <label className="text-[10px] uppercase font-bold text-indigo-400 mb-1 block">Portion Served</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        className="w-20 text-sm rounded border border-gray-300 focus:ring-indigo-500 py-1"
                                        placeholder="1"
                                        value={parsePortion(selectedFoods[activeItemIndex].portion).amount}
                                        onChange={(e) => handlePortionChange(activeItemIndex, e.target.value, parsePortion(selectedFoods[activeItemIndex].portion).unit)}
                                    />
                                    <select
                                        className="flex-1 text-sm rounded border border-gray-300 focus:ring-indigo-500 py-1"
                                        value={parsePortion(selectedFoods[activeItemIndex].portion).unit}
                                        onChange={(e) => handlePortionChange(activeItemIndex, parsePortion(selectedFoods[activeItemIndex].portion).amount, e.target.value)}
                                    >
                                        {PORTION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Consumption Control */}
                            <div className="mb-3">
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

                            {/* Behavioral Tags */}
                            <div>
                                <label className="text-[10px] uppercase font-bold text-indigo-400 mb-1 block">Behavior (Optional)</label>
                                <div className="flex flex-wrap gap-1">
                                    {combinedBehaviors.map(tag => {
                                        const isSelected = selectedFoods[activeItemIndex].behavioralTags?.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                onClick={() => toggleBehavioralTag(activeItemIndex, tag)}
                                                className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${isSelected ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-white text-gray-500 border-gray-200'}`}
                                            >
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Metadata (Photo, Notes, Strategy) */}
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

                        {/* Strategy Selector - With Defaults */}
                        <div className="relative">
                            <select 
                                value={selectedStrategy}
                                onChange={(e) => setSelectedStrategy(e.target.value)}
                                className="w-full text-xs border-gray-200 rounded-lg bg-gray-50 focus:bg-white text-gray-600 appearance-none py-2 px-3"
                            >
                                <option value="">Did you use a strategy?</option>
                                <optgroup label="My Saved Strategies">
                                    {savedStrategies.map(s => (
                                        <option key={s.id} value={s.title}>{s.title} ({s.type})</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Strategy Types">
                                    {DEFAULT_STRATEGY_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </optgroup>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <Icon name="chevron-down" className="w-3 h-3 text-gray-400" />
                            </div>
                        </div>
                        
                        {!editingLog && (
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="savePreset" checked={showSavePreset} onChange={e => setShowSavePreset(e.target.checked)} className="rounded text-indigo-600" />
                                <label htmlFor="savePreset" className="text-xs text-gray-600">Save as Preset?</label>
                            </div>
                        )}
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
                            <Icon name={editingLog ? "refresh-cw" : "check"} className="w-5 h-5" /> {editingLog ? "Update Log" : "Log Meal"}
                        </button>
                    </div>
                </div>

                {/* RIGHT: THE PANTRY (Selection) */}
                <div className="w-full md:w-7/12 flex flex-col bg-gray-50/50 flex-1 overflow-hidden">
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
                        {/* Show Recipes if 'saved_plates' selected OR 'all' selected with no search */}
                        {(categoryFilter === 'saved_plates' || (categoryFilter === 'all' && !searchQuery)) && recipes.length > 0 && (
                             <div className="mb-6">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Saved Plates</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {recipes.map(recipe => (
                                        <div key={recipe.id} className="relative group">
                                            <button 
                                                onClick={() => addRecipeToPlate(recipe)}
                                                className="w-full text-left p-3 bg-white border border-indigo-100 rounded-xl shadow-sm hover:border-indigo-300 transition-colors"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <h5 className="font-bold text-gray-800 text-sm group-hover:text-indigo-700">{recipe.title}</h5>
                                                    <Icon name="plus-circle" className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" />
                                                </div>
                                                <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{recipe.ingredients.replace(/\n/g, ', ')}</p>
                                            </button>
                                            
                                            {/* Action Buttons for Recipe */}
                                            <div className="absolute top-2 right-8 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {onEditRecipe && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onEditRecipe(recipe); }}
                                                        className="p-1 bg-white border border-gray-200 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"
                                                    >
                                                        <Icon name="edit-2" className="w-3 h-3" />
                                                    </button>
                                                )}
                                                {onDeleteRecipe && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteRecipeWithConfirm(recipe.id, recipe.title); }}
                                                        className="p-1 bg-white border border-gray-200 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                                                    >
                                                        <Icon name="trash-2" className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}

                        {/* Hide Foods if only showing Saved Plates */}
                        {categoryFilter !== 'saved_plates' && (
                            <>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Foods</h4>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {pantryFoods.map(food => {
                                        // Check if food is custom to show delete button
                                        const isCustom = customFoods.some(c => c.name === food.name);
                                        return (
                                            <div key={food.name} className="relative group">
                                                <button
                                                    onClick={() => addFoodToPlate(food)}
                                                    className="w-full flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-400 hover:shadow-sm transition-all active:scale-95"
                                                >
                                                    <span className="text-2xl mb-1">{food.emoji}</span>
                                                    <span className="text-[10px] font-bold text-gray-700 text-center leading-tight line-clamp-2">{food.name}</span>
                                                </button>
                                                {isCustom && onDeleteCustomFood && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDeleteCustomFood(food.name); }}
                                                        className="absolute -top-1 -right-1 bg-white border border-gray-200 rounded-full p-1 text-gray-400 hover:text-red-500 hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Delete Custom Food"
                                                    >
                                                        <Icon name="trash-2" className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                {pantryFoods.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-gray-400">No foods found.</p>
                                        {searchQuery && onAddCustomFood && (
                                            <button onClick={() => onAddCustomFood(searchQuery)} className="mt-2 text-indigo-600 font-bold text-sm">Create "{searchQuery}"</button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const RecipesPage: React.FC<RecipesPageProps> = (props) => {
    const [mode, setMode] = useState<'log' | 'history' | 'plan' | 'recipes'>('log');
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingLog, setEditingLog] = useState<{ originalDate: string, originalMeal: string, items: TriedFoodLog[] } | null>(null);

    const baseColor = props.baseColor || 'teal';

    const handleEditLog = (logGroup: { date: string, meal: string, items: TriedFoodLog[] }) => {
        setEditingLog({ originalDate: logGroup.date, originalMeal: logGroup.meal, items: logGroup.items });
        setViewDate(logGroup.date);
        setMode('log');
    };

    const handleCancelEdit = () => {
        setEditingLog(null);
        setMode('history');
    };
    
    // Group logs for history view
    const historyGroups = useMemo(() => {
        if (!props.triedFoods) return [];
        const groups: Record<string, TriedFoodLog[]> = {};
        props.triedFoods.forEach(log => {
            // Group by Date + Meal
            const key = `${log.date}-${log.meal}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(log);
        });
        
        return Object.entries(groups)
            .map(([key, items]) => ({
                key,
                date: items[0].date,
                meal: items[0].meal,
                items,
                photo: items[0].messyFaceImage
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [props.triedFoods]);

    return (
        <div className="h-full flex flex-col">
             <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-4 shrink-0 mx-2 mt-2 sm:mx-0 sm:mt-0">
                <button 
                    onClick={() => { setMode('log'); setEditingLog(null); }}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${mode === 'log' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Icon name="utensils" className="w-4 h-4" /> <span className="hidden sm:inline">Plate</span> Builder
                </button>
                <button 
                    onClick={() => setMode('history')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${mode === 'history' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Icon name="calendar" className="w-4 h-4" /> History
                </button>
                <button 
                    onClick={() => setMode('recipes')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${mode === 'recipes' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Icon name="book" className="w-4 h-4" /> Recipes
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative px-2 sm:px-0">
                {mode === 'log' && (
                    <PlateBuilderView 
                        recipes={props.recipes}
                        customFoods={props.customFoods}
                        savedStrategies={props.savedStrategies}
                        onSave={props.onBatchLog || (() => {})}
                        onCreateRecipe={props.onCreateRecipe}
                        onEditRecipe={(r) => { if(props.onEditRecipe) props.onEditRecipe(r); }}
                        onDeleteRecipe={props.onDeleteRecipe}
                        onDeleteCustomFood={props.onDeleteCustomFood}
                        onAddCustomFood={props.onAddCustomFood}
                        onScanBarcode={props.onScanBarcode}
                        baseColor={baseColor}
                        date={viewDate}
                        setDate={setViewDate}
                        setMode={setMode}
                        editingLog={editingLog}
                        onCancelEdit={handleCancelEdit}
                        onUpdateLog={props.onUpdateBatchLog}
                    />
                )}

                {mode === 'history' && (
                    <div className="h-full overflow-y-auto pb-24 space-y-4">
                        {historyGroups.length === 0 ? (
                            <EmptyState 
                                illustration={<Icon name="calendar-off" className="w-16 h-16 text-gray-300" />}
                                title="No Meals Logged"
                                message="Use the Plate Builder to log your first meal!"
                            >
                                <button onClick={() => setMode('log')} className={`mt-4 px-4 py-2 bg-${baseColor}-600 text-white rounded-lg font-bold text-sm shadow-sm`}>
                                    Go to Plate Builder
                                </button>
                            </EmptyState>
                        ) : (
                            historyGroups.map(group => (
                                <div key={group.key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-indigo-100 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${baseColor}-50 text-${baseColor}-600`}>
                                                <Icon name={group.meal === 'breakfast' ? 'coffee' : group.meal === 'lunch' ? 'sun' : group.meal === 'dinner' ? 'moon' : 'cookie'} className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 capitalize">{group.meal}</h4>
                                                <p className="text-xs text-gray-500">{new Date(group.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleEditLog(group)}
                                            className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    
                                    {group.photo && (
                                        <div className="mb-3 rounded-lg overflow-hidden h-32 w-full">
                                            <img src={group.photo} alt="Meal" className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {group.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-2.5 py-1 border border-gray-100">
                                                <span className="text-sm">{getFoodEmoji(item.id, props.customFoods)}</span>
                                                <span className="text-xs font-medium text-gray-700">{item.id}</span>
                                                {/* Mini status indicator */}
                                                <div className={`w-1.5 h-1.5 rounded-full ${item.reaction <= 2 ? 'bg-red-400' : item.reaction <= 4 ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {group.items[0].notes && (
                                        <p className="mt-3 text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg">
                                            "{group.items[0].notes}"
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {mode === 'recipes' && (
                    <div className="h-full overflow-y-auto pb-24 space-y-4">
                        <div className="bg-gradient-to-r from-indigo-50 to-white p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                             <div>
                                 <h3 className="font-bold text-indigo-900">Your Recipe Box</h3>
                                 <p className="text-xs text-indigo-700">{props.recipes.length} recipes saved</p>
                             </div>
                             <button onClick={props.onShowAddRecipe} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700">
                                 + New
                             </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={props.onShowSuggestRecipe} className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 font-bold text-xs flex flex-col items-center gap-2 hover:bg-purple-100 transition-colors">
                                <Icon name="sparkles" className="w-6 h-6" />
                                AI Chef
                            </button>
                            <button onClick={props.onShowImportRecipe} className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 font-bold text-xs flex flex-col items-center gap-2 hover:bg-blue-100 transition-colors">
                                <Icon name="camera" className="w-6 h-6" />
                                Scan Recipe
                            </button>
                        </div>
                        
                        {props.recipes.length === 0 ? (
                            <div className="text-center py-10">
                                <Icon name="book-dashed" className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">No recipes yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {props.recipes.map(recipe => (
                                    <div key={recipe.id} onClick={() => props.onViewRecipe(recipe)} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center cursor-pointer hover:border-indigo-300 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                                                📜
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-800">{recipe.title}</h4>
                                                <p className="text-[10px] text-gray-500">{recipe.ingredients.split('\n').length} ingredients</p>
                                            </div>
                                        </div>
                                        <Icon name="chevron-right" className="w-4 h-4 text-gray-300" />
                                    </div>
                                ))}
                            </div>
                        )}
                        
                         <button onClick={props.onShowShoppingList} className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2">
                             <Icon name="shopping-cart" className="w-4 h-4" /> View Shopping List
                         </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecipesPage;
