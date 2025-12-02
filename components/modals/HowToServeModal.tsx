
import React, { useState } from 'react';
import { Food, CustomFood } from '../../types';
import { foodGuideData, FOOD_NUTRIENT_MAPPING, NUTRIENT_STYLES, FOOD_ALLERGY_MAPPING } from '../../constants';
import Icon from '../ui/Icon';

interface HowToServeModalProps {
  food: Food;
  onClose: () => void;
}

const HowToServeModal: React.FC<HowToServeModalProps> = ({ food, onClose }) => {
  const rawGuide = foodGuideData[food.name];
  const nutrients = FOOD_NUTRIENT_MAPPING[food.name] || [];
  const [activeTab, setActiveTab] = useState<'6-8' | '9-12'>('6-8');
  
  // Check if it's a custom food with AI details
  const customDetails = (food as CustomFood).isCustom ? (food as CustomFood).details : null;

  // Fallback generation if specific guide is missing
  const guide = rawGuide || {
      allergyRisk: FOOD_ALLERGY_MAPPING[food.name] 
        ? `High (${FOOD_ALLERGY_MAPPING[food.name].join(', ')})` 
        : "Low",
      chokingRisk: "Medium (depends on prep)",
      serve6to8: "<h4 class='font-semibold'>General Advice (6-8m):</h4><p>Ensure food is cooked until soft enough to smash with gentle pressure between your thumb and forefinger. Serve in large pieces baby can hold (palmar grasp).</p>",
      serve9to12: "<h4 class='font-semibold mt-4'>General Advice (9-12m):</h4><p>Cut into small, bite-sized pieces (about the size of a chickpea) to practice pincer grasp. Ensure round foods (like grapes/tomatoes) are quartered lengthwise.</p>"
  };

  // Helper to determine risk styling
  const getRiskStyle = (riskText: string) => {
    if (!riskText) return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: 'info' };
    const lower = riskText.toLowerCase();
    if (lower.includes('high') || lower.includes('avoid')) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'alert-octagon' };
    if (lower.includes('medium') || lower.includes('caution')) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'alert-triangle' };
    return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'shield-check' };
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[501]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start p-5 pb-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-3xl">{food.emoji}</span> {food.name}
                {customDetails && <span className="text-xs font-normal bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Custom</span>}
            </h2>
             {/* Nutrient Badges */}
             {nutrients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {nutrients.map(n => {
                        const style = NUTRIENT_STYLES[n] || { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200", icon: "star", label: n };
                        return (
                            <span key={n} className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}>
                                <Icon name={style.icon} className="w-3 h-3 mr-1" /> {style.label}
                            </span>
                        );
                    })}
                </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><Icon name="x" className="w-5 h-5" /></button>
        </div>

        <div className="p-0 modal-scroll-content bg-white flex-1 overflow-y-auto">
          {customDetails ? (
              // Custom Food Layout
              <div className="p-5 space-y-6 animate-fadeIn">
                  <div className={`p-4 rounded-xl border ${getRiskStyle(customDetails.safety_rating).bg} ${getRiskStyle(customDetails.safety_rating).border} text-center`}>
                        <p className="text-xs font-bold uppercase tracking-wide opacity-70">Safety Rating</p>
                        <p className={`text-lg font-bold ${getRiskStyle(customDetails.safety_rating).text}`}>{customDetails.safety_rating}</p>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <Icon name="alert-circle" className="w-3.5 h-3.5" /> Allergen Info
                          </h3>
                          <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">{customDetails.allergen_info}</p>
                      </div>
                      <div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <Icon name="chef-hat" className="w-3.5 h-3.5" /> Serving Recommendation
                          </h3>
                          <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">{customDetails.texture_recommendation}</p>
                      </div>
                      <div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <Icon name="heart" className="w-3.5 h-3.5" /> Nutrition Highlight
                          </h3>
                          <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">{customDetails.nutrition_highlight}</p>
                      </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 text-xs text-yellow-800">
                      <p><strong>Note:</strong> This is a custom food entry generated by AI. Consult your pediatrician for specific advice.</p>
                  </div>
              </div>
          ) : (
            // Standard Food Layout (Used for both explicit guide data and fallback)
            <div className="p-5 space-y-6">
               {/* Safety Profile Section */}
               <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <Icon name="shield" className="w-3 h-3" /> Safety Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Allergy', val: guide.allergyRisk },
                            { label: 'Choking', val: guide.chokingRisk }
                        ].map((risk, idx) => {
                            const style = getRiskStyle(risk.val);
                            return (
                                <div key={idx} className={`p-3 rounded-xl border ${style.bg} ${style.border}`}>
                                    <div className={`flex items-center gap-1.5 mb-1 ${style.text}`}>
                                        <Icon name={style.icon} className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase">{risk.label}</span>
                                    </div>
                                    <p className={`text-sm font-bold leading-tight ${style.text}`}>{risk.val}</p>
                                </div>
                            )
                        })}
                    </div>
               </div>

               {/* Preparation Guide */}
               <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <Icon name="chef-hat" className="w-3 h-3" /> Preparation Guide
                    </h3>
                    
                    {/* Age Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
                        <button
                            onClick={() => setActiveTab('6-8')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                            activeTab === '6-8'
                                ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            6-8 Months
                        </button>
                        <button
                            onClick={() => setActiveTab('9-12')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                            activeTab === '9-12'
                                ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            9-12 Months
                        </button>
                    </div>

                    {/* Content Card */}
                    <div className="prose-static bg-teal-50/60 p-5 rounded-xl border border-teal-100/60 text-gray-700 text-sm leading-relaxed">
                        {/* 
                           The raw HTML strings contain <h4> headers that duplicate our tabs.
                           We use CSS to visually hide the first h4 in the content since we have tabs now.
                           This keeps the UI clean without needing regex parsing.
                        */}
                         <style>{`
                            .prose-static h4 { display: none; }
                         `}</style>
                         <div dangerouslySetInnerHTML={{ __html: activeTab === '6-8' ? guide.serve6to8 : guide.serve9to12 }} />
                    </div>
               </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400">
                Always consult your pediatrician. Ensure food is soft & safe.
            </p>
        </div>
      </div>
    </div>
  );
};

export default HowToServeModal;
