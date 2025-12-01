
import React, { useState, useRef } from 'react';
import { Food, TriedFoodLog, Filter, FoodCategory, UserProfile, CustomFood } from '../../types';
import { allFoods, totalFoodCount, FOOD_ALLERGY_MAPPING, FOOD_NUTRIENT_MAPPING, NUTRIENT_STYLES } from '../../constants';
import { identifyFoodFromImage } from '../../services/geminiService';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';

interface TrackerPageProps {
  triedFoods: TriedFoodLog[];
  customFoods?: CustomFood[];
  onFoodClick: (food: Food) => void;
  userProfile?: UserProfile | null;
  onShowGuide: (food: Food) => void;
  onAddCustomFood?: (initialName: string) => void;
  onScanBarcode?: () => void;
  baseColor?: string;
}

const FoodCard: React.FC<{
  name: string;
  emoji: string;
  category: FoodCategory;
  isTried: boolean;
  isAllergic: boolean;
  isCustom?: boolean;
  onClick: () => void;
  onInfoClick: (e: React.MouseEvent) => void;
  baseColor: string;
}> = ({ name, emoji, category, isTried, isAllergic, isCustom, onClick, onInfoClick, baseColor }) => {
  const triedClass = isTried ? 'is-tried' : '';
  const nutrients = FOOD_NUTRIENT_MAPPING[name] || [];
  
  return (
    <div 
        className={`food-card relative group ${category.color} ${category.textColor} h-auto min-h-[8rem] rounded-lg shadow-sm border ${category.borderColor} ${triedClass} transition-all duration-200 hover:shadow-md hover:scale-105`}
    >
      {/* Main Action - Covers the whole card */}
      <button
        onClick={onClick}
        className="w-full h-full p-3 flex flex-col items-center justify-start cursor-pointer focus:outline-none rounded-lg"
        type="button"
      >
        <span className="text-3xl mb-1 mt-1">{emoji}</span>
        <span className="text-sm font-medium text-center leading-tight line-clamp-2">{name}</span>
        
        {/* Nutrient Highlights */}
        <div className="flex flex-wrap justify-center gap-1 mt-2">
            {nutrients.slice(0, 3).map(n => {
                const style = NUTRIENT_STYLES[n] || { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200", icon: "star", label: n };
                return (
                    <span 
                        key={n} 
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border bg-white/80 backdrop-blur-sm ${style.text} ${style.border}`}
                    >
                       {style.label}
                    </span>
                );
            })}
            {isCustom && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border bg-white/80 backdrop-blur-sm bg-violet-50 text-violet-700 border-violet-200">
                    Custom
                </span>
            )}
        </div>
      </button>
      
      {/* Allergy Warning - Top Left */}
      {isAllergic && !isTried && (
        <div className="absolute top-1 left-1 bg-white rounded-full p-0.5 shadow-sm z-10" title="Contains known allergen">
             <Icon name="alert-triangle" className="w-4 h-4 text-red-500 fill-red-50" />
        </div>
      )}

      {/* Guide/Info Button - Top Right */}
      <button
        onClick={(e) => {
            e.stopPropagation();
            onInfoClick(e);
        }}
        className={`absolute top-1 right-1 p-1.5 rounded-full bg-white/60 hover:bg-white text-${baseColor}-700 shadow-sm transition-colors opacity-80 hover:opacity-100 z-10`}
        title="How to Serve Guide"
      >
         <Icon name="chef-hat" className="w-3.5 h-3.5" />
      </button>

      {/* Check Overlay for Tried Foods */}
      <div className="check-overlay absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg pointer-events-none z-0">
        <Icon name="check-circle-2" className={`w-12 h-12 text-${baseColor}-600`} />
      </div>
    </div>
  );
};

const FilterButton: React.FC<{ filter: Filter, currentFilter: Filter, onClick: (filter: Filter) => void, children: React.ReactNode, baseColor: string }> = ({ filter, currentFilter, onClick, children, baseColor }) => {
    const isActive = filter === currentFilter;
    const baseClasses = "filter-btn flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-150";
    const activeClasses = `bg-${baseColor}-600 text-white`;
    const inactiveClasses = "bg-gray-200 text-gray-700 hover:bg-gray-300";

    return (
        <button onClick={() => onClick(filter)} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {children}
        </button>
    );
};

const CategoryProgress: React.FC<{ category: FoodCategory, triedCount: number }> = ({ category, triedCount }) => {
    const total = category.items.length;
    const percent = total > 0 ? (triedCount / total) * 100 : 0;
    // Extract the base color name (e.g., 'green', 'red') from the tailwind class 'bg-green-100'
    const colorName = category.color.replace('bg-', '').replace('-100', '');
    const barColor = `bg-${colorName}-500`; 
    
    return (
        <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
                <span className={`font-medium ${category.textColor}`}>{category.category}</span>
                <span className="text-gray-500">{triedCount}/{total}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
};


const NoResultsIllustration = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 25 20 H 75 V 80 H 25 Z" strokeDasharray="5 5" rx="5" />
        <circle cx="50" cy="50" r="15" strokeWidth="2.5"/>
        <line x1="62" y1="62" x2="75" y2="75" strokeWidth="2.5"/>
        <line x1="40" y1="60" x2="60" y2="40" strokeWidth="1.5" />
    </svg>
);

const TrackerPage: React.FC<TrackerPageProps> = ({ triedFoods, customFoods = [], onFoodClick, userProfile, onShowGuide, onAddCustomFood, onScanBarcode, baseColor = 'teal' }) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isRecentOpen, setIsRecentOpen] = useState(true);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triedFoodSet = new Set(triedFoods.map(f => f.id));
  const triedCount = triedFoods.length;
  const progressPercent = (triedCount / totalFoodCount) * 100;
  
  const knownAllergens = Array.isArray(userProfile?.knownAllergies) ? userProfile?.knownAllergies : [];

  // Filter Custom Foods separately
  const filteredCustomFoods = customFoods.filter(food => {
      const isTried = triedFoodSet.has(food.name);
      
      if (searchQuery && !food.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
      }

      if (filter === 'all') return true;
      if (filter === 'to_try') return !isTried;
      if (filter === 'tried') return isTried;
      return false;
  });

  // Filter Standard Categories
  const filteredCategories = allFoods.map(category => {
      const items = category.items.filter(food => {
          const isTried = triedFoodSet.has(food.name);
          
          if (searchQuery && !food.name.toLowerCase().includes(searchQuery.toLowerCase())) {
              return false;
          }

          if (filter === 'all') return true;
          if (filter === 'to_try') return !isTried;
          if (filter === 'tried') return isTried;
          return false;
      });
      return { ...category, items };
  }).filter(category => category.items.length > 0);

  const hasResults = filteredCategories.length > 0 || filteredCustomFoods.length > 0;

  const isFoodAllergic = (foodName: string) => {
      const foodAllergens = FOOD_ALLERGY_MAPPING[foodName];
      if (!foodAllergens) return false;
      return foodAllergens.some(allergen => knownAllergens.includes(allergen));
  };
  
  // Logic for Recently Tried
  const recentLogs = [...triedFoods]
    .sort((a, b) => {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        return dateB - dateA;
    })
    .slice(0, 5);

  const handleCameraClick = () => {
      fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsIdentifying(true);
      try {
          const identifiedFoodName = await identifyFoodFromImage(file);
          
          if (identifiedFoodName) {
              // Find the food object in our list
              let foundFood: Food | undefined;
              
              // Check standard foods
              for (const cat of allFoods) {
                  const match = cat.items.find(item => item.name === identifiedFoodName);
                  if (match) {
                      foundFood = match;
                      break;
                  }
              }
              // Check custom foods
              if (!foundFood) {
                  foundFood = customFoods.find(f => f.name === identifiedFoodName);
              }

              if (foundFood) {
                  onFoodClick(foundFood);
              } else {
                  alert(`AI identified this as "${identifiedFoodName}", but it's not in our tracked 100 foods list yet.`);
              }
          } else {
              alert("Could not identify a tracked food in this image. Try taking a closer photo.");
          }
      } catch (error) {
          console.error(error);
          alert("Error analyzing image.");
      } finally {
          setIsIdentifying(false);
          // Reset input
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  // Styling for Custom Food Cards
  const customCategoryStyle: FoodCategory = {
      category: "Custom",
      color: "bg-white",
      textColor: "text-violet-800",
      borderColor: "border-violet-200",
      items: []
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">My 100 Foods</h2>
        {/* Hidden File Input */}
        <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            capture="environment"
        />
      </div>

      <div className="mb-4 flex gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="search" className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                placeholder="Search foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-${baseColor}-500 focus:border-${baseColor}-500 sm:text-sm transition duration-150 ease-in-out shadow-sm`}
            />
            {searchQuery && (
                <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                    <Icon name="x" className="h-4 w-4" />
                </button>
            )}
          </div>
          
          {onScanBarcode && (
            <button 
                onClick={onScanBarcode}
                className="flex-shrink-0 bg-indigo-600 text-white p-2 rounded-md shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1 min-w-[2.5rem]"
                title="Scan Barcode"
            >
                <Icon name="scan-barcode" className="h-5 w-5" />
            </button>
          )}

          {onAddCustomFood && (
            <button 
                onClick={() => onAddCustomFood('')}
                className="flex-shrink-0 bg-violet-600 text-white p-2 rounded-md shadow-sm hover:bg-violet-700 transition-colors flex items-center justify-center gap-1 min-w-[2.5rem]"
                title="Add Custom Food"
            >
                <Icon name="plus" className="h-5 w-5" />
            </button>
          )}

          <button 
            onClick={handleCameraClick}
            disabled={isIdentifying}
            className={`flex-shrink-0 bg-${baseColor}-600 text-white p-2 rounded-md shadow-sm hover:bg-${baseColor}-700 disabled:opacity-50 transition-colors`}
            title="Identify food from photo"
          >
              {isIdentifying ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                  <Icon name="camera" className="h-5 w-5" />
              )}
          </button>
      </div>

      {/* Recently Tried Section */}
      {recentLogs.length > 0 && !searchQuery && filter !== 'to_try' && (
        <div className="mb-6">
             <button 
                onClick={() => setIsRecentOpen(!isRecentOpen)}
                className="flex items-center justify-between w-full text-left mb-3 group focus:outline-none bg-gray-50 p-2 rounded-md hover:bg-gray-100 transition-colors border border-gray-100"
             >
                <div className="flex items-center gap-2">
                    <Icon name="clock" className={`w-4 h-4 text-${baseColor}-600`} />
                    <h3 className={`text-sm font-semibold text-gray-700 uppercase tracking-wider group-hover:text-${baseColor}-700`}>Recently Tried</h3>
                </div>
                <Icon name="chevron-down" className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${isRecentOpen ? 'rotate-180' : ''}`} />
             </button>
             
             <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isRecentOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pt-1">
                    {recentLogs.map(log => {
                        let foundCategory: FoodCategory | undefined;
                        let foundFood: Food | undefined;

                        // Check standard categories
                        for (const cat of allFoods) {
                            const f = cat.items.find(i => i.name === log.id);
                            if (f) {
                                foundFood = f;
                                foundCategory = cat;
                                break;
                            }
                        }
                        
                        // Check Custom foods if not found
                        if (!foundFood) {
                            foundFood = customFoods.find(f => f.name === log.id);
                            if (foundFood) {
                                foundCategory = customCategoryStyle;
                            }
                        }

                        if (!foundFood || !foundCategory) return null;

                        return (
                            <FoodCard
                                key={`recent-${log.id}`}
                                name={foundFood.name}
                                emoji={foundFood.emoji}
                                category={foundCategory}
                                isTried={true}
                                isAllergic={isFoodAllergic(foundFood.name)}
                                isCustom={(foundFood as CustomFood).isCustom}
                                onClick={() => onFoodClick(foundFood!)}
                                onInfoClick={(e) => { e.stopPropagation(); onShowGuide(foundFood!); }}
                                baseColor={baseColor}
                            />
                        );
                    })}
                </div>
             </div>
        </div>
      )}

      <div className="flex space-x-2 mb-4">
        <FilterButton filter="all" currentFilter={filter} onClick={setFilter} baseColor={baseColor}>All</FilterButton>
        <FilterButton filter="to_try" currentFilter={filter} onClick={setFilter} baseColor={baseColor}>To Try</FilterButton>
        <FilterButton filter="tried" currentFilter={filter} onClick={setFilter} baseColor={baseColor}>Tried</FilterButton>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-lg font-semibold text-${baseColor}-700`}>Food Journey Progress</span>
          <span className={`text-lg font-bold text-${baseColor}-700`}>{triedCount} / {totalFoodCount + customFoods.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div className={`bg-${baseColor}-600 h-4 rounded-full transition-all duration-500`} style={{ width: `${progressPercent}%` }}></div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100">
             <button 
                onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
                className="flex items-center justify-between w-full text-left group focus:outline-none"
            >
                <h4 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-${baseColor}-600 transition-colors`}>Breakdown by Category</h4>
                <Icon name="chevron-down" className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${isBreakdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 transition-all duration-300 ease-in-out overflow-hidden ${isBreakdownOpen ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                {/* Standard Categories */}
                {allFoods.map(cat => {
                    const catTriedCount = cat.items.filter(item => triedFoodSet.has(item.name)).length;
                    return <CategoryProgress key={cat.category} category={cat} triedCount={catTriedCount} />;
                })}
                {/* Custom Category Summary */}
                {customFoods.length > 0 && (
                    <CategoryProgress 
                        category={customCategoryStyle}
                        triedCount={customFoods.filter(f => triedFoodSet.has(f.name)).length} 
                    />
                )}
            </div>
        </div>
      </div>

      {hasResults ? (
        <>
            {/* Standard Categories */}
            {filteredCategories.map(category => (
                <div key={category.category}>
                    <h2 className={`text-2xl font-semibold ${category.textColor} mt-8 mb-4`}>{category.category}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                    {category.items.map(food => (
                        <FoodCard
                        key={food.name}
                        name={food.name}
                        emoji={food.emoji}
                        category={category}
                        isTried={triedFoodSet.has(food.name)}
                        isAllergic={isFoodAllergic(food.name)}
                        isCustom={false}
                        onClick={() => onFoodClick(food)}
                        onInfoClick={(e) => { e.stopPropagation(); onShowGuide(food); }}
                        baseColor={baseColor}
                        />
                    ))}
                    </div>
                </div>
            ))}
        </>
      ) : (
        <EmptyState
            illustration={<NoResultsIllustration />}
            title="No Foods Found"
            message={`We couldn't find "${searchQuery}" in our database.`}
        >
            {searchQuery && onAddCustomFood && (
                <div className="mt-4">
                    <button 
                        onClick={() => onAddCustomFood(searchQuery)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-md shadow-md hover:bg-violet-700 transition-colors font-semibold"
                    >
                        <Icon name="plus-circle" className="w-4 h-4" />
                        Add "{searchQuery}" Manually
                    </button>
                    <p className="text-xs text-gray-500 mt-2">We'll use AI to generate safety & serving info!</p>
                </div>
            )}
        </EmptyState>
      )}
    </>
  );
};

export default TrackerPage;
