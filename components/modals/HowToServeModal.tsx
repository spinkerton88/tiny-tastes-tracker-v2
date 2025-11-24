
import React, { useState } from 'react';
import { Food } from '../../types';
import { foodGuideData, FOOD_NUTRIENT_MAPPING, NUTRIENT_STYLES } from '../../constants';
import Icon from '../ui/Icon';

interface HowToServeModalProps {
  food: Food;
  onClose: () => void;
}

const HowToServeModal: React.FC<HowToServeModalProps> = ({ food, onClose }) => {
  const guide = foodGuideData[food.name];
  const nutrients = FOOD_NUTRIENT_MAPPING[food.name] || [];
  const [activeTab, setActiveTab] = useState<'6-8' | '9-12'>('6-8');

  // Helper to determine risk styling
  const getRiskStyle = (riskText: string) => {
    const lower = riskText.toLowerCase();
    if (lower.includes('high')) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'alert-octagon' };
    if (lower.includes('medium')) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'alert-triangle' };
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
          {guide ? (
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
          ) : (
             <div className="p-10 text-center flex flex-col items-center justify-center h-full">
                <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                    <Icon name="clock" className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">A detailed serving guide for this food is coming soon!</p>
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
