
import React, { useMemo, useState } from 'react';
import Icon from '../ui/Icon';
import { getNutrientGapSuggestions } from '../../services/geminiService';
import { TriedFoodLog } from '../../types';
import { allFoods, FOOD_COLORS, FOOD_NUTRIENT_MAPPING, NUTRIENT_STYLES } from '../../constants';

interface BalanceDashboardProps {
    triedFoods: TriedFoodLog[];
    baseColor?: string;
}

const COLORS = {
  Carbs: '#fcd34d',    // amber-300
  Protein: '#f87171',  // red-400
  FruitVeg: '#4ade80', // green-400
  Dairy: '#60a5fa'     // blue-400
};

const CRITICAL_NUTRIENTS = ['Iron', 'Calcium', 'Vitamin C', 'Omega-3', 'Protein'];

export const BalanceDashboard: React.FC<BalanceDashboardProps> = ({ triedFoods, baseColor = 'teal' }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);

  const weeklyData = useMemo(() => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
      
      const recentLogs = triedFoods.filter(log => new Date(log.date) >= sevenDaysAgo);
      
      // Calculate Total Unique Meals (Date + Meal Type)
      const uniqueMeals = new Set(recentLogs.map(log => `${log.date}-${log.meal}`));
      const totalMeals = uniqueMeals.size;
      
      const distribution = {
          Carbs: 0,
          Protein: 0,
          FruitVeg: 0,
          Dairy: 0
      };
      
      const colorsEaten = new Set<string>();
      const nutrientsConsumed = new Set<string>();
      
      // Map Categories to Buckets
      const bucketMap: Record<string, keyof typeof distribution> = {
          "Vegetables": "FruitVeg",
          "Fruits": "FruitVeg",
          "Grains": "Carbs",
          "Meat": "Protein",
          "Plant Protein": "Protein",
          "Dairy & Eggs": "Dairy",
          "Other": "Carbs" // Defaulting 'Other' to carbs/treats bucket for simplicity
      };

      // Helper for fuzzy matching keys in constants
      const findConstantKey = (constantObj: Record<string, any>, searchName: string) => {
          const upper = searchName.toUpperCase().trim();
          if (constantObj[upper]) return upper;
          // Try singular/plural
          if (upper.endsWith('S') && constantObj[upper.slice(0, -1)]) return upper.slice(0, -1);
          if (constantObj[upper + 'S']) return upper + 'S';
          return null;
      };

      recentLogs.forEach(log => {
          const foodName = log.id;
          const foodNameLower = foodName.toLowerCase().trim();
          let foodCategoryName = "Other";
          
          // Robust Category Lookup
          for (const cat of allFoods) {
              if (cat.items.some(item => item.name.toLowerCase() === foodNameLower)) {
                  foodCategoryName = cat.category;
                  break;
              }
          }
          
          const bucket = bucketMap[foodCategoryName];
          if (bucket) distribution[bucket]++;
          
          // Robust Color Lookup
          const colorKey = findConstantKey(FOOD_COLORS, foodName);
          if (colorKey && FOOD_COLORS[colorKey]) {
              colorsEaten.add(FOOD_COLORS[colorKey]);
          }
          
          // Robust Nutrient Lookup
          const nutrientKey = findConstantKey(FOOD_NUTRIENT_MAPPING, foodName);
          if (nutrientKey && FOOD_NUTRIENT_MAPPING[nutrientKey]) {
              const nutrients = FOOD_NUTRIENT_MAPPING[nutrientKey];
              nutrients.forEach(n => nutrientsConsumed.add(n));
          }
      });
      
      // Find first missing critical nutrient
      const missingNutrient = CRITICAL_NUTRIENTS.find(n => !nutrientsConsumed.has(n)) || 'None';

      return {
          totalMeals,
          distribution,
          colorsEaten: Array.from(colorsEaten),
          nutrientsConsumed,
          missingNutrient
      };
  }, [triedFoods]);

  // Calculate percentages for the donut chart
  const chartData = useMemo(() => {
    const total = Math.max(1, (Object.values(weeklyData.distribution) as number[]).reduce((a, b) => a + b, 0));
    let startDeg = 0;
    
    return Object.entries(weeklyData.distribution).map(([category, count]) => {
      const val = count as number;
      const pct = (val / total) * 100;
      const deg = (val / total) * 360;
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
  }, [weeklyData]);

  // CSS Conic Gradient for the Chart
  const gradientString = chartData
    .map(seg => `${seg.color} ${seg.start}deg ${seg.end}deg`)
    .join(', ');

  const handleAskSage = async () => {
      setLoading(true);
      try {
          // Calculate a simple diet trend description string for the AI
          const trendDesc = Object.entries(weeklyData.distribution)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([k, v]) => `${k} (${v})`)
            .join(', ');

          const result = await getNutrientGapSuggestions(
              weeklyData.missingNutrient === 'None' ? 'Iron' : weeklyData.missingNutrient, 
              `Toddler eating mostly: ${trendDesc}`
          );
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
            className="w-48 h-48 rounded-full relative flex items-center justify-center shadow-inner mb-6"
            style={{ background: weeklyData.totalMeals > 0 ? `conic-gradient(${gradientString})` : '#f3f4f6' }}
          >
            <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-sm z-10">
              <span className="text-3xl font-black text-gray-800">{weeklyData.totalMeals}</span>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Meals Logged</span>
            </div>
          </div>

          {/* Critical Nutrient Checklist */}
          <div className="w-full bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 text-center">Critical Nutrients</h3>
              <div className="flex justify-between px-2">
                  {CRITICAL_NUTRIENTS.map(nutrient => {
                      const isMet = weeklyData.nutrientsConsumed.has(nutrient);
                      const style = NUTRIENT_STYLES[nutrient] || { icon: 'star', text: 'text-gray-600', bg: 'bg-gray-100', label: nutrient };
                      // Use the configured short label (e.g. 'Vit C') if available, otherwise fallback
                      const displayLabel = style.label || nutrient.split(' ')[0];
                      
                      return (
                          <div key={nutrient} className="flex flex-col items-center gap-1" title={nutrient}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${isMet ? `bg-${baseColor}-100 border-${baseColor}-200` : 'bg-white border-gray-200 grayscale opacity-50'}`}>
                                  <Icon name={style.icon} className={`w-4 h-4 ${isMet ? `text-${baseColor}-600` : 'text-gray-300'}`} />
                              </div>
                              <span className={`text-[9px] font-bold ${isMet ? 'text-gray-700' : 'text-gray-300'}`}>{displayLabel}</span>
                          </div>
                      )
                  })}
              </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-4 w-full">
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
      <div className={`bg-gradient-to-br from-${baseColor}-50 to-white rounded-2xl shadow-sm border border-${baseColor}-100 p-6`}>
        <div className="flex items-center gap-2 mb-4">
           <Icon name="palette" className={`w-5 h-5 text-${baseColor}-500`} />
           <h2 className={`text-lg font-bold text-${baseColor}-900`}>Eat the Rainbow</h2>
        </div>
        <p className={`text-xs text-${baseColor}-600 mb-6`}>Hit 5 colors this week to unlock a badge!</p>
        
        <div className="flex justify-between px-2">
          {[
            { color: 'red', label: 'Red', bg: 'bg-red-500' },
            { color: 'orange', label: 'Org', bg: 'bg-orange-400' },
            { color: 'yellow', label: 'Yel', bg: 'bg-yellow-400' },
            { color: 'green', label: 'Grn', bg: 'bg-green-500' },
            { color: 'purple', label: 'Pur', bg: 'bg-purple-500' },
          ].map((item) => {
            const isUnlocked = weeklyData.colorsEaten.includes(item.color);
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
      <div className={`bg-${baseColor}-50 rounded-2xl border border-${baseColor}-100 p-5`}>
         <div className="flex items-start gap-4">
            <div className={`bg-${baseColor}-100 p-2 rounded-full`}>
                <Icon name="zap" className={`w-6 h-6 text-${baseColor}-600`} />
            </div>
            <div className="flex-1">
                <h3 className={`font-bold text-${baseColor}-900 text-sm`}>
                    {weeklyData.missingNutrient !== 'None' 
                        ? `Nutrient Gap: ${weeklyData.missingNutrient}` 
                        : "Looking Good!"}
                </h3>
                <p className={`text-xs text-${baseColor}-700 mt-1 mb-3`}>
                    {weeklyData.missingNutrient !== 'None' 
                        ? `We haven't seen much ${weeklyData.missingNutrient} this week. Need quick ideas?`
                        : "Your weekly log covers the main nutrient groups well! Ask Sage for more fun snack ideas anytime."}
                </p>
                
                {!suggestions && (
                    <button 
                        onClick={handleAskSage}
                        disabled={loading}
                        className={`bg-${baseColor}-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-${baseColor}-700 disabled:opacity-50 transition-colors flex items-center gap-2`}
                    >
                        {loading ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Asking Sage...
                            </>
                        ) : (
                            `Ask Sage for ${weeklyData.missingNutrient !== 'None' ? weeklyData.missingNutrient : 'Snack'} Ideas`
                        )}
                    </button>
                )}
            </div>
         </div>
         
         {suggestions && (
             <div className={`mt-5 animate-fadeIn space-y-3 pt-4 border-t border-${baseColor}-100`}>
                 {suggestions.suggestions.map((item: any, idx: number) => (
                     <div key={idx} className={`bg-white p-3 rounded-lg border border-${baseColor}-100 shadow-sm`}>
                         <div className="flex justify-between items-start">
                             <h4 className={`font-bold text-${baseColor}-800 text-sm`}>{item.food}</h4>
                             <span className={`text-[10px] font-medium bg-${baseColor}-50 text-${baseColor}-600 px-2 py-0.5 rounded-full`}>{item.prep_time}</span>
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
