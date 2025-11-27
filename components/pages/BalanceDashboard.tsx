
import React, { useMemo, useState } from 'react';
import Icon from '../ui/Icon';
import { getNutrientGapSuggestions } from '../../services/geminiService';

// Mock Data simulating last 7 days
const MOCK_WEEKLY_DATA = {
  totalMeals: 21,
  distribution: {
    Carbs: 12,    // 57%
    Protein: 4,   // 19%
    FruitVeg: 3,  // 14%
    Dairy: 2      // 10%
  },
  colorsEaten: ['red', 'orange', 'green'], // Missing yellow, purple
  missingNutrient: 'Iron'
};

const COLORS = {
  Carbs: '#fcd34d',    // amber-300
  Protein: '#f87171',  // red-400
  FruitVeg: '#4ade80', // green-400
  Dairy: '#60a5fa'     // blue-400
};

export const BalanceDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);

  // Calculate percentages for the donut chart
  const chartData = useMemo(() => {
    const total = Object.values(MOCK_WEEKLY_DATA.distribution).reduce((a, b) => a + b, 0);
    let startDeg = 0;
    
    return Object.entries(MOCK_WEEKLY_DATA.distribution).map(([category, count]) => {
      const pct = (count / total) * 100;
      const deg = (count / total) * 360;
      const segment = {
        category,
        pct: Math.round(pct),
        color: COLORS[category as keyof typeof COLORS],
        start: startDeg,
        end: startDeg + deg
      };
      startDeg += deg;
      return segment;
    });
  }, []);

  // CSS Conic Gradient for the Chart
  const gradientString = chartData
    .map(seg => `${seg.color} ${seg.start}deg ${seg.end}deg`)
    .join(', ');

  const handleAskSage = async () => {
      setLoading(true);
      try {
          const result = await getNutrientGapSuggestions(MOCK_WEEKLY_DATA.missingNutrient, "Toddler picky eater, mostly carbs");
          setSuggestions(result);
      } catch (e) {
          alert("Sage is busy right now.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. HERO: The Weekly Plate */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">The Weekly Plate</h2>
          <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Last 7 Days</span>
        </div>

        <div className="flex flex-col items-center">
          {/* CSS-Only Donut Chart */}
          <div 
            className="w-48 h-48 rounded-full relative flex items-center justify-center shadow-inner"
            style={{ background: `conic-gradient(${gradientString})` }}
          >
            <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-sm z-10">
              <span className="text-3xl font-black text-gray-800">21</span>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Meals Logged</span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-4 mt-8 w-full">
            {chartData.map((seg) => (
              <div key={seg.category} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                <div className="flex flex-col">
                   <span className="text-xs font-bold text-gray-700">{seg.category}</span>
                   <span className="text-[10px] text-gray-400">{seg.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. GAMIFICATION: Eat the Rainbow */}
      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-sm border border-indigo-100 p-6">
        <div className="flex items-center gap-2 mb-4">
           <Icon name="palette" className="w-5 h-5 text-indigo-500" />
           <h2 className="text-lg font-bold text-indigo-900">Eat the Rainbow</h2>
        </div>
        <p className="text-xs text-indigo-600 mb-6">Hit 5 colors this week to unlock a badge!</p>
        
        <div className="flex justify-between px-2">
          {[
            { color: 'red', label: 'Red', bg: 'bg-red-500' },
            { color: 'orange', label: 'Org', bg: 'bg-orange-400' },
            { color: 'yellow', label: 'Yel', bg: 'bg-yellow-400' },
            { color: 'green', label: 'Grn', bg: 'bg-green-500' },
            { color: 'purple', label: 'Pur', bg: 'bg-purple-500' },
          ].map((item) => {
            const isUnlocked = MOCK_WEEKLY_DATA.colorsEaten.includes(item.color);
            return (
              <div key={item.color} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-all ${isUnlocked ? item.bg : 'bg-gray-200 grayscale'}`}>
                  {isUnlocked && <Icon name="check" className="w-5 h-5 text-white" />}
                </div>
                <span className={`text-[10px] font-bold ${isUnlocked ? 'text-gray-700' : 'text-gray-300'}`}>{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. AI INSIGHT: The Gap Filler */}
      <div className="bg-teal-50 rounded-2xl border border-teal-100 p-5">
         <div className="flex items-start gap-4">
            <div className="bg-teal-100 p-2 rounded-full">
                <Icon name="zap" className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-teal-900 text-sm">Nutrient Gap: {MOCK_WEEKLY_DATA.missingNutrient}</h3>
                <p className="text-xs text-teal-700 mt-1 mb-3">
                    Looks like protein is a bit low this week. Need quick ideas?
                </p>
                
                {!suggestions && (
                    <button 
                        onClick={handleAskSage}
                        disabled={loading}
                        className="bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Asking Sage...
                            </>
                        ) : (
                            `Ask Sage for ${MOCK_WEEKLY_DATA.missingNutrient} Snacks`
                        )}
                    </button>
                )}
            </div>
         </div>
         
         {suggestions && (
             <div className="mt-5 animate-fadeIn space-y-3 pt-4 border-t border-teal-100">
                 {suggestions.suggestions.map((item: any, idx: number) => (
                     <div key={idx} className="bg-white p-3 rounded-lg border border-teal-100 shadow-sm">
                         <div className="flex justify-between items-start">
                             <h4 className="font-bold text-teal-800 text-sm">{item.food}</h4>
                             <span className="text-[10px] font-medium bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">{item.prep_time}</span>
                         </div>
                         <p className="text-xs text-gray-600 mt-1">{item.why}</p>
                     </div>
                 ))}
                 <div className="bg-yellow-50 p-2 rounded text-[10px] text-yellow-800 flex gap-2 items-center">
                     <Icon name="lightbulb" className="w-3 h-3 flex-shrink-0" />
                     {suggestions.quick_tip}
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default BalanceDashboard;
