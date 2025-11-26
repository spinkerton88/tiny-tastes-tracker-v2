
import React from 'react';
import Icon from '../ui/Icon';

interface AllergenAlertModalProps {
  foodName: string;
  allergens: string[];
  onClose: () => void;
}

const AllergenAlertModal: React.FC<AllergenAlertModalProps> = ({ foodName, allergens, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-80 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm mx-auto overflow-hidden animate-fadeIn">
        <div className="bg-orange-50 border-b border-orange-100 p-6 flex flex-col items-center text-center">
            <div className="bg-orange-100 p-3 rounded-full mb-3">
                <Icon name="alert-triangle" className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Allergen Alert</h2>
            <p className="text-sm text-orange-800 font-medium mt-1">
                You just logged {foodName} for the first time.
            </p>
        </div>
        
        <div className="p-6">
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                This food contains <strong>{allergens.join(', ')}</strong>, which {allergens.length > 1 ? 'are common allergens' : 'is a common allergen'}.
            </p>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <h4 className="flex items-center gap-2 text-sm font-bold text-blue-800 mb-2">
                    <Icon name="eye" className="w-4 h-4" /> Watch for 2 Hours:
                </h4>
                <ul className="text-xs text-blue-800 space-y-1 ml-6 list-disc">
                    <li>Hives or rash (especially around the mouth)</li>
                    <li>Vomiting</li>
                    <li>Swelling of lips or face</li>
                    <li>Wheezing or difficulty breathing</li>
                </ul>
            </div>

            <button 
                onClick={onClose} 
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
                Got it, I'll keep watch
            </button>
        </div>
      </div>
    </div>
  );
};

export default AllergenAlertModal;
