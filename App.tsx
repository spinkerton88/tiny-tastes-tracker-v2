
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import TrackerPage from './components/pages/TrackerPage';
import IdeasPage from './components/pages/IdeasPage';
import RecipesPage from './components/pages/RecipesPage';
import LearnPage from './components/pages/LearnPage';
import ProfilePage from './components/pages/LogPage';
import ToddlerPickyEater from './components/pages/ToddlerPickyEater';
import BalanceDashboard from './components/pages/BalanceDashboard';

import FoodLogModal from './components/modals/FoodLogModal';
import HowToServeModal from './components/modals/HowToServeModal';
import RecipeModal from './components/modals/RecipeModal';
import ViewRecipeModal from './components/modals/ViewRecipeModal';
import AiImportModal from './components/modals/AiImportModal';
import AiSuggestModal from './components/modals/AiSuggestModal';
import ShoppingListModal from './components/modals/ShoppingListModal';
import SelectRecipeModal from './components/modals/SelectRecipeModal';
import SubstitutesModal from './components/modals/SubstitutesModal';
import DoctorReportModal from './components/modals/DoctorReportModal';
import FlavorPairingModal from './components/modals/FlavorPairingModal';
import AllergenAlertModal from './components/modals/AllergenAlertModal';
import BadgeUnlockedModal from './components/modals/BadgeUnlockedModal';
import CertificateModal from './components/modals/CertificateModal';
import CustomFoodModal from './components/modals/CustomFoodModal';
import LogMealModal from './components/modals/LogMealModal';
import TutorialModal from './components/modals/TutorialModal';

import { useAppMode } from './hooks/useAppMode';
import { UserProfile, TriedFoodLog, Recipe, MealPlan, Milestone, ModalState, Food, CustomFood, FoodLogData, Badge, SavedStrategy } from './types';
import { DEFAULT_MILESTONES, BADGES_LIST } from './constants';

const App: React.FC = () => {
  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-profile');
      return saved ? JSON.parse(saved) : null;
  });
  const [triedFoods, setTriedFoods] = useState<TriedFoodLog[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-triedFoods');
      return saved ? JSON.parse(saved) : [];
  });
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-recipes');
      return saved ? JSON.parse(saved) : [];
  });
  const [mealPlan, setMealPlan] = useState<MealPlan>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-mealPlan');
      return saved ? JSON.parse(saved) : {};
  });
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-milestones');
      return saved ? JSON.parse(saved) : DEFAULT_MILESTONES;
  });
  const [customFoods, setCustomFoods] = useState<CustomFood[]>(() => {
    const saved = localStorage.getItem('tiny-tastes-tracker-customFoods');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Saved Strategies for Picky Eater
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-savedStrategies');
      return saved ? JSON.parse(saved) : [];
  });
  // Safe Foods for Picky Eater
  const [safeFoods, setSafeFoods] = useState<string[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-safeFoods');
      return saved ? JSON.parse(saved) : [];
  });

  const [currentPage, setCurrentPage] = useState('tracker');
  const [modalState, setModalState] = useState<ModalState>({ type: null });

  const { mode, config } = useAppMode(userProfile);

  // Persistence Effects
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-profile', JSON.stringify(userProfile)), [userProfile]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-triedFoods', JSON.stringify(triedFoods)), [triedFoods]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-recipes', JSON.stringify(recipes)), [recipes]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-mealPlan', JSON.stringify(mealPlan)), [mealPlan]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-milestones', JSON.stringify(milestones)), [milestones]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-customFoods', JSON.stringify(customFoods)), [customFoods]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-savedStrategies', JSON.stringify(savedStrategies)), [savedStrategies]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-safeFoods', JSON.stringify(safeFoods)), [safeFoods]);

  // Handle Mode Change redirects
  useEffect(() => {
    // If current page is not in the new mode's nav items, switch to the first item
    if (config && config.navItems.length > 0) {
        const itemExists = config.navItems.some(item => item.id === currentPage);
        if (!itemExists) {
            setCurrentPage(config.navItems[0].id);
        }
    }
  }, [mode, config]);


  // Actions
  const handleSaveProfile = (profile: UserProfile) => {
      setUserProfile(profile);
      setModalState({ type: null });
  };

  const handleResetData = () => {
      if (window.confirm("Are you sure? This will delete all data.")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const checkBadges = (currentTried: TriedFoodLog[]) => {
      const triedCount = new Set(currentTried.map(f => f.id)).size;
      const currentBadges = userProfile?.badges || BADGES_LIST;
      let newBadges: Badge[] = [...currentBadges];
      let unlockedBadge: Badge | null = null;

      // Check numeric badges
      const numericBadges = [10, 20, 30, 40, 50, 60, 70, 80, 90];
      numericBadges.forEach(num => {
          const badgeId = `tried_${num}`;
          const badgeIndex = newBadges.findIndex(b => b.id === badgeId);
          if (badgeIndex !== -1 && !newBadges[badgeIndex].isUnlocked && triedCount >= num) {
              newBadges[badgeIndex] = { ...newBadges[badgeIndex], isUnlocked: true, dateUnlocked: new Date().toISOString().split('T')[0] };
              unlockedBadge = newBadges[badgeIndex];
          }
      });
      
      // Check 100 Club
      if (triedCount >= 100) {
          const badgeId = '100_club';
          const badgeIndex = newBadges.findIndex(b => b.id === badgeId);
          if (badgeIndex !== -1 && !newBadges[badgeIndex].isUnlocked) {
               newBadges[badgeIndex] = { ...newBadges[badgeIndex], isUnlocked: true, dateUnlocked: new Date().toISOString().split('T')[0] };
               unlockedBadge = newBadges[badgeIndex];
          }
      }

      if (unlockedBadge) {
          setUserProfile(prev => prev ? { ...prev, badges: newBadges } : null);
          setModalState({ type: 'BADGE_UNLOCKED', badge: unlockedBadge });
      } else {
          setUserProfile(prev => prev ? { ...prev, badges: newBadges } : null);
      }
  };

  const handleSaveFoodLog = (foodName: string, data: FoodLogData) => {
      const newLog: TriedFoodLog = { id: foodName, ...data };
      const updatedTried = [...triedFoods.filter(f => !(f.id === foodName && f.date === data.date && f.meal === data.meal)), newLog];
      setTriedFoods(updatedTried);
      
      // Check for first time try
      const isFirstTime = !triedFoods.some(f => f.id === foodName);
      
      setModalState({ type: null });
      
      if (isFirstTime) {
          checkBadges(updatedTried);
          
          // Check for allergens
          // Note: Logic for checking allergens would go here using FOOD_ALLERGY_MAPPING
          // For now simplified.
          const customFood = customFoods.find(c => c.name === foodName);
          let allergens: string[] = [];
          if (customFood && customFood.details.allergen_info && customFood.details.allergen_info !== 'No common allergens') {
             allergens.push(customFood.details.allergen_info);
          }
          // Assuming common allergens check is done via helper or hardcoded list if needed
          
          if (allergens.length > 0) {
             setModalState({ type: 'ALLERGEN_ALERT', foodName, allergens });
          }
      }
  };

  const handleBatchLogMeal = (foodNames: string[], date: string, meal: string, photo?: string, notes?: string, foodStatuses?: Record<string, string>) => {
      const newLogs: TriedFoodLog[] = foodNames.map(name => {
          let reaction = 0; // 0 = no rating/neutral/eaten
          let moreThanOneBite = true;
          
          if (foodStatuses) {
              const status = foodStatuses[name];
              if (status === 'refused') {
                  reaction = 1; // 1 = Hated it / Refused
                  moreThanOneBite = false;
              } else if (status === 'touched') {
                  moreThanOneBite = false;
                  // Reaction remains 0 (neutral/no info)
              }
          }

          return {
              id: name,
              date,
              meal,
              reaction, 
              moreThanOneBite,
              allergyReaction: 'none',
              notes: notes || 'Batch logged from meal',
              tryCount: 1,
              messyFaceImage: photo
          };
      });
      
      // Filter out duplicates for same day/meal if exists, or append?
      // For simplicity, we append but could be smarter.
      const updatedTried = [...triedFoods, ...newLogs];
      setTriedFoods(updatedTried);
      checkBadges(updatedTried);
  };

  const handleCreateRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'rating'>) => {
      const newRecipe: Recipe = {
          ...recipeData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          rating: 0
      };
      setRecipes([...recipes, newRecipe]);
  };
  
  const handleUpdateRecipe = (id: string, updates: Partial<Recipe>) => {
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const saveMealToPlan = (date: string, meal: string, recipeId: string, recipeTitle: string) => {
      setMealPlan(prev => ({
          ...prev,
          [date]: {
              ...prev[date],
              [meal]: { id: recipeId, title: recipeTitle }
          }
      }));
      setModalState({ type: null });
  };
  
  // Picky Eater Handlers
  const handleSaveStrategy = (strategy: SavedStrategy) => {
      setSavedStrategies(prev => [...prev, strategy]);
  };
  
  const handleDeleteStrategy = (id: string) => {
      setSavedStrategies(prev => prev.filter(s => s.id !== id));
  };

  // Render Page Content
  const renderPage = () => {
      const baseColorName = config.themeColor.replace('bg-', '').replace('-600', '').replace('-500', '');

      switch (currentPage) {
          case 'tracker':
              return <TrackerPage 
                  triedFoods={triedFoods} 
                  customFoods={customFoods}
                  onFoodClick={(food) => setModalState({ type: 'LOG_FOOD', food })}
                  userProfile={userProfile}
                  onShowGuide={(food) => setModalState({ type: 'HOW_TO_SERVE', food, customDetails: (food as CustomFood).isCustom ? (food as CustomFood).details : undefined })}
                  onAddCustomFood={(initialName) => setModalState({ type: 'ADD_CUSTOM_FOOD', initialName })}
                  baseColor={baseColorName}
              />;
          case 'recommendations':
              return <IdeasPage 
                  userProfile={userProfile}
                  triedFoods={triedFoods}
                  onSaveProfile={setUserProfile}
                  onFoodClick={(food) => setModalState({ type: 'LOG_FOOD', food })}
                  onShowSubstitutes={(food) => setModalState({ type: 'SUBSTITUTES', food })}
                  onShowFlavorPairing={() => setModalState({ type: 'FLAVOR_PAIRING' })}
                  baseColor={baseColorName}
              />;
          case 'recipes':
              return <RecipesPage 
                  recipes={recipes}
                  mealPlan={mealPlan}
                  triedFoods={triedFoods}
                  customFoods={customFoods}
                  onShowAddRecipe={() => setModalState({ type: 'ADD_RECIPE' })}
                  onShowImportRecipe={() => setModalState({ type: 'IMPORT_RECIPE' })}
                  onShowSuggestRecipe={() => setModalState({ type: 'SUGGEST_RECIPE' })}
                  onViewRecipe={(recipe) => setModalState({ type: 'VIEW_RECIPE', recipe })}
                  onAddToPlan={(date, meal) => setModalState({ type: 'SELECT_RECIPE', date, meal })}
                  onShowShoppingList={() => setModalState({ type: 'SHOPPING_LIST' })}
                  onBatchLog={handleBatchLogMeal}
                  onCreateRecipe={handleCreateRecipe}
                  onFoodClick={(food) => setModalState({ type: 'LOG_FOOD', food })}
                  baseColor={baseColorName}
              />;
          case 'learn':
              return <LearnPage mode={mode} baseColor={baseColorName} />;
          case 'profile':
              return <ProfilePage 
                  userProfile={userProfile}
                  triedFoods={triedFoods}
                  milestones={milestones}
                  onSaveProfile={setUserProfile}
                  onResetData={handleResetData}
                  onShowDoctorReport={() => setModalState({ type: 'DOCTOR_REPORT' })}
                  onUpdateMilestone={(m) => setMilestones(prev => prev.map(mil => mil.id === m.id ? m : mil))}
                  onShowCertificate={() => setModalState({ type: 'CERTIFICATE', babyName: userProfile?.babyName || 'Baby', date: new Date().toLocaleDateString() })}
                  baseColor={baseColorName}
              />;
          case 'picky_eater':
              return <ToddlerPickyEater 
                  baseColor={baseColorName}
                  savedStrategies={savedStrategies}
                  onSaveStrategy={handleSaveStrategy}
                  onDeleteStrategy={handleDeleteStrategy}
                  safeFoods={safeFoods}
                  onUpdateSafeFoods={setSafeFoods}
              />;
          case 'balance':
              return <BalanceDashboard 
                  triedFoods={triedFoods}
                  baseColor={baseColorName}
              />;
          // Newborn placeholders
          case 'feed':
          case 'diapers':
          case 'growth':
              return (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                      <p>Feature coming soon for Newborn Mode!</p>
                  </div>
              );
          default:
              return <div className="p-4">Page not found</div>;
      }
  };

  // Render Modal
  const renderModal = () => {
      const baseColorName = config.themeColor.replace('bg-', '').replace('-600', '').replace('-500', '');

      switch (modalState.type) {
          case 'LOG_FOOD':
              const existingLog = triedFoods.find(l => l.id === modalState.food.name);
              return <FoodLogModal 
                  food={modalState.food} 
                  existingLog={existingLog}
                  onClose={() => setModalState({ type: null })}
                  onSave={handleSaveFoodLog}
                  onShowGuide={(food) => setModalState({ type: 'HOW_TO_SERVE', food, returnToLog: true })}
                  onIncrementTry={(foodName) => {
                       const log = triedFoods.find(f => f.id === foodName);
                       if (log) {
                           const updatedLog = { ...log, tryCount: (log.tryCount || 1) + 1 };
                           setTriedFoods(prev => prev.map(f => f.id === foodName ? updatedLog : f));
                       }
                  }}
                  baseColor={baseColorName}
              />;
          case 'HOW_TO_SERVE':
              return <HowToServeModal 
                  food={modalState.food} 
                  onClose={() => {
                      if (modalState.returnToLog) {
                          setModalState({ type: 'LOG_FOOD', food: modalState.food });
                      } else {
                          setModalState({ type: null });
                      }
                  }}
              />;
          case 'ADD_RECIPE':
              return <RecipeModal 
                  onClose={() => setModalState({ type: null })}
                  onSave={(recipe) => {
                      handleCreateRecipe(recipe);
                      setModalState({ type: null });
                  }}
                  initialData={modalState.recipeData}
              />;
          case 'VIEW_RECIPE':
              return <ViewRecipeModal 
                  recipe={modalState.recipe}
                  onClose={() => setModalState({ type: null })}
                  onDelete={(id) => {
                      setRecipes(prev => prev.filter(r => r.id !== id));
                      setModalState({ type: null });
                  }}
                  onUpdateRating={(id, rating) => handleUpdateRecipe(id, { rating })}
              />;
          case 'IMPORT_RECIPE':
              return <AiImportModal 
                  onClose={() => setModalState({ type: null })}
                  onRecipeParsed={(recipe) => setModalState({ type: 'ADD_RECIPE', recipeData: recipe })}
              />;
          case 'SUGGEST_RECIPE':
              return <AiSuggestModal
                  onClose={() => setModalState({ type: null })}
                  onRecipeParsed={(recipe) => setModalState({ type: 'ADD_RECIPE', recipeData: recipe })}
                  userProfile={userProfile}
              />;
          case 'SELECT_RECIPE':
              return <SelectRecipeModal 
                  recipes={recipes} 
                  meal={modalState.meal}
                  onClose={() => setModalState({ type: null })}
                  onSelect={(recipe) => saveMealToPlan(modalState.date, modalState.meal, recipe.id, recipe.title)}
              />;
          case 'SHOPPING_LIST':
              return <ShoppingListModal
                  recipes={recipes}
                  mealPlan={mealPlan}
                  triedFoods={triedFoods}
                  onClose={() => setModalState({ type: null })}
              />;
          case 'SUBSTITUTES':
              return <SubstitutesModal 
                  food={modalState.food}
                  userProfile={userProfile}
                  onClose={() => setModalState({ type: null })}
                  onSelectSubstitute={(food) => setModalState({ type: 'LOG_FOOD', food })}
              />;
          case 'DOCTOR_REPORT':
              return <DoctorReportModal 
                  userProfile={userProfile}
                  triedFoods={triedFoods}
                  onClose={() => setModalState({ type: null })}
              />;
          case 'FLAVOR_PAIRING':
              return <FlavorPairingModal
                  triedFoods={triedFoods}
                  onClose={() => setModalState({ type: null })}
              />;
          case 'ALLERGEN_ALERT':
              return <AllergenAlertModal 
                  foodName={modalState.foodName}
                  allergens={modalState.allergens}
                  onClose={() => setModalState({ type: null })}
              />;
          case 'BADGE_UNLOCKED':
              return <BadgeUnlockedModal 
                  badge={modalState.badge}
                  onClose={() => setModalState({ type: null })}
              />;
          case 'CERTIFICATE':
              return <CertificateModal
                  babyName={modalState.babyName}
                  date={modalState.date}
                  onClose={() => setModalState({ type: null })}
              />;
          case 'ADD_CUSTOM_FOOD':
              return <CustomFoodModal
                  initialName={modalState.initialName}
                  onClose={() => setModalState({ type: null })}
                  onSave={(food) => {
                      setCustomFoods(prev => [...prev, food]);
                      setModalState({ type: null });
                  }}
              />;
          case 'LOG_MEAL':
               return <LogMealModal
                  recipes={recipes}
                  onClose={() => setModalState({ type: null })}
                  onSave={handleBatchLogMeal}
                  onCreateRecipe={handleCreateRecipe}
                  baseColor={baseColorName}
               />;
          default:
              return null;
      }
  };

  return (
    <Layout 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        profile={userProfile} 
        progress={{ triedCount: new Set(triedFoods.map(f => f.id)).size, totalCount: 100 }}
        mode={mode}
        config={config}
    >
      {userProfile ? renderPage() : <TutorialModal onSave={handleSaveProfile} />}
      {renderModal()}
    </Layout>
  );
};

export default App;
