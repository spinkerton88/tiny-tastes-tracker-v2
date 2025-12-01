
import React, { useState } from 'react';
import { UserProfile } from '../../types';
import Icon from '../ui/Icon';

interface TutorialModalProps {
  onSave: (profile: UserProfile) => void;
}

const tutorialSteps = [
    {
        icon: 'baby',
        title: "Welcome to Tiny Tastes",
        description: "The intelligent companion that adapts to your child's age—from newborn days to toddler years.",
    },
    {
        icon: 'moon',
        title: "Newborn Mode (0-6m)",
        description: "Track essential feeds, diapers, and growth. Ask 'Sage' AI about sleep schedules and development milestones.",
    },
    {
        icon: 'carrot',
        title: "Explorer Mode (6-12m)",
        description: "Start solids safely with our '100 Foods' tracker. Log reactions, check allergens, and get serving tips.",
    },
    {
        icon: 'chef-hat',
        title: "Toddler Mode (12m+)",
        description: "Meal planning, recipe scanning, and AI-powered strategies to help your picky eater learn to love food.",
    },
];

const TutorialModal: React.FC<TutorialModalProps> = ({ onSave }) => {
    const [step, setStep] = useState(0);
    const [babyName, setBabyName] = useState('');
    const [birthDate, setBirthDate] = useState('');

    const totalSteps = tutorialSteps.length + 1; // +1 for the final profile form step

    const handleNext = () => {
        if (step < totalSteps - 1) {
            setStep(step + 1);
        }
    };

    const handlePrev = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const handleSubmit = () => {
        if (babyName.trim() && birthDate) {
            onSave({ babyName: babyName.trim(), birthDate });
        } else {
            alert("Please enter your baby's name and birth date.");
        }
    };

    const isFinalStep = step === totalSteps - 1;
    const currentStepData = tutorialSteps[step];

    return (
        <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-4 z-[999]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto border-t-4 border-teal-500 overflow-hidden">
                <div className="p-6 min-h-[280px] flex flex-col justify-center">
                    {isFinalStep ? (
                        <>
                            <h2 className="text-2xl font-bold text-gray-800 text-center">Let's Get Started!</h2>
                            <p className="text-center text-gray-600 mt-2 mb-6">Create a profile for your little one to personalize recommendations and tracking.</p>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="baby-name-input" className="block text-sm font-medium text-gray-700">Baby's Name</label>
                                    <input
                                        type="text"
                                        id="baby-name-input"
                                        value={babyName}
                                        onChange={(e) => setBabyName(e.target.value)}
                                        placeholder="e.g., Alex"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="birth-date-input" className="block text-sm font-medium text-gray-700">Baby's Birth Date</label>
                                    <input type="date" id="birth-date-input" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-teal-100 mb-4">
                                <Icon name={currentStepData.icon} className="h-8 w-8 text-teal-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">{currentStepData.title}</h2>
                            <p className="text-gray-600 mt-2">{currentStepData.description}</p>
                        </div>
                    )}
                </div>
                
                <div className="bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                        {step > 0 && !isFinalStep && (
                             <button onClick={handlePrev} className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2">
                                Previous
                            </button>
                        )}
                        {/* Spacer to keep buttons aligned */}
                        {step === 0 && <div/>} 
                        {isFinalStep && (
                            <button onClick={handlePrev} className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2">
                                Back
                            </button>
                        )}

                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalSteps }).map((_, index) => (
                                <div key={index} className={`h-2 w-2 rounded-full transition-colors ${step === index ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
                            ))}
                        </div>
                        
                        {isFinalStep ? (
                            <button onClick={handleSubmit} className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">
                                Save Profile
                            </button>
                        ) : (
                            <button onClick={handleNext} className="inline-flex items-center gap-1.5 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">
                                Next <Icon name="arrow-right" className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialModal;
