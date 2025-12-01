
import React, { useState, useEffect } from 'react';
import { CustomFood, CustomFoodDetails, ScannedProductData } from '../../types';
import { analyzeFoodWithGemini, analyzePackagedProduct } from '../../services/geminiService';
import { logMissingFoodToCloud } from '../../services/telemetryService';
import Icon from '../ui/Icon';

interface CustomFoodModalProps {
    initialName?: string;
    scannedData?: ScannedProductData;
    onClose: () => void;
    onSave: (food: CustomFood) => void;
}

const CATEGORIES = ["Vegetables", "Fruits", "Grains", "Protein", "Dairy", "Snacks"];

const CustomFoodModal: React.FC<CustomFoodModalProps> = ({ initialName = '', scannedData, onClose, onSave }) => {
    const [name, setName] = useState(initialName);
    const [loading, setLoading] = useState(false);
    const [analyzedData, setAnalyzedData] = useState<(CustomFoodDetails & { emoji: string, category: string }) | null>(null);
    const [customEmoji, setCustomEmoji] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Auto-analyze if scanned data is provided
    useEffect(() => {
        if (scannedData) {
            const formattedName = scannedData.brand 
                ? `${scannedData.brand} ${scannedData.name}` 
                : scannedData.name;
            
            setName(formattedName);
            handleScannedAnalysis(formattedName, scannedData.ingredientsText);
        }
    }, [scannedData]);

    const handleScannedAnalysis = async (productName: string, ingredients: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyzePackagedProduct(productName, ingredients);
            setAnalyzedData(result);
            setCustomEmoji(result.emoji);
            setCustomCategory(result.category || 'Snacks');
        } catch (err) {
            setError("Could not analyze this product. Please check your internet connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!name.trim()) return;
        setLoading(true);
        setError(null);
        
        try {
            const result = await analyzeFoodWithGemini(name);
            setAnalyzedData(result);
            setCustomEmoji(result.emoji);
            setCustomCategory(result.category || 'Snacks');
        } catch (err) {
            setError("Could not analyze food. Please try again or check your internet.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (!analyzedData || !name.trim()) return;

        const newFood: CustomFood = {
            name: name.trim().toUpperCase(),
            emoji: customEmoji || analyzedData.emoji,
            isCustom: true,
            details: {
                safety_rating: analyzedData.safety_rating,
                allergen_info: analyzedData.allergen_info,
                texture_recommendation: analyzedData.texture_recommendation,
                nutrition_highlight: analyzedData.nutrition_highlight
            },
            image: scannedData?.image,
            category: customCategory
        };

        // Trigger Telemetry (Fire-and-forget)
        logMissingFoodToCloud(newFood.name, name.trim());

        onSave(newFood);
    };

    const getSafetyColor = (rating: string) => {
        switch (rating) {
            case 'Safe': return 'bg-green-100 text-green-800 border-green-200';
            case 'Use Caution': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Avoid': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-90 flex items-center justify-center p-4 z-[502]">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center border-b p-4 bg-gradient-to-r from-teal-50 to-white">
                    <h2 className="text-xl font-bold text-teal-900 flex items-center gap-2">
                        {scannedData ? <Icon name="scan-barcode" className="w-6 h-6 text-teal-600" /> : <Icon name="plus-circle" className="w-6 h-6 text-teal-600" />}
                        {scannedData ? 'Add Scanned Food' : 'Add Custom Food'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><Icon name="x" /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {/* Show scanned image if available */}
                    {scannedData?.image && !analyzedData && (
                        <div className="flex justify-center mb-6">
                            <div className="w-32 h-32 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                <img src={scannedData.image} alt="Scanned product" className="w-full h-full object-contain" />
                            </div>
                        </div>
                    )}

                    {!analyzedData ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Food Name</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)} 
                                        onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                        placeholder="e.g., Dragonfruit"
                                        autoFocus={!scannedData}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {scannedData 
                                        ? "Review the product name. AI is analyzing safety & nutrition based on ingredients..."
                                        : "We'll use AI to analyze safety and nutrition for this food."
                                    }
                                </p>
                            </div>

                            {loading && (
                                <div className="flex flex-col items-center py-6 text-gray-500 gap-3">
                                    <div className="spinner w-8 h-8 border-teal-500"></div>
                                    <span className="text-sm font-medium animate-pulse">Analyzing ingredients...</span>
                                </div>
                            )}

                            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

                            {!loading && !scannedData && (
                                <button 
                                    onClick={handleAnalyze} 
                                    disabled={!name.trim()}
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <Icon name="wand-2" className="w-4 h-4" /> Analyze with AI
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-5 animate-fadeIn">
                            <div className="flex flex-col items-center">
                                {/* Combine scanned image or emoji */}
                                {scannedData?.image ? (
                                    <div className="relative mb-4">
                                        <img src={scannedData.image} alt={name} className="w-24 h-24 object-contain rounded-md border border-gray-200" />
                                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full border shadow-sm p-1 text-xl">
                                            {customEmoji}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <input 
                                            type="text" 
                                            value={customEmoji} 
                                            onChange={(e) => setCustomEmoji(e.target.value)}
                                            className="text-6xl text-center border-none focus:ring-0 bg-transparent w-32 p-0 cursor-pointer hover:scale-110 transition-transform bg-gray-50 rounded-xl"
                                            maxLength={5} 
                                        />
                                        <div className="absolute -bottom-5 left-0 right-0 text-center">
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold bg-white px-2">Tap to Edit</span>
                                        </div>
                                    </div>
                                )}
                                <h3 className="text-xl font-bold text-gray-900 mt-2 text-center leading-tight">{name}</h3>
                            </div>

                            {/* Category Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Category</label>
                                <select 
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm py-2"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Safety Card */}
                            <div className={`p-4 rounded-lg border text-center ${getSafetyColor(analyzedData.safety_rating)}`}>
                                <p className="text-xs uppercase tracking-wider font-bold mb-1">Safety Rating</p>
                                <p className="text-xl font-black">{analyzedData.safety_rating}</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <Icon name="alert-circle" className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Allergen Info</p>
                                        <p className="text-sm text-gray-800">{analyzedData.allergen_info}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <Icon name="utensils" className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">How to Serve</p>
                                        <p className="text-sm text-gray-800">{analyzedData.texture_recommendation}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <Icon name="heart" className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Nutrition Highlight</p>
                                        <p className="text-sm text-gray-800">{analyzedData.nutrition_highlight}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 text-xs text-yellow-800 flex gap-2">
                                <Icon name="info" className="w-4 h-4 flex-shrink-0" />
                                <p><strong>Disclaimer:</strong> This info is generated by AI based on the product ingredients. Always verify with your pediatrician.</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setAnalyzedData(null)} className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Back</button>
                                <button onClick={handleSave} className="flex-1 py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 font-bold shadow-sm">Save & Add</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomFoodModal;
