
import React, { useState, useMemo } from 'react';
import { Recipe, RecipeFilter } from '../../types';
import { flatFoodList, allFoods } from '../../constants';
import Icon from '../ui/Icon';

interface LogMealModalProps {
    recipes: Recipe[];
    onClose: () => void;
    // Updated onSave to handle granular data if needed, or just notes
    onSave: (foodNames: string[], date: string, meal: string, photo?: string, notes?: string, foodStatuses?: Record<string, string>) => void;
    onCreateRecipe?: (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'rating'>) => void;
    baseColor?: string;
}

type Step = 'SELECT' | 'REVIEW';
type FoodStatus = 'eaten' | 'touched' | 'refused';

const STATUS_CONFIG = {
    eaten: { color: 'bg-green-100 text-green-800 border-green-200', icon: 'check', label: 'Ate' },
    touched: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: 'hand', label: 'Played' },
    refused: { color: 'bg-red-100 text-red-800 border-red-200', icon: 'x', label: 'Refused' }
};

const LogMealModal: React.FC<LogMealModalProps> = ({ recipes, onClose, onSave, onCreateRecipe, baseColor = 'teal' }) => {
    const [step, setStep] = useState<Step>('SELECT');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [meal, setMeal] = useState<RecipeFilter>('lunch');
    
    // Selection
    const [activeTab, setActiveTab] = useState<'foods' | 'recipes'>('foods');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFoods, setSelectedFoods] = useState<Set<string>>(new Set());
    
    // Review Data
    const [foodStatuses, setFoodStatuses] = useState<Record<string, FoodStatus>>({});
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
            // Cleanup status
            const newStatuses = { ...foodStatuses };
            delete newStatuses[food];
            setFoodStatuses(newStatuses);
        } else {
            newSet.add(food);
            // Default status
            setFoodStatuses(prev => ({ ...prev, [food]: 'eaten' }));
        }
        setSelectedFoods(newSet);
    };

    const toggleStatus = (food: string) => {
        const current = foodStatuses[food] || 'eaten';
        let next: FoodStatus = 'eaten';
        if (current === 'eaten') next = 'touched';
        else if (current === 'touched') next = 'refused';
        else next = 'eaten'; // Cycle back

        setFoodStatuses(prev => ({ ...prev, [food]: next }));
    };

    const handleAddRecipeToTray = (recipe: Recipe) => {
        const ingredients = recipe.ingredients.split('\n').map(i => i.replace('-', '').trim());
        const newSet = new Set(selectedFoods);
        const newStatuses = { ...foodStatuses };

        (flatFoodList as string[]).forEach(food => {
            const foodLower = food.toLowerCase();
            if (ingredients.some(i => i.toLowerCase().includes(foodLower))) {
                newSet.add(food);
                newStatuses[food] = 'eaten';
            }
        });
        
        setSelectedFoods(newSet);
        setFoodStatuses(newStatuses);
        setActiveTab('foods');
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
        const foodsList = Array.from(selectedFoods);

        if (saveAsPreset && onCreateRecipe && presetName) {
            onCreateRecipe({
                title: presetName,
                ingredients: foodsList.join('\n'),
                instructions: 'Quick Log Preset',
                tags: ['Toddler Meal', meal],
                mealTypes: [meal]
            });
        }

        // Generate a smart note based on statuses if user didn't write one
        let finalNotes = notes;
        const refused = foodsList.filter(f => foodStatuses[f] === 'refused');
        const touched = foodsList.filter(f => foodStatuses[f] === 'touched');
        
        if (!finalNotes && (refused.length > 0 || touched.length > 0)) {
            const parts = [];
            if (refused.length) parts.push(`Refused: ${refused.join(', ')}`);
            if (touched.length) parts.push(`Played with: ${touched.join(', ')}`);
            finalNotes = parts.join('. ');
        }

        onSave(foodsList, date, meal, platePhoto || undefined, finalNotes, foodStatuses);
        onClose();
    };

    // Helper to get emoji
    const getFoodEmoji = (name: string) => {
        const obj = allFoods.flatMap(c => c.items).find(f => f.name === name);
        return obj?.emoji || '🍽️';
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[500]">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center border-b p-4 bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {step === 'SELECT' ? 'Build Plate' : 'Review Meal'}
                        </h2>
                        <p className="text-xs text-gray-500">
                            {step === 'SELECT' ? 'Select foods' : 'Tap foods to change status'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2"><Icon name="x" /></button>
                </div>

                {/* --- STEP 1: SELECT --- */}
                {step === 'SELECT' && (
                    <>
                        <div className="p-3 border-b bg-white flex gap-2">
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1 text-sm border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
                            <select value={meal} onChange={e => setMeal(e.target.value as any)} className="flex-1 text-sm border-gray-300 rounded-md capitalize focus:ring-teal-500 focus:border-teal-500">
                                {['breakfast', 'lunch', 'dinner', 'snack'].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <div className="flex border-b">
                            <button onClick={() => setActiveTab('foods')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'foods' ? `text-${baseColor}-600 border-b-2 border-${baseColor}-600 bg-teal-50/50` : 'text-gray-500'}`}>Foods</button>
                            <button onClick={() => setActiveTab('recipes')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'recipes' ? `text-${baseColor}-600 border-b-2 border-${baseColor}-600 bg-teal-50/50` : 'text-gray-500'}`}>Presets</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-white">
                            {activeTab === 'foods' ? (
                                <>
                                    <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full mb-4 rounded-lg border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500" />
                                    <div className="grid grid-cols-2 gap-2">
                                        {filteredFoods.map(food => {
                                            const isSelected = selectedFoods.has(food);
                                            return (
                                                <button key={food} onClick={() => toggleFood(food)} className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${isSelected ? `bg-${baseColor}-50 border-${baseColor}-500 ring-1 ring-${baseColor}-500` : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                                                    <span className="text-xl">{getFoodEmoji(food)}</span>
                                                    <span className={`text-sm font-medium truncate ${isSelected ? 'text-teal-900' : 'text-gray-700'}`}>{food}</span>
                                                    {isSelected && <Icon name="check-circle" className={`ml-auto w-4 h-4 text-${baseColor}-600`} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-3">
                                    {recipes.map(recipe => (
                                        <button key={recipe.id} onClick={() => handleAddRecipeToTray(recipe)} className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-all flex justify-between items-center">
                                            <div><h4 className="font-bold text-gray-800">{recipe.title}</h4><p className="text-xs text-gray-500 mt-1 line-clamp-1">{recipe.ingredients}</p></div>
                                            <Icon name="plus" className="w-4 h-4 text-teal-600" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* STICKY VISUAL TRAY */}
                        <div className="border-t bg-white p-4 shadow-lg z-10">
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar h-12 items-center">
                                {selectedFoods.size === 0 ? <span className="text-sm text-gray-400 italic">Plate is empty...</span> : 
                                    Array.from(selectedFoods).map(food => (
                                        <button key={food} onClick={() => toggleFood(food)} className="relative shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 shadow-sm animate-popIn">
                                            <span className="text-lg">{getFoodEmoji(food)}</span>
                                            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"><Icon name="x" className="w-2 h-2 text-white" /></div>
                                        </button>
                                    ))
                                }
                            </div>
                            <button onClick={() => setStep('REVIEW')} disabled={selectedFoods.size === 0} className={`w-full py-3 px-4 rounded-xl shadow-lg text-sm font-bold text-white transition-all flex justify-center items-center gap-2 ${selectedFoods.size > 0 ? `bg-${baseColor}-600 hover:bg-${baseColor}-700` : 'bg-gray-300 cursor-not-allowed'}`}>
                                Review & Log <Icon name="arrow-right" className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )}

                {/* --- STEP 2: REVIEW (Interactive) --- */}
                {step === 'REVIEW' && (
                    <div className="flex-1 flex flex-col bg-gray-50">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-700 mb-3">Tap to change outcome:</h3>
                                <div className="space-y-2">
                                    {Array.from(selectedFoods).map(food => {
                                        const status = foodStatuses[food];
                                        const config = STATUS_CONFIG[status];
                                        return (
                                            <button key={food} onClick={() => toggleStatus(food)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${config.color}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{getFoodEmoji(food)}</span>
                                                    <span className="font-medium">{food}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                                    {config.label} <Icon name={config.icon} className="w-4 h-4" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Plate Photo */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Icon name="camera" className="w-4 h-4" /> Meal Photo
                                </h3>
                                {platePhoto ? (
                                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                                        <img src={platePhoto} alt="Meal" className="w-full h-full object-cover" />
                                        <button onClick={() => setPlatePhoto(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"><Icon name="x" className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <Icon name="camera" className="w-8 h-8 text-gray-300 mb-2" />
                                        <span className="text-xs text-gray-500">Tap to snap a picture of the plate</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    </label>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-1 block">Notes / Reaction</label>
                                <textarea 
                                    className="w-full rounded-lg border-gray-300 text-sm focus:ring-teal-500 focus:border-teal-500"
                                    rows={2}
                                    placeholder="Did they eat it? Throw it?"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>

                            {/* Preset Saver */}
                            {onCreateRecipe && (
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="checkbox" id="savePreset" checked={saveAsPreset} onChange={e => setSaveAsPreset(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                        <label htmlFor="savePreset" className="text-sm font-bold text-indigo-900">Save as Preset?</label>
                                    </div>
                                    {saveAsPreset && (
                                        <input type="text" placeholder="e.g. Monday Pasta" value={presetName} onChange={e => setPresetName(e.target.value)} className="w-full mt-2 rounded-lg border-indigo-200 text-sm focus:ring-indigo-500 focus:border-indigo-500" autoFocus />
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white border-t flex gap-3">
                            <button onClick={() => setStep('SELECT')} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Back</button>
                            <button onClick={handleFinalSave} className={`flex-[2] py-3 text-sm font-bold text-white bg-${baseColor}-600 rounded-xl shadow-lg hover:bg-${baseColor}-700 flex justify-center items-center gap-2`}>
                                <Icon name="check" className="w-5 h-5" /> Save Log
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogMealModal;
