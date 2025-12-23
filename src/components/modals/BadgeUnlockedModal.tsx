
import React from 'react';
import { Badge } from '../../types';
import Icon from '../ui/Icon';

interface BadgeUnlockedModalProps {
  badge: Badge;
  onClose: () => void;
}

const BadgeUnlockedModal: React.FC<BadgeUnlockedModalProps> = ({ badge, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center p-4 z-[999] animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden text-center p-8 relative transform transition-all scale-100">
        
        {/* Confetti / Ray Effect Background (Simulated with simple shapes) */}
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-50 to-white -z-10"></div>
        
        <div className="mb-6 flex justify-center">
            <div className={`p-6 rounded-full bg-yellow-100 ring-8 ring-yellow-50 animate-bounce`}>
                <Icon name={badge.icon} className="w-16 h-16 text-yellow-600" />
            </div>
        </div>

        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-wide mb-2">New Badge!</h2>
        <h3 className="text-xl font-bold text-teal-600 mb-4">{badge.title}</h3>
        <p className="text-gray-500 mb-8">{badge.description}</p>

        <button 
            onClick={onClose} 
            className="w-full py-3 px-4 border border-transparent rounded-full shadow-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-200"
        >
            Awesome!
        </button>
      </div>
    </div>
  );
};

export default BadgeUnlockedModal;
