
import React, { useState, useEffect } from 'react';
import { getFlavorPairingSuggestions } from '../../services/geminiService';
import { TriedFoodLog } from '../../types';
import Icon from '../ui/Icon';

interface FlavorPairingModalProps {
  triedFoods: TriedFoodLog[];
  onClose: () => void;
}

interface Pairing {
  title: string;
  description: string;
  ingredients: string[];
}

const FlavorPairingModal: React.FC<FlavorPairingModalProps> = ({ triedFoods, onClose }) => {
    const [pairings, setPairings] = useState<Pairing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPairings = async () => {
            setLoading(true);
            setError(null);
            try {
                // Filter to get a list of food names that have a positive reaction (>3)
                const likedFoods = triedFoods
                    .filter(f => f.reaction >= 4)
                    .map(f => f.id);
                
                const result = await getFlavorPairingSuggestions(likedFoods);
                if (result && result.pairings) {
                    setPairings(result.pairings);
                } else {
                    setError("Couldn't generate pairings right now.");
                }
            } catch (err) {
                setError("Failed to connect to Sage. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchPairings();
    }, [triedFoods]);

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[500]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto h-[80vh] flex flex-col">
                <div className="flex justify-between items-center border-b p-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-violet-100 rounded-full">
                             <Icon name="sparkles" className="w-5 h-5 text-violet-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Sage's Flavor Pairings</h2>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                    {loading && (
                        <div className="text-center p-8">
                            <div className="spinner mx-auto mb-4"></div>
                            <p className="text-gray-600 font-medium">Sage is brainstorming delicious combinations...</p>
                            <p className="text-xs text-gray-400 mt-2">Checking your tried foods list</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center p-8 bg-white rounded-lg border border-red-100">
                             <Icon name="frown" className="w-10 h-10 text-red-300 mx-auto mb-3" />
                             <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    {!loading && !error && pairings.length === 0 && (
                        <div className="text-center p-8">
                            <p className="text-gray-500">Log a few more foods (that baby likes!) to get better suggestions.</p>
                        </div>
                    )}

                    {!loading && !error && pairings.map((pairing, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 transition-transform hover:scale-[1.01]">
                            <h3 className="text-lg font-bold text-teal-700 mb-2">{pairing.title}</h3>
                            <p className="text-sm text-gray-600 italic mb-4">"{pairing.description}"</p>
                            
                            <div className="bg-teal-50 rounded-lg p-3">
                                <p className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2">Ingredients</p>
                                <div className="flex flex-wrap gap-2">
                                    {pairing.ingredients.map((ing, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-white border border-teal-200 rounded-full text-xs font-medium text-teal-700 shadow-sm">
                                            {ing}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="p-4 border-t bg-white text-center text-xs text-gray-400">
                    AI suggestions. Always ensure texture is age-appropriate.
                </div>
            </div>
        </div>
    );
};

export default FlavorPairingModal;
