import React, { useState, useEffect } from 'react';
import { Food, UserProfile, FoodSubstitute } from '../../types';
import { getFoodSubstitutes } from '../../services/geminiService';
import { allFoods } from '../../constants';
import { calculateAgeInMonths } from '../../utils';
import Icon from '../ui/Icon';

interface SubstitutesModalProps {
  food: Food;
  userProfile: UserProfile | null;
  onClose: () => void;
  onSelectSubstitute: (food: Food) => void;
}

const SubstitutesModal: React.FC<SubstitutesModalProps> = ({ food, userProfile, onClose, onSelectSubstitute }) => {
    const [substitutes, setSubstitutes] = useState<FoodSubstitute[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const flatFoodList = allFoods.flatMap(c => c.items);

    useEffect(() => {
        const fetchSubstitutes = async () => {
            if (!userProfile?.birthDate) {
                setError("Baby's birth date is not set.");
                setLoading(false);
                return;
            }
            try {
                const ageInMonths = calculateAgeInMonths(userProfile.birthDate);
                const result = await getFoodSubstitutes(food.name, ageInMonths);
                setSubstitutes(result);
            } catch (err) {
                setError("Could not fetch substitutes. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchSubstitutes();
    }, [food.name, userProfile?.birthDate]);

    const handleSelect = (substituteName: string) => {
        const upperCaseName = substituteName.toUpperCase();
        // Try to find an exact or partial match in our food list
        const foundFood = flatFoodList.find(f => upperCaseName.includes(f.name));
        if (foundFood) {
            onSelectSubstitute(foundFood);
        } else {
            alert(`"${substituteName}" is a great suggestion, but it's not in the app's 100 foods list yet!`);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[501]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-semibold">Substitutes for <span className="text-teal-600">{food.name}</span></h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
                </div>
                <div className="p-6 modal-scroll-content">
                    {loading && (
                        <div className="text-center p-6">
                            <div className="spinner mx-auto"></div>
                            <p className="mt-4 text-sm text-gray-600">Finding safe & yummy substitutes...</p>
                        </div>
                    )}
                    {error && <p className="text-center text-red-600 p-6">{error}</p>}
                    {!loading && !error && (
                        <div className="space-y-4">
                            {substitutes.length > 0 ? (
                                substitutes.map((sub, index) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                                        <h4 className="font-semibold text-gray-800">{sub.name}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{sub.reason}</p>
                                        <button 
                                            onClick={() => handleSelect(sub.name)}
                                            className="text-sm text-teal-600 font-medium mt-2 hover:underline">
                                            Log this food
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 p-6">No specific substitutes found. Try exploring other foods in the same category!</p>
                            )}
                        </div>
                    )}
                    <p className="mt-6 text-xs text-gray-500 border-t pt-4">
                        <strong>Disclaimer:</strong> AI-generated suggestions. Always ensure food is soft-cooked and served in a safe, age-appropriate manner. Check for allergens.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubstitutesModal;