import React, { useState, useMemo } from 'react';
import { Recipe, RecipeFilter } from '../../types';
import { flatFoodList, allFoods } from '../../constants';
import Icon from '../ui/Icon';

interface LogMealModalProps {
    recipes: Recipe[];
    onClose: () => void;
    onSave: (foodNames: string[], date: string, meal: string, photo?: string, notes?: string) => void;
    onCreateRecipe?: (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'rating'>) => void;
    baseColor?: string;
}

// Steps for the wizard flow
type Step = 'SELECT' | 'REVIEW';

const LogMealModal: React.FC<LogMealModalProps> = ({ recipes, onClose, onSave, onCreateRecipe, baseColor = 'teal' }) => {
    const [step, setStep] = useState<Step>('SELECT');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [meal, setMeal] = useState<RecipeFilter>('lunch');
    
    // Selection State
    const [activeTab, setActiveTab] = useState<'foods' | 'recipes'>('foods');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFoods, setSelectedFoods] = useState<Set<string>>(new Set());
    
    // Review State
    const [platePhoto, setPlatePhoto] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [saveAsPreset, setSaveAsPreset] = useState(false);
    const [presetName, setPresetName] = useState('');

    const filteredFoods = useMemo(() => {
        return flatFoodList.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery]);

    const toggleFood = (food: string) => {
        const newSet = new Set(selectedFoods);
        if (newSet.has(food)) newSet.delete(food);
        else newSet.add(food);
        setSelectedFoods(newSet);
    };

    const handleAddRecipeToTray = (recipe: Recipe) => {
        // Parse ingredients from recipe string to add to tray
        // This is a simple heuristic; might need robust parsing in production
        const ingredients = recipe.ingredients.split('\n').map(i => i.replace('-', '').trim());
        const newSet = new Set(selectedFoods);
        
        flatFoodList.forEach(food => {
            const foodLower = food.toLowerCase();
            if (ingredients.some(i => i.toLowerCase().includes(foodLower))) {
                newSet.add(food);
            }
        });
        
        setSelectedFoods(newSet);
        setActiveTab('foods'); // Switch back to food view to show added items
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

        // 1. Create Preset if requested
        if (saveAsPreset && onCreateRecipe && presetName) {
            onCreateRecipe({
                title: presetName,
                ingredients: foodsList.join('\n'), // Simple list
                instructions: 'Quick Log Preset',
                tags: ['Toddler Meal', meal],
                mealTypes: [meal]
            });
        }

        // 2. Save the Log
        // Note: You might need to update your onSave signature in the parent to accept photo/notes 
        // OR handle saving individual logs here. 
        // For now, we assume the parent handles the batching.
        onSave(foodsList, date, meal, platePhoto || undefined, notes);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[500]">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center border-b p-4 bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {step === 'SELECT' ? 'Build Your Plate' : 'Review Meal'}
                        </h2>
                        <p className="text-xs text-gray-500">
                            {step === 'SELECT' ? 'Select everything on the tray' : 'Add details and save'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2"><Icon name="x" /></button>
                </div>

                {/* --- STEP 1: SELECT FOODS --- */}
                {step === 'SELECT' && (
                    <>
                        <div className="p-3 border-b bg-white flex gap-2">
                            <div className="flex-1">
                                <input 
                                    type="date" 
                                    value={date} 
                                    onChange={(e) => setDate(e.target.value)} 
                                    className="w-full text-sm border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div className="flex-1">
                                <select 
                                    value={meal} 
                                    onChange={(e) => setMeal(e.target.value as RecipeFilter)}
                                    className="w-full text-sm border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 capitalize"
                                >
                                    {['breakfast', 'lunch', 'dinner', 'snack'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b">
                            <button 
                                onClick={() => setActiveTab('foods')}
                                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'foods' ? `text-${baseColor}-600 border-b-2 border-${baseColor}-600 bg-teal-50/50` : 'text-gray-500'}`}
                            >
                                Individual Foods
                            </button>
                            <button 
                                onClick={() => setActiveTab('recipes')}
                                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'recipes' ? `text-${baseColor}-600 border-b-2 border-${baseColor}-600 bg-teal-50/50` : 'text-gray-500'}`}
                            >
                                Presets / Recipes
                            </button>
                        </div>

                        {/* Selection Content */}
                        <div className="flex-1 overflow-y-auto p-4 bg-white">
                            {activeTab === 'foods' ? (
                                <>
                                    <input 
                                        type="text" 
                                        placeholder="Search (e.g. Avocado)..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full mb-4 rounded-lg border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        {filteredFoods.map(food => {
                                            const isSelected = selectedFoods.has(food);
                                            const foodObj = allFoods.flatMap(c => c.items).find(f => f.name === food);
                                            return (
                                                <button 
                                                    key={food} 
                                                    onClick={() => toggleFood(food)}
                                                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${isSelected ? `bg-${baseColor}-50 border-${baseColor}-500 ring-1 ring-${baseColor}-500` : 'bg-white border-gray-100 hover:border-gray-300'}`}
                                                >
                                                    <span className="text-xl">{foodObj?.emoji || '🍽️'}</span>
                                                    <span className={`text-sm font-medium truncate ${isSelected ? 'text-teal-900' : 'text-gray-700'}`}>{food}</span>
                                                    {isSelected && <Icon name="check-circle" className={`ml-auto w-4 h-4 text-${baseColor}-600`} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-500 mb-2">Tap a preset to add its ingredients to your tray.</p>
                                    {recipes.map(recipe => (
                                        <button 
                                            key={recipe.id} 
                                            onClick={() => handleAddRecipeToTray(recipe)}
                                            className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-all flex justify-between items-center"
                                        >
                                            <div>
                                                <h4 className="font-bold text-gray-800">{recipe.title}</h4>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{recipe.ingredients}</p>
                                            </div>
                                            <Icon name="plus" className="w-4 h-4 text-teal-600" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* THE TRAY (Sticky Footer) */}
                        <div className="border-t bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">On the Plate ({selectedFoods.size})</span>
                                {selectedFoods.size > 0 && (
                                    <button onClick={() => setSelectedFoods(new Set())} className="text-xs text-red-500">Clear</button>
                                )}
                            </div>
                            
                            {/* Horizontal Scroll of Selected Items */}
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
                                {selectedFoods.size === 0 ? (
                                    <span className="text-sm text-gray-400 italic">Nothing selected yet...</span>
                                ) : (
                                    Array.from(selectedFoods).map(food => (
                                        <span key={food} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 whitespace-nowrap">
                                            {food}
                                            <button onClick={() => toggleFood(food)} className="ml-1.5 hover:text-teal-900"><Icon name="x" className="w-3 h-3" /></button>
                                        </span>
                                    ))
                                )}
                            </div>

                            <button 
                                onClick={() => setStep('REVIEW')}
                                disabled={selectedFoods.size === 0}
                                className={`w-full py-3 px-4 rounded-xl shadow-lg text-sm font-bold text-white transition-all flex justify-center items-center gap-2 ${selectedFoods.size > 0 ? `bg-${baseColor}-600 hover:bg-${baseColor}-700` : 'bg-gray-300 cursor-not-allowed'}`}
                            >
                                Next: Review Meal <Icon name="arrow-right" className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )}

                {/* --- STEP 2: REVIEW --- */}
                {step === 'REVIEW' && (
                    <div className="flex-1 flex flex-col bg-gray-50">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            
                            {/* Selected List Summary */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Icon name="utensils" className="w-4 h-4" /> Foods on Plate
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(selectedFoods).map(food => (
                                        <span key={food} className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-700">{food}</span>
                                    ))}
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
                                    className="w-full rounded-lg border-gray-300 text-sm focus:ring-teal-500"
                                    rows={2}
                                    placeholder="Did they eat it? Throw it?"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>

                            {/* Save as Preset Toggle */}
                            {onCreateRecipe && (
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <input 
                                            type="checkbox" 
                                            id="savePreset" 
                                            checked={saveAsPreset} 
                                            onChange={e => setSaveAsPreset(e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="savePreset" className="text-sm font-bold text-indigo-900">Save this meal as a Preset?</label>
                                    </div>
                                    {saveAsPreset && (
                                        <input 
                                            type="text" 
                                            placeholder="Preset Name (e.g. Monday Pasta)" 
                                            value={presetName}
                                            onChange={e => setPresetName(e.target.value)}
                                            className="w-full mt-2 rounded-lg border-indigo-200 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            autoFocus
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-white border-t flex gap-3">
                            <button 
                                onClick={() => setStep('SELECT')} 
                                className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleFinalSave}
                                className={`flex-[2] py-3 text-sm font-bold text-white bg-${baseColor}-600 rounded-xl shadow-lg hover:bg-${baseColor}-700 flex justify-center items-center gap-2`}
                            >
                                <Icon name="check" className="w-5 h-5" />
                                Log Meal
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogMealModal;