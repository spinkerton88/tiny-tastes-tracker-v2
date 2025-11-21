
import React from 'react';
import { Food } from '../../types';
import { foodGuideData } from '../../constants';
import Icon from '../ui/Icon';

interface HowToServeModalProps {
  food: Food;
  onClose: () => void;
}

const HowToServeModal: React.FC<HowToServeModalProps> = ({ food, onClose }) => {
  const guide = foodGuideData[food.name];

  const renderRisk = (label: string, value: string) => {
    const lowerValue = value.toLowerCase();
    let colorClasses = 'bg-green-50 border-green-200';
    if (lowerValue.includes('high')) {
        colorClasses = 'bg-red-50 border-red-200';
    } else if (lowerValue.includes('medium')) {
        colorClasses = 'bg-yellow-50 border-yellow-200';
    }
    return <p className={`mb-4 p-3 border rounded-md ${colorClasses}`}><strong>{label}: {value}</strong></p>;
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[501]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold">How to Serve: <span className="text-teal-600">{food.emoji} {food.name}</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
        </div>
        <div className="p-6 modal-scroll-content prose-static">
          {guide ? (
            <>
              {renderRisk("Allergy Risk", guide.allergyRisk)}
              {renderRisk("Choking Risk", guide.chokingRisk)}
              <div dangerouslySetInnerHTML={{ __html: guide.serve6to8 }} />
              <div dangerouslySetInnerHTML={{ __html: guide.serve9to12 }} />
            </>
          ) : (
            <p className="text-center text-gray-500 py-6">A detailed "How to Serve" guide for this food is coming soon!</p>
          )}
          <p className="mt-6 text-xs text-gray-500 border-t pt-4">
            <strong>Disclaimer:</strong> This is for informational purposes only. Consult with a pediatrician or feeding specialist for personalized advice. Always ensure food is soft-cooked and served in a safe, age-appropriate manner.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HowToServeModal;
