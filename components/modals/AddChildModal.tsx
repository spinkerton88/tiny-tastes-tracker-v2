
import React, { useState } from 'react';
import { UserProfile } from '../../types';
import Icon from '../ui/Icon';

interface AddChildModalProps {
  onClose: () => void;
  onSave: (child: UserProfile) => void;
}

const AddChildModal: React.FC<AddChildModalProps> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState<'boy' | 'girl' | undefined>(undefined);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const newChild: UserProfile = {
            id: crypto.randomUUID(),
            babyName: name,
            birthDate: birthDate || undefined,
            gender: gender,
            badges: [], // Initialize empty
            knownAllergies: []
        };
        onSave(newChild);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[600]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-auto overflow-hidden animate-popIn">
                <div className="flex justify-between items-center border-b p-4 bg-teal-50">
                    <h2 className="text-lg font-bold text-teal-900 flex items-center gap-2">
                        <Icon name="baby" className="w-5 h-5 text-teal-600" />
                        Add Child
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Child's Name</label>
                        <input 
                            type="text" 
                            required
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
                            placeholder="e.g. Liam"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                        <input 
                            type="date" 
                            value={birthDate} 
                            onChange={e => setBirthDate(e.target.value)} 
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender (for Growth Charts)</label>
                        <div className="flex gap-3">
                            <button 
                                type="button"
                                onClick={() => setGender('boy')}
                                className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${gender === 'boy' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Icon name="smile" className="w-4 h-4" /> Boy
                            </button>
                            <button 
                                type="button"
                                onClick={() => setGender('girl')}
                                className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${gender === 'girl' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Icon name="heart" className="w-4 h-4" /> Girl
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-2 bg-teal-600 text-white rounded-md text-sm font-bold hover:bg-teal-700 shadow-sm">
                            Add Profile
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddChildModal;
