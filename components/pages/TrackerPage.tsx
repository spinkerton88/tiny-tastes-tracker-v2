import React, { useState } from 'react';
import { Food, TriedFoodLog, Filter, FoodCategory } from '../../types';
import { allFoods, totalFoodCount } from '../../constants';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';

interface TrackerPageProps {
  triedFoods: TriedFoodLog[];
  onFoodClick: (food: Food) => void;
}

const FoodCard: React.FC<{
  name: string;
  emoji: string;
  category: FoodCategory;
  isTried: boolean;
  onClick: () => void;
}> = ({ name, emoji, category, isTried, onClick }) => {
  const triedClass = isTried ? 'is-tried' : '';
  return (
    <button
      onClick={onClick}
      className={`food-card relative ${category.color} ${category.textColor} p-3 h-24 rounded-lg shadow-sm font-medium text-sm text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 border ${category.borderColor} ${triedClass}`}
      type="button"
    >
      <span className="text-3xl">{emoji}</span>
      <span className="mt-1 text-center leading-tight">{name}</span>
      <div className="check-overlay absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg pointer-events-none">
        <Icon name="check-circle-2" className="w-12 h-12 text-teal-600" />
      </div>
    </button>
  );
};

const FilterButton: React.FC<{ filter: Filter, currentFilter: Filter, onClick: (filter: Filter) => void, children: React.ReactNode }> = ({ filter, currentFilter, onClick, children }) => {
    const isActive = filter === currentFilter;
    const baseClasses = "filter-btn flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-150";
    const activeClasses = "bg-teal-600 text-white";
    const inactiveClasses = "bg-gray-200 text-gray-700 hover:bg-gray-300";

    return (
        <button onClick={() => onClick(filter)} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {children}
        </button>
    );
};

const CategoryProgress: React.FC<{ category: FoodCategory, triedCount: number }> = ({ category, triedCount }) => {
    const total = category.items.length;
    const percent = (triedCount / total) * 100;
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

const TrackerPage: React.FC<TrackerPageProps> = ({ triedFoods, onFoodClick }) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const triedFoodSet = new Set(triedFoods.map(f => f.id));
  const triedCount = triedFoods.length;
  const progressPercent = (triedCount / totalFoodCount) * 100;

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

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">My 100 Foods Tracker</h2>

      <div className="mb-4 relative sticky top-0 z-20">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon name="search" className="h-5 w-5 text-gray-400" />
          </div>
          <input
              type="text"
              placeholder="Search foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition duration-150 ease-in-out shadow-sm"
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

      <div className="flex space-x-2 mb-4">
        <FilterButton filter="all" currentFilter={filter} onClick={setFilter}>All</FilterButton>
        <FilterButton filter="to_try" currentFilter={filter} onClick={setFilter}>To Try</FilterButton>
        <FilterButton filter="tried" currentFilter={filter} onClick={setFilter}>Tried</FilterButton>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-semibold text-teal-700">Food Journey Progress</span>
          <span className="text-lg font-bold text-teal-700">{triedCount} / {totalFoodCount}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div className="bg-teal-600 h-4 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Breakdown by Category</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                {allFoods.map(cat => {
                    const catTriedCount = cat.items.filter(item => triedFoodSet.has(item.name)).length;
                    return <CategoryProgress key={cat.category} category={cat} triedCount={catTriedCount} />;
                })}
            </div>
        </div>
      </div>

      {filteredCategories.length > 0 ? (
        filteredCategories.map(category => (
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
                  onClick={() => onFoodClick(food)}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <EmptyState
            illustration={<NoResultsIllustration />}
            title="No Foods Found"
            message="There are no foods that match your current filter or search selection."
        />
      )}
    </>
  );
};

export default TrackerPage;