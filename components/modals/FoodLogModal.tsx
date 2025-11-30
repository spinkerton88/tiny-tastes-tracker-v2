
import React, { useState, useRef } from 'react';
import { Food, TriedFoodLog, FoodLogData } from '../../types';
import { FOOD_NUTRIENT_MAPPING, NUTRIENT_STYLES } from '../../constants';
import { resizeImage } from '../../utils';
import Icon from '../ui/Icon';

interface FoodLogModalProps {
  food: Food;
  existingLog?: TriedFoodLog;
  onClose: () => void;
  onSave: (foodName: string, data: FoodLogData) => void;
  onShowGuide: (food: Food) => void;
  onIncrementTry: (foodName: string) => void;
  baseColor?: string;
}

const reactionButtons = [
    { value: 1, emoji: '😩', text: 'Hated it' },
    { value: 3, emoji: '😒', text: 'Meh' },
    { value: 5, emoji: '😋', text: 'Liked it' },
    { value: 7, emoji: '😍', text: 'Loved it!' }
];

const allergyButtons = ['none', 'hives', 'vomiting', 'swelling', 'gas', 'other'];
const mealButtons = ['breakfast', 'lunch', 'dinner', 'snack'];
const biteButtons = [{ value: 'no', text: 'Just a taste', icon: 'minus-circle'}, { value: 'yes', text: 'More than 1 bite', icon: 'plus-circle' }];

const getReactionDisplay = (reactionValue: number) => {
    if (reactionValue <= 2) return { emoji: '😩', text: 'Hated it' };
    if (reactionValue <= 4) return { emoji: '😒', text: 'Meh' };
    if (reactionValue >= 7) return { emoji: '😍', text: 'Loved it!' };
    return { emoji: '😋', text: 'Liked it' };
};

// --- Sub-components defined OUTSIDE the main component to prevent re-mounting bugs ---

const LogFormView: React.FC<{
    food: Food;
    existingLog?: TriedFoodLog;
    onSave: (foodName: string, data: FoodLogData) => void;
    onClose: () => void;
    baseColor: string;
}> = ({ food, existingLog, onSave, onClose, baseColor }) => {
    const [meal, setMeal] = useState(existingLog?.meal || '');
    const [reaction, setReaction] = useState(existingLog?.reaction || 0);
    const [allergy, setAllergy] = useState(existingLog?.allergyReaction || '');
    const [date, setDate] = useState(existingLog?.date || new Date().toISOString().split('T')[0]);
    const [bite, setBite] = useState(existingLog ? (existingLog.moreThanOneBite ? 'yes' : 'no') : '');
    const [notes, setNotes] = useState(existingLog?.notes || '');
    const [tryCount, setTryCount] = useState(existingLog?.tryCount || 1);
    const [photo, setPhoto] = useState<string | undefined>(existingLog?.messyFaceImage);
    const [processingPhoto, setProcessingPhoto] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const hasAdverseReaction = allergy && allergy !== 'none';

    const handleBiteSelection = (value: string) => {
        if (existingLog) {
            if (value === 'yes' && bite !== 'yes') {
                setTryCount(prev => prev + 1);
            } else if (value === 'no' && bite === 'yes') {
                setTryCount(prev => Math.max(1, prev - 1));
            }
        }
        setBite(value);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProcessingPhoto(true);
        try {
            // Resize to save space in LocalStorage (max 300px width)
            const base64 = await resizeImage(file, 300);
            setPhoto(base64);
        } catch (err) {
            console.error(err);
            alert("Failed to process image. Try a smaller file.");
        } finally {
            setProcessingPhoto(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!meal || !reaction || !allergy || !bite) {
            alert("Please fill out all required fields.");
            return;
        }
        onSave(food.name, {
            meal,
            reaction,
            allergyReaction: allergy,
            date,
            moreThanOneBite: bite === 'yes',
            notes,
            tryCount,
            messyFaceImage: photo
        });
    };

    return (
        <form onSubmit={handleSubmit} className="modal-scroll-content p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">1. Meal</label>
                <div className="grid grid-cols-4 gap-2">
                    {mealButtons.map(m => <button key={m} type="button" onClick={() => setMeal(m)} className={`text-sm p-2 border border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 ${meal === m ? `bg-${baseColor}-50 border-${baseColor}-500 text-${baseColor}-600` : ''}`}>{m.charAt(0).toUpperCase() + m.slice(1)}</button>)}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">2. How did baby react?</label>
                <div className="grid grid-cols-4 gap-2">
                    {reactionButtons.map(r => <button key={r.value} type="button" onClick={() => setReaction(r.value)} className={`text-lg p-2 border border-gray-300 rounded-lg flex flex-col items-center text-gray-600 hover:border-gray-400 ${reaction === r.value ? `bg-${baseColor}-50 border-${baseColor}-500 text-${baseColor}-600` : ''}`}><span>{r.emoji}</span><span className="text-xs mt-1">{r.text}</span></button>)}
                </div>
            </div>
            <div className={`rounded-lg transition-all duration-300 ${hasAdverseReaction ? 'p-3 bg-red-50 border border-red-200 -mx-3' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                    <label className={`block text-sm font-medium ${hasAdverseReaction ? 'text-red-800' : 'text-gray-700'}`}>3. Any sign of reaction?</label>
                        {hasAdverseReaction && (
                        <div className="flex items-center text-red-600 text-xs font-bold animate-pulse">
                            <Icon name="alert-triangle" className="w-4 h-4 mr-1" />
                            <span>Attention Needed</span>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {allergyButtons.map(a => {
                        const isSelected = allergy === a;
                        let btnClasses = "capitalize text-sm p-2 border border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors";
                        
                        if (isSelected) {
                            if (a !== 'none') {
                                btnClasses = "capitalize text-sm p-2 border border-red-500 bg-red-100 text-red-800 font-medium rounded-lg shadow-sm";
                            } else {
                                btnClasses = `capitalize text-sm p-2 border rounded-lg bg-${baseColor}-50 border-${baseColor}-500 text-${baseColor}-600`;
                            }
                        }
                        
                        return (
                            <button key={a} type="button" onClick={() => setAllergy(a)} className={btnClasses}>
                                {a === 'gas' ? 'Gas/Fussy' : a}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div>
                <label htmlFor="feeding-date" className="block text-sm font-medium text-gray-700">4. Date of feeding:</label>
                <input type="date" id="feeding-date" value={date} onChange={e => setDate(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-${baseColor}-500 focus:ring-${baseColor}-500 sm:text-sm`} required disabled={!!existingLog} />
            </div>
            <div>
                <legend className="text-sm font-medium text-gray-700">5. How much did baby eat?</legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                    {biteButtons.map(b => <button key={b.value} type="button" onClick={() => handleBiteSelection(b.value)} className={`p-3 border border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-600 hover:border-gray-400 ${bite === b.value ? `bg-${baseColor}-50 border-${baseColor}-500 text-${baseColor}-600` : ''}`}><Icon name={b.icon} className="w-5 h-5" /><span className="text-sm font-medium">{b.text}</span></button>)}
                </div>
            </div>
            
            {/* Messy Face Photo Input */}
            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                     <Icon name="camera" className={`w-4 h-4 text-${baseColor}-600`} /> "Messy Face" Photo (Optional)
                 </label>
                 <div className="flex items-center gap-4">
                     {photo ? (
                         <div className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-300">
                             <img src={photo} alt="Messy face" className="w-full h-full object-cover" />
                             <button 
                                type="button" 
                                onClick={() => setPhoto(undefined)}
                                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md"
                             >
                                 <Icon name="x" className="w-3 h-3" />
                             </button>
                         </div>
                     ) : (
                         <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={processingPhoto}
                            className="w-20 h-20 bg-gray-50 border border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                         >
                             {processingPhoto ? <div className="spinner w-4 h-4"></div> : <Icon name="plus" />}
                         </button>
                     )}
                     <div className="flex-1">
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            accept="image/*" 
                            capture="user" 
                            onChange={handlePhotoUpload} 
                            className="hidden" 
                         />
                         <p className="text-xs text-gray-500">Capture that funny first reaction! stored locally on this device.</p>
                     </div>
                 </div>
            </div>

            <div>
                <label htmlFor="notes-input" className="block text-sm font-medium text-gray-700">7. Notes (Optional):</label>
                <textarea id="notes-input" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-${baseColor}-500 focus:ring-${baseColor}-500 sm:text-sm`} placeholder="e.g., Gagged a lot at first..."></textarea>
            </div>

            {existingLog && (
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <label htmlFor="try-count-input" className="block text-sm font-medium text-gray-700">Total Times Tried</label>
                    <div className="mt-2 flex items-center">
                            <button type="button" onClick={() => setTryCount(Math.max(1, tryCount - 1))} className="p-2 border border-gray-300 rounded-l-md bg-white text-gray-600 hover:bg-gray-50">
                            <Icon name="minus" className="h-4 w-4" />
                            </button>
                        <input 
                            type="number" 
                            id="try-count-input" 
                            value={tryCount} 
                            onChange={e => setTryCount(Math.max(1, parseInt(e.target.value) || 1))} 
                            className={`w-20 text-center border-t border-b border-gray-300 py-1.5 text-sm focus:ring-${baseColor}-500 focus:border-${baseColor}-500`} 
                        />
                            <button type="button" onClick={() => setTryCount(tryCount + 1)} className="p-2 border border-gray-300 rounded-r-md bg-white text-gray-600 hover:bg-gray-50">
                            <Icon name="plus" className="h-4 w-4" />
                            </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Correct the count if you missed logging some tries.</p>
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t sticky bottom-0 bg-white py-4">
                <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className={`inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${baseColor}-600 hover:bg-${baseColor}-700`}>Save</button>
            </div>
        </form>
    );
};

const LogSummaryView: React.FC<{
    existingLog: TriedFoodLog;
    onIncrement: () => void;
    onEdit: () => void;
    baseColor: string;
}> = ({ existingLog, onIncrement, onEdit, baseColor }) => {
    const reactionDisplay = getReactionDisplay(existingLog.reaction);
    
    return (
        <div className="p-6 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-600">First tried on: <span className="font-medium text-gray-800">{existingLog.date}</span></p>
                <p className="text-sm text-gray-600">Reaction: <span className="font-medium text-gray-800">{reactionDisplay.emoji} {reactionDisplay.text}</span></p>
                {existingLog.notes && <p className="text-sm text-gray-600 mt-2">Notes: <span className="italic">"{existingLog.notes}"</span></p>}
            </div>

            {existingLog.messyFaceImage && (
                <div className="flex justify-center">
                    <img src={existingLog.messyFaceImage} alt="Messy Face" className="h-32 rounded-lg border border-gray-200 shadow-sm" />
                </div>
            )}

            <div className="text-center">
                <p className="text-lg font-medium text-gray-700">Total Times Tried: <span className={`font-bold text-${baseColor}-600`}>{existingLog.tryCount || 1}</span></p>
            </div>

            <button onClick={onIncrement} className={`w-full inline-flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${baseColor}-600 hover:bg-${baseColor}-700`}>
                <Icon name="plus" className="w-5 h-5"/> +1 Mark as Tried Again
            </button>

            <div className="text-center">
                <button onClick={onEdit} className="text-sm text-gray-500 hover:underline">
                    Edit Initial Log
                </button>
            </div>
        </div>
    );
};

// --- Main Component ---

const FoodLogModal: React.FC<FoodLogModalProps> = ({ food, existingLog, onClose, onSave, onShowGuide, onIncrementTry, baseColor = 'teal' }) => {
    const [isEditing, setIsEditing] = useState(!existingLog);
    const nutrients = FOOD_NUTRIENT_MAPPING[food.name] || [];

    const handleIncrement = () => {
        onIncrementTry(food.name);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
                <div className="flex justify-between items-center border-b p-4">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-semibold">Log Food: <span className={`text-${baseColor}-600`}>{food.emoji} {food.name}</span></h2>
                         {/* Render Nutrient Badges Here */}
                         {nutrients.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {nutrients.map(n => {
                                    const style = NUTRIENT_STYLES[n] || { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200", icon: "star", label: n };
                                    return (
                                        <span key={n} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}>
                                            {style.label}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div>
                        <button onClick={() => onShowGuide(food)} type="button" className={`text-sm text-${baseColor}-600 font-medium inline-flex items-center gap-1 hover:text-${baseColor}-700`}>
                            <Icon name="help-circle" className="w-4 h-4" /> How to Serve
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-3"><Icon name="x" /></button>
                    </div>
                </div>
                
                {isEditing || !existingLog ? (
                    <LogFormView 
                        food={food} 
                        existingLog={existingLog} 
                        onSave={onSave} 
                        onClose={onClose}
                        baseColor={baseColor}
                    />
                ) : (
                    <LogSummaryView 
                        existingLog={existingLog} 
                        onIncrement={handleIncrement} 
                        onEdit={() => setIsEditing(true)} 
                        baseColor={baseColor}
                    />
                )}
            </div>
        </div>
    );
};

export default FoodLogModal;
