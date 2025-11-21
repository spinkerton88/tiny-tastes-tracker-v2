
import React, { useState } from 'react';

interface FamilyIdModalProps {
  onJoin: (id: string) => void;
}

const FamilyIdModal: React.FC<FamilyIdModalProps> = ({ onJoin }) => {
  const [id, setId] = useState('');

  const handleSubmit = () => {
    if (id.trim()) {
      onJoin(id.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-90 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center">Welcome!</h2>
        <p className="text-center text-gray-600 mt-2 mb-6">Create a shared Family ID to track progress across devices.</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="family-id-input" className="block text-sm font-medium text-gray-700">Create or Join a Family ID</label>
            <input
              type="text"
              id="family-id-input"
              value={id}
              onChange={(e) => setId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g., smith-baby-2025"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            />
            <p className="mt-2 text-xs text-gray-500">This is case-sensitive. Share it exactly with your family members.</p>
          </div>
          <button onClick={handleSubmit} className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
            Join / Create Tracker
          </button>
        </div>
      </div>
    </div>
  );
};

export default FamilyIdModal;
