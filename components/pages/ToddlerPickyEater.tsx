
import React, { useState } from 'react';
import { generatePickyEaterStrategies } from '../../services/geminiService';
import { SavedStrategy, PickyEaterStrategy } from '../../types';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';

interface ToddlerPickyEaterProps {
    baseColor?: string;
    savedStrategies?: SavedStrategy[];
    onSaveStrategy?: (strategy: SavedStrategy) => void;
    onDeleteStrategy?: (id: string) => void;
    safeFoods?: string[];
    onUpdateSafeFoods?: (foods: string[]) => void;
}

export const ToddlerPickyEater: React.FC<ToddlerPickyEaterProps> = ({ 
    baseColor = 'indigo',
    savedStrategies = [],
    onSaveStrategy,
    onDeleteStrategy,
    safeFoods = [],
    onUpdateSafeFoods
}) => {
  const [activeTab, setActiveTab] = useState<'ask' | 'playbook'>('ask');
  
  // Generator State
  const [targetFood, setTargetFood] = useState('');
  const [safeFood, setSafeFood] = useState(safeFoods.length > 0 ? safeFoods[0] : '');
  const [ickFactor, setIckFactor] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to handle saving
  const handleSave = (strategy: PickyEaterStrategy) => {
      if (!onSaveStrategy) return;
      
      const newSavedStrategy: SavedStrategy = {
          ...strategy,
          id: crypto.randomUUID(),
          targetFood,
          safeFood,
          dateSaved: new Date().toISOString().split('T')[0]
      };
      
      onSaveStrategy(newSavedStrategy);
  };

  const handleAskSage = async () => {
    if (!targetFood.trim() || !safeFood.trim()) {
        setError("Please fill in both food fields.");
        return;
    }
    setLoading(true);
    setError(null);
    try {
        const strategies = await generatePickyEaterStrategies(targetFood, safeFood, ickFactor || "Not sure");
        setResult(strategies);
    } catch (err) {
        setError("Sage is having trouble thinking right now. Try again later.");
    } finally {
        setLoading(false);
    }
  };

  const toggleSafeFoodFavorite = () => {
      if (!safeFood.trim() || !onUpdateSafeFoods) return;
      const current = safeFoods || [];
      const formatted = safeFood.trim();
      
      if (current.includes(formatted)) {
          onUpdateSafeFoods(current.filter(f => f !== formatted));
      } else {
          onUpdateSafeFoods([...current, formatted]);
      }
  };

  const isCurrentSafeFoodFavorited = safeFoods.includes(safeFood.trim());

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
          <button 
              onClick={() => setActiveTab('ask')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ask' ? `border-${baseColor}-600 text-${baseColor}-600` : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Icon name="sparkles" className="w-4 h-4 inline-block mr-2 -mt-1" />
              Ask Sage
          </button>
          <button 
              onClick={() => setActiveTab('playbook')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'playbook' ? `border-${baseColor}-600 text-${baseColor}-600` : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Icon name="book-open" className="w-4 h-4 inline-block mr-2 -mt-1" />
              My Playbook
          </button>
      </div>

      {activeTab === 'ask' ? (
          <>
            {/* Hero / Input Section */}
            <div className={`bg-${baseColor}-50 border border-${baseColor}-100 p-5 rounded-xl shadow-sm`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`bg-${baseColor}-100 p-2 rounded-full`}>
                        <Icon name="chef-hat" className={`w-6 h-6 text-${baseColor}-600`} />
                    </div>
                    <h2 className={`text-lg font-bold text-${baseColor}-900`}>Picky Eater Rescue</h2>
                </div>
                <p className={`text-sm text-${baseColor}-700 mb-5 leading-relaxed`}>
                Tell Sage what they <strong className={`text-${baseColor}-900`}>refuse to eat</strong> and what they <strong className={`text-${baseColor}-900`}>love</strong>. 
                We'll find a way to bridge the gap.
                </p>
                
                <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">The "Enemy" (Refused Food)</label>
                        <input 
                        className={`w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:ring-${baseColor}-500 focus:border-${baseColor}-500 text-sm py-2.5`}
                        placeholder="e.g. Broccoli"
                        value={targetFood}
                        onChange={e => setTargetFood(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">The "Safe" Food (Loves It)</label>
                        <div className="relative mt-1">
                            <input 
                                className={`w-full border-gray-300 rounded-lg shadow-sm focus:ring-${baseColor}-500 focus:border-${baseColor}-500 text-sm py-2.5 pr-10`}
                                placeholder="e.g. Chicken Nuggets"
                                value={safeFood}
                                onChange={e => setSafeFood(e.target.value)}
                            />
                            {safeFood && onUpdateSafeFoods && (
                                <button 
                                    onClick={toggleSafeFoodFavorite}
                                    className={`absolute right-2 top-2 p-1 rounded-full hover:bg-gray-100 transition-colors`}
                                    title={isCurrentSafeFoodFavorited ? "Remove from favorites" : "Save to favorites"}
                                >
                                    <Icon name="heart" className={`w-4 h-4 ${isCurrentSafeFoodFavorited ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                                </button>
                            )}
                        </div>
                        
                        {/* Quick Pick Chips */}
                        {safeFoods.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                <span className="text-[10px] text-gray-400 font-medium self-center mr-1">Favorites:</span>
                                {safeFoods.map(food => (
                                    <button
                                        key={food}
                                        onClick={() => setSafeFood(food)}
                                        className={`text-xs px-2 py-0.5 rounded-full border transition-all ${safeFood === food ? `bg-${baseColor}-100 border-${baseColor}-300 text-${baseColor}-700` : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                    >
                                        {food}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Why do they hate it? (Optional)</label>
                    <input 
                        className={`w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:ring-${baseColor}-500 focus:border-${baseColor}-500 text-sm py-2.5`}
                        placeholder="e.g. Too slimy, green color, texture..."
                        value={ickFactor}
                        onChange={e => setIckFactor(e.target.value)}
                    />
                </div>

                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                <button 
                    onClick={handleAskSage}
                    disabled={loading || !targetFood}
                    className={`w-full bg-${baseColor}-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-${baseColor}-700 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Consulting Chef Sage...
                        </>
                    ) : (
                        <>
                            <Icon name="sparkles" className="w-4 h-4" />
                            Find a Strategy
                        </>
                    )}
                </button>
                </div>
            </div>

            {/* Results Section */}
            {result && (
                <div className="space-y-5 animate-fadeIn pb-20">
                {/* Strategy Cards */}
                {result.strategies.map((strat: PickyEaterStrategy, i: number) => {
                    const icons = ['link', 'ghost', 'smile']; 
                    const colors = ['bg-teal-600', 'bg-violet-600', 'bg-orange-500'];
                    const isSaved = savedStrategies.some(s => s.title === strat.title);
                    
                    return (
                        <div key={i} className="bg-white border border-gray-200 shadow-md rounded-xl overflow-hidden">
                            <div className={`${colors[i]} px-4 py-3 flex justify-between items-center text-white`}>
                                <span className="font-bold text-sm tracking-wide uppercase">{strat.type}</span>
                                <div className="bg-white/20 p-1.5 rounded-full">
                                    <Icon name={icons[i]} className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-gray-800">{strat.title}</h3>
                                    {onSaveStrategy && (
                                        <button 
                                            onClick={() => handleSave(strat)}
                                            className={`transition-colors p-1 ${isSaved ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                                            title="Save to Playbook"
                                            disabled={isSaved}
                                        >
                                            <Icon name="bookmark" className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
                                        </button>
                                    )}
                                </div>
                                
                                <p className={`text-xs font-medium text-${baseColor}-600 bg-${baseColor}-50 inline-block px-2 py-1 rounded mb-4`}>
                                    Why: {strat.why_it_works}
                                </p>
                                
                                <div className="space-y-3">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Ingredients</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {strat.ingredients.map((ing: string, idx: number) => (
                                                <span key={idx} className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-700">{ing}</span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Preparation</p>
                                        <p className="text-sm text-gray-700 leading-relaxed">{strat.instructions}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
                
                {/* Parent Tip */}
                <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200 flex gap-4 items-start shadow-sm">
                    <div className="bg-yellow-100 p-2 rounded-full flex-shrink-0">
                        <Icon name="heart" className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-yellow-800 text-sm mb-1">Sage's Parent Tip</h4>
                        <p className="text-sm text-yellow-800 italic leading-relaxed">"{result.parent_tip}"</p>
                    </div>
                </div>
                </div>
            )}
          </>
      ) : (
          <div className="space-y-4 pb-20">
              {savedStrategies.length === 0 ? (
                  <EmptyState 
                    illustration={<Icon name="book-dashed" className="w-20 h-20 text-gray-300" />}
                    title="Playbook is Empty"
                    message="Use the 'Ask Sage' tab to generate ideas, then save your favorites here!"
                  />
              ) : (
                  savedStrategies.map(strat => (
                      <div key={strat.id} className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden group">
                          <div className={`bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100`}>
                                <div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider text-${baseColor}-600 bg-${baseColor}-50 px-2 py-0.5 rounded`}>{strat.type}</span>
                                    <p className="text-xs text-gray-500 mt-1">
                                        For: <span className="font-bold text-gray-700">{strat.targetFood}</span>
                                    </p>
                                </div>
                                {onDeleteStrategy && (
                                    <button 
                                        onClick={() => onDeleteStrategy(strat.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                        title="Delete Strategy"
                                    >
                                        <Icon name="trash-2" className="w-4 h-4" />
                                    </button>
                                )}
                          </div>
                          
                          <div className="p-4">
                                <h3 className="font-bold text-gray-800 mb-2">{strat.title}</h3>
                                <p className="text-xs text-gray-500 mb-3 italic">{strat.why_it_works}</p>
                                
                                <div className="text-sm text-gray-700 border-t border-gray-100 pt-3">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Ingredients</p>
                                    <p className="mb-3">{strat.ingredients.join(', ')}</p>
                                    
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Instructions</p>
                                    <p>{strat.instructions}</p>
                                </div>
                          </div>
                      </div>
                  ))
              )}
          </div>
      )}
    </div>
  );
};

export default ToddlerPickyEater;
