import React, { useState, useMemo, useEffect } from 'react';
import { Recipe, RecipeFilter, MealPlan, TriedFoodLog, Food, CustomFood, LoggedItemData, FoodStatus, SavedStrategy, ManualShoppingItem, AppMode } from '../../types';
import { allFoods, BEHAVIOR_TAGS } from '../../constants';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';

interface RecipesPageProps {
    recipes: Recipe[];
    mealPlan: MealPlan;
    triedFoods?: TriedFoodLog[];
    customFoods?: CustomFood[];
    savedStrategies?: SavedStrategy[];
    manualShoppingItems?: ManualShoppingItem[];
    shoppingCheckedItems?: Record<string, string>;
    onShowAddRecipe: () => void;
    onShowImportRecipe: () => void;
    onShowSuggestRecipe: () => void;
    onViewRecipe: (recipe: Recipe) => void;
    onAddToPlan: (date: string, meal: string) => void;
    onRemoveFromPlan?: (date: string, meal: string) => void;
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
    onAddManualShoppingItem?: (name: string) => void;
    onToggleShoppingItem?: (name: string, isChecked: boolean) => void;
    onClearCheckedShoppingItems?: () => void;
    baseColor?: string;
    appMode?: AppMode;
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

// --- SUB-VIEWS ---

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
        let all = allFoods.flatMap(c => c.items.map(i => ({...i, category: c.category})));
        const customMapped = customFoods.map(f => ({ ...f, category: f.category || 'Snacks' }));
        all = [...all, ...customMapped];
        
        if (searchQuery) {
            all = all.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
        } else if (categoryFilter !== 'all' && categoryFilter !== 'saved_plates') {
            if (categoryFilter === 'Meat') {
                all = all.filter(f => f.category === 'Meat' || f.category === 'Plant Protein' || f.category === 'Protein');
            } else {
                all = all.filter(f => f.category === categoryFilter);
            }
        }
        
        const seen = new Set();
        return all.filter(f => {
            const duplicate = seen.has(f.name);
            seen.add(f.name);
            return !duplicate;
        });
    }, [searchQuery, categoryFilter, customFoods]);

    const addFoodToPlate = (food: Food) => {
        if (selectedFoods.some(f => f.food === food.name)) return;
        setSelectedFoods(prev => [...prev, { food: food.name, status: 'eaten', tags: [], behavioralTags: [], portion: '1 serving', consumption: 'all' }]);
    };

    const addRecipeToPlate = (recipe: Recipe) => {
        const ingredients = recipe.ingredients.split('\n').map(i => i.replace(/^[-\*•]\s*/, '').trim());
        const newItems: LoggedItemData[] = [];
        ingredients.forEach(rawName => {
            const match = pantryFoods.find(f => rawName.toLowerCase().includes(f.name.toLowerCase()));
            const foodName = match ? match.name : rawName;
            if (!selectedFoods.some(f => f.food === foodName)) {
                newItems.push({ food: foodName, status: 'eaten', tags: [], behavioralTags: [], portion: '1 serving', consumption: 'all' });
            }
        });
        if (newItems.length > 0) setSelectedFoods(prev => [...prev, ...newItems]);
    };

    const updateItem = (index: number, updates: Partial<LoggedItemData>) => {
        setSelectedFoods(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
    };

    const handlePortionChange = (index: number, amount: string, unit: string) => {
        const newVal = `${amount} ${unit}`.trim();
        updateItem(index, { portion: newVal });
    };

    const parsePortion = (portionStr?: string) => {
        if (!portionStr) return { amount: '1', unit: 'serving' };
        const parts = portionStr.split(' ');
        if (parts.length >= 2) return { amount: parts[0], unit: parts.slice(1).join(' ') };
        return { amount: parts[0], unit: 'serving' };
    };

    const toggleBehavioralTag = (index: number, tag: string) => {
        const item = selectedFoods[index];
        const currentTags = item.behavioralTags || [];
        const newTags = currentTags.includes(tag) ? currentTags.filter(t => t !== tag) : [...currentTags, tag];
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
        setSelectedFoods([]); setPlatePhoto(null); setNotes(''); setPresetName(''); setShowSavePreset(false); setMode('history');
    };

    const combinedBehaviors = [...BEHAVIOR_TAGS.touched, ...BEHAVIOR_TAGS.refused];
    const FOOD_CATEGORIES_FILTER = [
        { id: 'all', label: 'All', icon: 'grid-2x2' },
        { id: 'saved_plates', label: 'Saved Plates', icon: 'book' },
        { id: 'Fruits', label: 'Fruits', icon: 'apple' },
        { id: 'Vegetables', label: 'Veggies', icon: 'carrot' },
        { id: 'Meat', label: 'Protein', icon: 'drumstick' },
        { id: 'Grains', label: 'Carbs', icon: 'croissant' },
        { id: 'Dairy & Eggs', label: 'Dairy', icon: 'milk' },
        { id: 'Snacks', label: 'Snacks', icon: 'cookie' } 
    ];
    const CONSUMPTION_LEVELS = [
        { label: 'All', value: 'all', icon: 'check-circle', color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Most', value: 'most', icon: 'pie-chart', color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Some', value: 'some', icon: 'bar-chart-2', color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { label: 'None', value: 'none', icon: 'x-circle', color: 'text-red-600', bg: 'bg-red-100' },
    ];

    return (
        <div className="flex flex-col h-[calc(100dvh-120px)] sm:h-[calc(100vh-140px)] bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <div className={`bg-white p-3 border-b flex justify-between items-center shrink-0 ${editingLog ? 'bg-orange-50 border-orange-200' : ''}`}>
                <div className="flex gap-2 items-center">
                     {editingLog && <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded hidden sm:inline">EDITING</span>}
                     <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-1.5 w-32 sm:w-auto"/>
                     <select value={meal} onChange={(e) => setMeal(e.target.value as RecipeFilter)} className="text-sm border-gray-300 rounded-lg capitalize focus:ring-indigo-500 focus:border-indigo-500 py-1.5">
                        {['breakfast', 'lunch', 'dinner', 'snack'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="flex gap-2">
                    {editingLog && onCancelEdit && <button onClick={onCancelEdit} className="text-sm text-gray-500 underline">Cancel</button>}
                    {onScanBarcode && <button onClick={onScanBarcode} className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200"><Icon name="scan-barcode" className="w-5 h-5" /></button>}
                </div>
            </div>
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className="w-full md:w-5/12 p-4 flex flex-col items-center border-b md:border-b-0 md:border-r bg-white overflow-y-auto flex-shrink-0 max-h-[50vh] md:max-h-full">
                    {selectedFoods.length === 0 ? (
                        <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 border-gray-100 shadow-inner bg-gray-50 flex flex-wrap content-center justify-center gap-2 p-6 mb-4 transition-all shrink-0">
                            <div className="text-center text-gray-300"><Icon name="utensils" className="w-12 h-12 mx-auto mb-2 opacity-50" /><p className="text-sm font-medium">Tap foods to build plate</p></div>
                        </div>
                    ) : (
                        <div className="w-full mb-4">
                            <div className="flex gap-2 overflow-x-auto pb-4 pt-2 px-1 no-scrollbar snap-x">
                                {selectedFoods.map((item, idx) => (
                                    <button 
                                        key={`${item.food}-${idx}`} 
                                        onClick={() => setActiveItemIndex(idx)} 
                                        className={`relative shrink-0 w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center border-2 transition-transform snap-center ${activeItemIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-200 scale-110 z-10' : 'border-gray-100'}`}
                                    >
                                        <span className="text-2xl">{getFoodEmoji(item.food, customFoods)}</span>
                                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border border-white flex items-center justify-center shadow-sm ${item.consumption === 'none' ? 'bg-red-500' : 'bg-green-500'}`}><span className="text-[9px] text-white font-bold">{item.consumption?.[0]?.toUpperCase()}</span></div>
                                        {item.behavioralTags && item.behavioralTags.length > 0 && (<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border border-white flex items-center justify-center shadow-sm"><span className="text-[10px] text-white font-bold">!</span></div>)}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-center text-gray-400 mt-1">Scroll to see all</p>
                        </div>
                    )}
                    
                    {activeItemIndex !== null && selectedFoods[activeItemIndex] && (
                        <div className="w-full bg-indigo-50 rounded-xl p-4 mb-4 animate-fadeIn border border-indigo-100">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-indigo-900 flex items-center gap-2">{getFoodEmoji(selectedFoods[activeItemIndex].food, customFoods)} {selectedFoods[activeItemIndex].food}</span>
                                <button onClick={() => removeItem(activeItemIndex)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Icon name="trash-2" className="w-4 h-4" /></button>
                            </div>
                            <div className="mb-3">
                                <label className="text-[10px] uppercase font-bold text-indigo-400 mb-1 block">Portion Served</label>
                                <div className="flex gap-2">
                                    <input type="number" className="w-20 text-sm rounded border border-gray-300 focus:ring-indigo-500 py-1" placeholder="1" value={parsePortion(selectedFoods[activeItemIndex].portion).amount} onChange={(e) => handlePortionChange(activeItemIndex, e.target.value, parsePortion(selectedFoods[activeItemIndex].portion).unit)}/>
                                    <select className="flex-1 text-sm rounded border border-gray-300 focus:ring-indigo-500 py-1" value={parsePortion(selectedFoods[activeItemIndex].portion).unit} onChange={(e) => handlePortionChange(activeItemIndex, parsePortion(selectedFoods[activeItemIndex].portion).amount, e.target.value)}>
                                        {PORTION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="text-[10px] uppercase font-bold text-indigo-400 mb-1 block">Amount Eaten</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {CONSUMPTION_LEVELS.map(level => {
                                        const isSelected = selectedFoods[activeItemIndex].consumption === level.value;
                                        return <button key={level.value} onClick={() => updateItem(activeItemIndex, { consumption: level.value as any })} className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${isSelected ? `${level.bg} ${level.color} border-current ring-1` : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}><Icon name={level.icon} className="w-4 h-4 mb-1" /><span className="text-[9px] font-bold">{level.label}</span></button>
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-indigo-400 mb-1 block">Behavior (Optional)</label>
                                <div className="flex flex-wrap gap-1">
                                    {combinedBehaviors.map(tag => {
                                        const isSelected = selectedFoods[activeItemIndex].behavioralTags?.includes(tag);
                                        return <button key={tag} onClick={() => toggleBehavioralTag(activeItemIndex, tag)} className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${isSelected ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-white text-gray-500 border-gray-200'}`}>{tag}</button>
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="w-full space-y-3 mt-auto">
                        <button onClick={() => document.getElementById('plate-photo-input')?.click()} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-2">{platePhoto ? <span className="text-green-600 flex items-center gap-1"><Icon name="check" className="w-3 h-3"/> Photo Added</span> : <><Icon name="camera" className="w-3 h-3"/> Add Plate Photo</>}</button>
                        <input id="plate-photo-input" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes?" className="w-full text-xs border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors"/>
                        <div className="relative">
                            <select value={selectedStrategy} onChange={(e) => setSelectedStrategy(e.target.value)} className="w-full text-xs border-gray-200 rounded-lg bg-gray-50 focus:bg-white text-gray-600 appearance-none py-2 px-3">
                                <option value="">Did you use a strategy?</option>
                                <optgroup label="My Saved Strategies">{savedStrategies.map(s => <option key={s.id} value={s.title}>{s.title} ({s.type})</option>)}</optgroup>
                                <optgroup label="Strategy Types">{DEFAULT_STRATEGY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</optgroup>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none"><Icon name="chevron-down" className="w-3 h-3 text-gray-400" /></div>
                        </div>
                        {!editingLog && <div className="flex items-center gap-2"><input type="checkbox" id="savePreset" checked={showSavePreset} onChange={e => setShowSavePreset(e.target.checked)} className="rounded text-indigo-600" /><label htmlFor="savePreset" className="text-xs text-gray-600">Save as Preset?</label></div>}
                        {showSavePreset && <input value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="e.g. Monday Pasta" className="w-full text-xs border-indigo-200 rounded-lg focus:ring-indigo-500"/>}
                        <button onClick={handleSaveLog} disabled={selectedFoods.length === 0} className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${selectedFoods.length > 0 ? `bg-${baseColor}-600 hover:bg-${baseColor}-700` : 'bg-gray-300'}`}><Icon name={editingLog ? "refresh-cw" : "check"} className="w-5 h-5" /> {editingLog ? "Update Log" : "Log Meal"}</button>
                    </div>
                </div>
                <div className="w-full md:w-7/12 flex flex-col bg-gray-50/50 flex-1 overflow-hidden">
                    <div className="p-3 bg-white border-b space-y-3">
                        <div className="flex gap-2">
                             <div className="relative flex-1"><Icon name="search" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search food..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 py-2 text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"/></div>
                             {onAddCustomFood && <button onClick={() => onAddCustomFood(searchQuery)} className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"><Icon name="plus" className="w-5 h-5" /></button>}
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {FOOD_CATEGORIES_FILTER.map(cat => (
                                <button key={cat.id} onClick={() => setCategoryFilter(cat.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${categoryFilter === cat.id ? `bg-${baseColor}-600 text-white border-${baseColor}-600` : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}><Icon name={cat.icon} className="w-3 h-3" />{cat.label}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                        {(categoryFilter === 'saved_plates' || (categoryFilter === 'all' && !searchQuery)) && recipes.length > 0 && (
                             <div className="mb-6">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Saved Plates</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {recipes.map(recipe => (
                                        <div key={recipe.id} className="relative group">
                                            <button onClick={() => addRecipeToPlate(recipe)} className="w-full text-left p-3 bg-white border border-indigo-100 rounded-xl shadow-sm hover:border-indigo-300 transition-colors">
                                                <div className="flex justify-between items-start"><h5 className="font-bold text-gray-800 text-sm group-hover:text-indigo-700">{recipe.title}</h5><Icon name="plus-circle" className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" /></div>
                                                <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{recipe.ingredients.replace(/\n/g, ', ')}</p>
                                            </button>
                                            <div className="absolute top-2 right-2 flex gap-1 z-10">
                                                {onEditRecipe && <button onClick={(e) => { e.stopPropagation(); onEditRecipe(recipe); }} className="p-1 bg-white border border-gray-200 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 shadow-sm"><Icon name="edit-2" className="w-3 h-3" /></button>}
                                                {onDeleteRecipe && <button onClick={(e) => { e.stopPropagation(); handleDeleteRecipeWithConfirm(recipe.id, recipe.title); }} className="p-1 bg-white border border-gray-200 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 shadow-sm"><Icon name="trash-2" className="w-3 h-3" /></button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}
                        {categoryFilter !== 'saved_plates' && (
                            <>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Foods</h4>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {pantryFoods.map(food => {
                                        const isCustom = customFoods.some(c => c.name === food.name);
                                        return (
                                            <div key={food.name} className="relative group">
                                                <button onClick={() => addFoodToPlate(food)} className="w-full flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-400 hover:shadow-sm transition-all active:scale-95">
                                                    <span className="text-2xl mb-1">{food.emoji}</span><span className="text-[10px] font-bold text-gray-700 text-center leading-tight line-clamp-2">{food.name}</span>
                                                </button>
                                                {isCustom && onDeleteCustomFood && <button onClick={(e) => { e.stopPropagation(); onDeleteCustomFood(food.name); }} className="absolute -top-1 -right-1 bg-white border border-gray-200 rounded-full p-1 text-gray-400 hover:text-red-500 hover:border-red-200 shadow-sm z-10" title="Delete Custom Food"><Icon name="trash-2" className="w-3 h-3" /></button>}
                                            </div>
                                        )
                                    })}
                                </div>
                                {pantryFoods.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-gray-400">No foods found.</p>
                                        {searchQuery && onAddCustomFood && <button onClick={() => onAddCustomFood(searchQuery)} className="mt-2 text-indigo-600 font-bold text-sm">Create "{searchQuery}"</button>}
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

const PlanView: React.FC<{ mealPlan: MealPlan, onAdd: (date: string, meal: string) => void, onRemove?: (date: string, meal: string) => void, baseColor: string }> = ({ mealPlan, onAdd, onRemove, baseColor }) => {
    // Generate next 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    const meals = ['breakfast', 'lunch', 'dinner', 'snack'];

    return (
        <div className="h-full overflow-y-auto pb-24 space-y-4 px-2 sm:px-4">
            <div className="bg-gradient-to-r from-teal-50 to-white p-4 rounded-xl border border-teal-100 flex justify-between items-center mb-4">
                <div>
                    <h3 className="font-bold text-teal-900">Weekly Meal Plan</h3>
                    <p className="text-xs text-teal-700">Tap a slot to add a recipe.</p>
                </div>
                <Icon name="calendar" className="w-8 h-8 text-teal-200" />
            </div>

            {days.map((dateObj) => {
                const dateStr = formatDateString(dateObj);
                const dayPlan = mealPlan[dateStr] || {};
                const isToday = dateStr === formatDateString(new Date());

                return (
                    <div key={dateStr} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isToday ? 'border-teal-300 ring-1 ring-teal-100' : 'border-gray-200'}`}>
                        <div className={`px-4 py-2 border-b flex justify-between items-center ${isToday ? 'bg-teal-50' : 'bg-gray-50'}`}>
                            <h4 className={`font-bold text-sm ${isToday ? 'text-teal-800' : 'text-gray-700'}`}>
                                {dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                {isToday && <span className="ml-2 text-[10px] bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full uppercase font-bold">Today</span>}
                            </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-px bg-gray-100">
                            {meals.map(meal => {
                                const plannedItem = dayPlan[meal];
                                return (
                                    <div key={meal} className="bg-white p-3 flex flex-col justify-center min-h-[80px] relative group">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{meal}</span>
                                        {plannedItem ? (
                                            <div className="flex-1 flex items-center justify-between">
                                                <span className="text-xs font-semibold text-gray-800 line-clamp-2">{plannedItem.title}</span>
                                                {onRemove && (
                                                    <button 
                                                        onClick={() => onRemove(dateStr, meal)}
                                                        className="text-gray-300 hover:text-red-500 p-1"
                                                    >
                                                        <Icon name="trash-2" className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => onAdd(dateStr, meal)}
                                                className="flex-1 flex items-center gap-1 text-gray-300 hover:text-teal-600 transition-colors"
                                            >
                                                <Icon name="plus-circle" className="w-4 h-4" />
                                                <span className="text-xs font-medium">Add</span>
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
    );
};

const HistoryView: React.FC<{ 
    triedFoods: TriedFoodLog[]; 
    baseColor: string; 
    onAddToPlan: (log: TriedFoodLog[]) => void;
    onEditLog: (items: TriedFoodLog[]) => void;
}> = ({ triedFoods, baseColor, onAddToPlan, onEditLog }) => {
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
                             <div className="flex gap-2">
                                <button onClick={() => onEditLog(items)} className="text-gray-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded transition-colors" title="Edit Log"><Icon name="edit-3" className="w-4 h-4" /></button>
                                <button onClick={() => onAddToPlan(items)} className={`text-xs bg-${baseColor}-50 text-${baseColor}-700 px-3 py-1.5 rounded-full font-bold hover:bg-${baseColor}-100`}>Plan This</button>
                             </div>
                         </div>
                         <div className="space-y-2">
                             {items.map((item, idx) => (
                                 <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-1 last:pb-0">
                                     <span className="text-gray-700">{item.id}</span>
                                     <div className="flex items-center gap-2">
                                         {item.portion && <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 rounded">{item.portion}</span>}
                                         {item.consumption && <span className={`text-[10px] font-bold uppercase ${item.consumption === 'none' ? 'text-red-500' : item.consumption === 'all' ? 'text-green-500' : 'text-blue-500'}`}>{item.consumption}</span>}
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

const RecipesPage: React.FC<RecipesPageProps> = (props) => {
    const isToddler = props.appMode === 'TODDLER';
    const [mode, setMode] = useState<'log' | 'history' | 'plan' | 'recipes'>(() => isToddler ? 'log' : 'recipes');
    
    // Ensure we switch to a visible tab if mode changes
    useEffect(() => {
        if (!isToddler && (mode === 'log' || mode === 'history')) {
            setMode('recipes');
        }
    }, [isToddler, mode]);

    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingLog, setEditingLog] = useState<{ originalDate: string, originalMeal: string, items: TriedFoodLog[] } | null>(null);
    const [itemsToPlan, setItemsToPlan] = useState<TriedFoodLog[] | null>(null);

    const baseColor = props.baseColor || 'teal';

    const handleEditLog = (items: TriedFoodLog[]) => {
        if (!items || items.length === 0) return;
        const first = items[0];
        setEditingLog({ originalDate: first.date, originalMeal: first.meal, items: items });
        setViewDate(first.date);
        setMode('log');
    };

    const handleCancelEdit = () => {
        setEditingLog(null);
        setMode('history');
    };

    const handlePlanItems = (items: TriedFoodLog[]) => {
        setItemsToPlan(items);
    };

    const confirmPlan = () => {
        if (!itemsToPlan || !itemsToPlan.length) return;
        const meal = itemsToPlan[0].meal; 
        const title = `${meal} copy from ${itemsToPlan[0].date}`;
        const ingredients = itemsToPlan.map(i => i.id).join('\n');
        
        if (props.onCreateRecipe) {
             props.onCreateRecipe({
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
        <div className="h-full flex flex-col">
             <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-4 shrink-0 mx-2 mt-2 sm:mx-0 sm:mt-0 overflow-x-auto no-scrollbar">
                {isToddler && (
                    <button onClick={() => { setMode('log'); setEditingLog(null); }} className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap px-2 ${mode === 'log' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}><Icon name="utensils" className="w-4 h-4" /> <span className="hidden sm:inline">Plate</span> Builder</button>
                )}
                <button onClick={() => setMode('plan')} className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap px-2 ${mode === 'plan' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}><Icon name="calendar" className="w-4 h-4" /> Plan</button>
                {isToddler && (
                    <button onClick={() => setMode('history')} className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap px-2 ${mode === 'history' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}><Icon name="clock" className="w-4 h-4" /> History</button>
                )}
                <button onClick={() => setMode('recipes')} className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap px-2 ${mode === 'recipes' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}><Icon name="book" className="w-4 h-4" /> Recipes</button>
            </div>

            <div className="flex-1 overflow-hidden relative px-2 sm:px-0">
                {mode === 'log' && isToddler && (
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

                {mode === 'plan' && (
                    <PlanView 
                        mealPlan={props.mealPlan}
                        onAdd={props.onAddToPlan}
                        onRemove={props.onRemoveFromPlan}
                        baseColor={baseColor}
                    />
                )}

                {mode === 'history' && isToddler && (
                    <div className="h-full overflow-y-auto pb-24">
                        <HistoryView 
                            triedFoods={props.triedFoods || []} 
                            baseColor={baseColor} 
                            onAddToPlan={handlePlanItems}
                            onEditLog={handleEditLog}
                        />
                    </div>
                )}

                {mode === 'recipes' && (
                    <div className="h-full overflow-y-auto pb-24 space-y-4">
                        <div className="bg-gradient-to-r from-indigo-50 to-white p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                             <div><h3 className="font-bold text-indigo-900">Your Recipe Box</h3><p className="text-xs text-indigo-700">{props.recipes.length} recipes saved</p></div>
                             <button onClick={props.onShowAddRecipe} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700">+ New</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={props.onShowSuggestRecipe} className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 font-bold text-xs flex flex-col items-center gap-2 hover:bg-purple-100 transition-colors"><Icon name="sparkles" className="w-6 h-6" /> AI Chef</button>
                            <button onClick={props.onShowImportRecipe} className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 font-bold text-xs flex flex-col items-center gap-2 hover:bg-blue-100 transition-colors"><Icon name="camera" className="w-6 h-6" /> Scan Recipe</button>
                        </div>
                        {props.recipes.length === 0 ? (
                            <div className="text-center py-10"><Icon name="book-dashed" className="w-12 h-12 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">No recipes yet.</p></div>
                        ) : (
                            <div className="space-y-3">
                                {props.recipes.map(recipe => (
                                    <div key={recipe.id} onClick={() => props.onViewRecipe(recipe)} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center cursor-pointer hover:border-indigo-300 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">📜</div>
                                            <div><h4 className="font-bold text-sm text-gray-800">{recipe.title}</h4><p className="text-[10px] text-gray-500">{recipe.ingredients.split('\n').length} ingredients</p></div>
                                        </div>
                                        <Icon name="chevron-right" className="w-4 h-4 text-gray-300" />
                                    </div>
                                ))}
                            </div>
                        )}
                         <button onClick={props.onShowShoppingList} className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2"><Icon name="shopping-cart" className="w-4 h-4" /> View Shopping List</button>
                    </div>
                )}
            </div>

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