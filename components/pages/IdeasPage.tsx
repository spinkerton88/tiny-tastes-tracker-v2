
import React, { useState } from 'react';
import { UserProfile, TriedFoodLog, Food } from '../../types';
import { recommendationData, allFoods, FOOD_ALLERGY_MAPPING } from '../../constants';
import Accordion from '../ui/Accordion';
import Icon from '../ui/Icon';

interface RecommendationsPageProps {
  userProfile: UserProfile | null;
  triedFoods: TriedFoodLog[];
  onSaveProfile: (profile: UserProfile) => void;
  onFoodClick: (food: Food) => void;
  onShowSubstitutes: (food: Food) => void;
  onShowFlavorPairing: () => void;
  baseColor?: string;
}

const calculateAge = (dateString: string) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    if (days < 0) { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    const totalMonths = (years * 12) + months;
    let ageKey = '12_plus';
    if (totalMonths < 6) ageKey = 'too_young';
    else if (totalMonths === 6) ageKey = '6_months';
    else if (totalMonths >= 7 && totalMonths <= 8) ageKey = '7_8_months';
    else if (totalMonths >= 9 && totalMonths <= 11) ageKey = '9_11_months';
    let ageString = '';
    if (years > 0) ageString += `${years} year${years > 1 ? 's' : ''}, `;
    ageString += `${months} month${months !== 1 ? 's' : ''}, and ${days} day${days !== 1 ? 's' : ''}`;
    return { ageString, ageKey, totalMonths };
};

const FoodCard: React.FC<{ 
    food: Food; 
    isTried: boolean; 
    isAllergic: boolean;
    onClick: () => void;
    onSubstitutesClick: () => void;
    baseColor: string;
}> = ({ food, isTried, isAllergic, onClick, onSubstitutesClick, baseColor }) => {
    const category = allFoods.find(cat => cat.items.some(item => item.name === food.name));
    if (!category) return null;
    const triedClass = isTried ? 'is-tried' : '';

    return (
        <div className={`food-card relative ${category.color} ${category.textColor} rounded-lg shadow-sm font-medium text-sm text-center border ${category.borderColor} ${triedClass} transition-all duration-200 hover:shadow-md`}>
            <button
              onClick={onClick}
              className={`w-full p-3 h-24 flex flex-col items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-${baseColor}-500 rounded-lg`}
              type="button"
              aria-label={`Log ${food.name}`}
            >
              <span className="text-3xl">{food.emoji}</span>
              <span className="mt-1 text-center leading-tight">{food.name}</span>
            </button>

            {isAllergic && !isTried && (
                <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm z-10" title="Contains known allergen">
                    <Icon name="alert-triangle" className="w-4 h-4 text-red-500 fill-red-50" />
                </div>
            )}
    
            {/* Added pointer-events-none so clicks pass through to the button underneath */}
            <div className="check-overlay absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg pointer-events-none">
              <Icon name="check-circle-2" className={`w-12 h-12 text-${baseColor}-600`} />
            </div>
            
            {!isTried && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onSubstitutesClick();
                    }}
                    className={`substitute-btn absolute bottom-1 right-1 bg-white/80 hover:bg-white text-${baseColor}-700 rounded-full p-1.5 text-xs font-medium flex items-center gap-1 shadow-sm border border-${baseColor}-200 z-10 transition-colors`}
                    title="Find Substitutes"
                    aria-label={`Find substitutes for ${food.name}`}
                >
                    <Icon name="replace" className="w-4 h-4"/>
                </button>
            )}
      </div>
    );
};

const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ userProfile, triedFoods, onSaveProfile, onFoodClick, onShowSubstitutes, onShowFlavorPairing, baseColor = 'teal' }) => {
    const [pediatricianApproved, setPediatricianApproved] = useState(userProfile?.pediatricianApproved || false);

    const handleApproveEarlyStart = () => {
        setPediatricianApproved(true);
        onSaveProfile({ ...userProfile, pediatricianApproved: true });
    }

    const renderRecommendations = () => {
        if (!userProfile?.birthDate) {
            return <p className="text-gray-500 text-center py-4 bg-white p-6 rounded-lg shadow">Please set your baby's birth date in the Profile tab to see recommendations.</p>;
        }

        const { ageString, ageKey } = calculateAge(userProfile.birthDate);
        const knownAllergens = Array.isArray(userProfile.knownAllergies) ? userProfile.knownAllergies : [];
        
        if (ageKey === 'too_young' && !pediatricianApproved) {
            return (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h3 className="text-lg font-semibold text-yellow-800">Note: Baby is Under 6 Months</h3>
                    <p className="text-yellow-700 mt-2">{recommendationData.too_young.message}</p>
                    <p className="text-gray-700 font-medium mt-4">Has your pediatrician specifically approved starting solids early?</p>
                    <div className="mt-3"><button onClick={handleApproveEarlyStart} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Yes, we are approved</button></div>
                </div>
            );
        }

        const triedFoodSet = new Set(triedFoods.map(f => f.id));
        const currentStageKey = (ageKey === 'too_young' && pediatricianApproved) ? '6_months' : ageKey;

        const isFoodAllergic = (foodName: string) => {
            const foodAllergens = FOOD_ALLERGY_MAPPING[foodName];
            if (!foodAllergens) return false;
            return foodAllergens.some(allergen => knownAllergens.includes(allergen));
        };

        return (
            <>
                <div className={`mt-6 p-4 bg-${baseColor}-50 rounded-md`}>
                    <p className={`text-lg font-medium text-${baseColor}-800`}>
                        <span className="font-normal">{userProfile.babyName ? `${userProfile.babyName}'s Age:` : "Baby's Age:"}</span> <span className="font-bold">{ageString}</span>
                    </p>
                </div>
                
                {/* Sage Pairing CTA */}
                {triedFoods.length > 2 && (
                    <div className="mt-4 p-5 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100 flex items-center justify-between shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-violet-800 flex items-center gap-2">
                                <Icon name="sparkles" className="w-5 h-5 text-violet-600" />
                                Sage's Flavor Sommelier
                            </h3>
                            <p className="text-sm text-violet-700 mt-1 max-w-sm">
                                You've tried {triedFoods.length} foods! Tap to get custom pairing ideas from "Sage" based on what {userProfile.babyName || 'baby'} likes.
                            </p>
                            <button 
                                onClick={onShowFlavorPairing}
                                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-white text-violet-700 text-xs font-bold rounded-full shadow hover:bg-violet-50 transition-colors border border-violet-200"
                            >
                                Get Pairing Ideas <Icon name="arrow-right" className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="absolute right-[-10px] top-[-10px] text-violet-200 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
                             <Icon name="chef-hat" className="w-40 h-40" />
                        </div>
                    </div>
                )}

                <div className="mt-6 space-y-3">
                    {Object.keys(recommendationData).filter(k => k !== 'too_young').map(key => {
                        const stage = recommendationData[key];
                        const stageFoods = stage.foods.map(fname => allFoods.flatMap(c => c.items).find(f => f.name === fname)).filter(Boolean) as Food[];
                        const triedInStage = stageFoods.filter(f => triedFoodSet.has(f.name));
                        const toTryInStage = stageFoods.filter(f => !triedFoodSet.has(f.name));
                        
                        const content = (
                            <>
                                <p className="text-sm text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: stage.message }}></p>
                                {toTryInStage.length > 0 && (
                                    <>
                                        <h4 className="text-md font-medium text-green-700 mb-3">New Foods to Try:</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                                            {toTryInStage.map(food => (
                                                <FoodCard 
                                                    key={food.name} 
                                                    food={food} 
                                                    isTried={false} 
                                                    isAllergic={isFoodAllergic(food.name)}
                                                    onClick={() => onFoodClick(food)} 
                                                    onSubstitutesClick={() => onShowSubstitutes(food)}
                                                    baseColor={baseColor}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                                {triedInStage.length > 0 && (
                                     <>
                                        <h4 className="text-md font-medium text-gray-500 mt-6 mb-3">Foods Tried This Stage:</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                                            {triedInStage.map(food => (
                                                <FoodCard 
                                                    key={food.name} 
                                                    food={food} 
                                                    isTried={true} 
                                                    isAllergic={isFoodAllergic(food.name)}
                                                    onClick={() => onFoodClick(food)} 
                                                    onSubstitutesClick={() => onShowSubstitutes(food)}
                                                    baseColor={baseColor}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        );

                        return (
                            <Accordion 
                                key={key} 
                                title={`${stage.title} (${triedInStage.length}/${stageFoods.length} tried)`}
                                icon="star" 
                                defaultOpen={key === currentStageKey}
                                baseColor={baseColor}
                            >
                                {content}
                            </Accordion>
                        );
                    })}
                </div>
            </>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-gray-800">Food Recommendations</h2>
                {renderRecommendations()}
            </div>
        </div>
    );
};

export default RecommendationsPage;
