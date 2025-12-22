
import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Layout from './components/Layout';
import TrackerPage from './components/pages/TrackerPage';
import IdeasPage from './components/pages/IdeasPage';
import RecipesPage from './components/pages/RecipesPage';
import LearnPage from './components/pages/LearnPage';
import ProfilePage from './components/pages/LogPage';
import ToddlerPickyEater from './components/pages/ToddlerPickyEater';
import BalanceDashboard from './components/pages/BalanceDashboard';
import NewbornPage from './components/pages/NewbornPage';
import ToddlerGrowthPage from './components/pages/ToddlerGrowthPage';

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
import AddChildModal from './components/modals/AddChildModal';
import { LiveSageModal } from './components/modals/LiveSageModal';

import { useAppMode } from './hooks/useAppMode';
import { useLocalStorage } from './hooks/useLocalStorage';
import { UserProfile, TriedFoodLog, Recipe, MealPlan, Milestone, ModalState, Food, CustomFood, FoodLogData, Badge, SavedStrategy, LoggedItemData, ManualShoppingItem, FeedLog, DiaperLog, SleepLog, MedicineLog, GrowthLog } from './types';
import { DEFAULT_MILESTONES, BADGES_LIST, flatFoodList } from './constants';
import { fetchProductIngredients } from './services/openFoodFactsService';

const BarcodeScannerModal = React.lazy(() => import('./components/modals/BarcodeScannerModal'));

const App: React.FC = () => {
  // Profiles has custom migration logic, so we keep the initializer but use the hook for persistence
  const [profiles, setProfiles] = useLocalStorage<UserProfile[]>('tiny-tastes-tracker-profiles', []);
  
  // Handle legacy profile migration only once on mount if profiles are empty
  useEffect(() => {
      if (profiles.length === 0) {
          const legacyProfile = localStorage.getItem('tiny-tastes-tracker-profile');
          if (legacyProfile) {
              try {
                  const parsed = JSON.parse(legacyProfile);
                  if (!parsed.id) parsed.id = crypto.randomUUID();
                  setProfiles([parsed]);
              } catch (e) {
                  console.error("Failed to migrate legacy profile", e);
              }
          }
      }
  }, []);

  const [activeChildId, setActiveChildId] = useLocalStorage<string>('tiny-tastes-tracker-activeChildId', '');

  // Initialize activeChildId if empty and profiles exist
  useEffect(() => {
      if (!activeChildId && profiles.length > 0) {
          setActiveChildId(profiles[0].id);
      }
  }, [profiles, activeChildId, setActiveChildId]);

  const userProfile = useMemo(() => profiles.find(p => p.id === activeChildId) || null, [profiles, activeChildId]);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Trigger onboarding if no profiles exist (after initial load attempt)
  useEffect(() => {
      if (profiles.length === 0) {
          // Check if we just tried to migrate and failed, or if it's truly a fresh user
          const legacy = localStorage.getItem('tiny-tastes-tracker-profile');
          if (!legacy) setIsOnboarding(true);
      }
  }, [profiles.length]);

  // Consolidate all data state using the custom hook
  const [triedFoods, setTriedFoods] = useLocalStorage<TriedFoodLog[]>('tiny-tastes-tracker-triedFoods', []);
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('tiny-tastes-tracker-recipes', []);
  const [mealPlan, setMealPlan] = useLocalStorage<MealPlan>('tiny-tastes-tracker-mealPlan', {});
  const [customFoods, setCustomFoods] = useLocalStorage<CustomFood[]>('tiny-tastes-tracker-customFoods', []);
  const [allMilestones, setAllMilestones] = useLocalStorage<Milestone[]>('tiny-tastes-tracker-milestones', DEFAULT_MILESTONES);
  const [savedStrategies, setSavedStrategies] = useLocalStorage<SavedStrategy[]>('tiny-tastes-tracker-savedStrategies', []);
  const [manualShoppingItems, setManualShoppingItems] = useLocalStorage<ManualShoppingItem[]>('tiny-tastes-tracker-manualShopping', []);
  const [shoppingCheckedItems, setShoppingCheckedItems] = useLocalStorage<Record<string, string>>('tiny-tastes-tracker-shoppingChecked', {});
  
  // Newborn Mode Data
  const [feedLogs, setFeedLogs] = useLocalStorage<FeedLog[]>('tiny-tastes-tracker-feedLogs', []);
  const [diaperLogs, setDiaperLogs] = useLocalStorage<DiaperLog[]>('tiny-tastes-tracker-diaperLogs', []);
  const [sleepLogs, setSleepLogs] = useLocalStorage<SleepLog[]>('tiny-tastes-tracker-sleepLogs', []);
  const [medicineLogs, setMedicineLogs] = useLocalStorage<MedicineLog[]>('tiny-tastes-tracker-medicineLogs', []);
  const [growthLogs, setGrowthLogs] = useLocalStorage<GrowthLog[]>('tiny-tastes-tracker-growthLogs', []);

  const [currentPage, setCurrentPage] = useState('tracker');
  const [modalState, setModalState] = useState<ModalState>({ type: null });

  const filterByChild = <T extends { childId?: string }>(logs: T[]) => {
      if (!activeChildId) return [];
      return logs.filter(log => {
          if (log.childId) return log.childId === activeChildId;
          return profiles.length > 0 && profiles[0].id === activeChildId;
      });
  };

  const activeTriedFoods = useMemo(() => filterByChild(triedFoods), [triedFoods, activeChildId, profiles]);
  const activeFeedLogs = useMemo(() => filterByChild(feedLogs), [feedLogs, activeChildId, profiles]);
  const activeDiaperLogs = useMemo(() => filterByChild(diaperLogs), [diaperLogs, activeChildId, profiles]);
  const activeSleepLogs = useMemo(() => filterByChild(sleepLogs), [sleepLogs, activeChildId, profiles]);
  const activeMedicineLogs = useMemo(() => filterByChild(medicineLogs), [medicineLogs, activeChildId, profiles]);
  const activeGrowthLogs = useMemo(() => filterByChild(growthLogs), [growthLogs, activeChildId, profiles]);
  const activeSavedStrategies = useMemo(() => filterByChild(savedStrategies), [savedStrategies, activeChildId, profiles]);
  
  const activeMilestones = useMemo(() => {
      if (!activeChildId) return DEFAULT_MILESTONES;
      const childMilestones = allMilestones.filter(m => m.childId === activeChildId);
      if (childMilestones.length === 0 && activeChildId !== (profiles[0]?.id)) {
          return DEFAULT_MILESTONES.map(m => ({ ...m, childId: activeChildId }));
      }
      if (childMilestones.length === 0 && profiles.length > 0 && activeChildId === profiles[0].id) {
          return allMilestones.filter(m => !m.childId);
      }
      return childMilestones.length > 0 ? childMilestones : DEFAULT_MILESTONES.map(m => ({...m, childId: activeChildId}));
  }, [allMilestones, activeChildId, profiles]);

  const { mode, config } = useAppMode(userProfile);

  useEffect(() => {
    if (config && config.navItems.length > 0) {
        const itemExists = config.navItems.some(item => item.id === currentPage);
        if (!itemExists) setCurrentPage(config.navItems[0].id);
    }
  }, [mode, config]);

  const handleCreateChild = (child: UserProfile) => {
      setProfiles(prev => [...prev, child]);
      setActiveChildId(child.id);
      setModalState({ type: null });
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
      setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
      setModalState({ type: null });
  };

  const handleResetData = () => {
      if (window.confirm("Are you sure? This will delete ALL data for ALL children.")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const checkBadges = (currentTried: TriedFoodLog[]) => {
      const triedCount = new Set(currentTried.map(f => f.id)).size;
      const currentBadges = userProfile?.badges || BADGES_LIST;
      let newBadges: Badge[] = [...currentBadges];
      let unlockedBadge: Badge | null = null;
      const numericBadges = [10, 20, 30, 40, 50, 60, 70, 80, 90];
      numericBadges.forEach(num => {
          const badgeId = `tried_${num}`;
          const badgeIndex = newBadges.findIndex(b => b.id === badgeId);
          if (badgeIndex !== -1 && !newBadges[badgeIndex].isUnlocked && triedCount >= num) {
              newBadges[badgeIndex] = { ...newBadges[badgeIndex], isUnlocked: true, dateUnlocked: new Date().toISOString().split('T')[0] };
              unlockedBadge = newBadges[badgeIndex];
          }
      });
      if (triedCount >= 100) {
          const badgeId = '100_club';
          const badgeIndex = newBadges.findIndex(b => b.id === badgeId);
          if (badgeIndex !== -1 && !newBadges[badgeIndex].isUnlocked) {
               newBadges[badgeIndex] = { ...newBadges[badgeIndex], isUnlocked: true, dateUnlocked: new Date().toISOString().split('T')[0] };
               unlockedBadge = newBadges[badgeIndex];
          }
      }
      if (unlockedBadge && userProfile) {
          handleUpdateProfile({ ...userProfile, badges: newBadges });
          setModalState({ type: 'BADGE_UNLOCKED', badge: unlockedBadge });
      } else if (userProfile) {
          handleUpdateProfile({ ...userProfile, badges: newBadges });
      }
  };

  const handleSaveFoodLog = (foodName: string, data: FoodLogData) => {
      if (!activeChildId) return;
      const newLog: TriedFoodLog = { id: foodName, childId: activeChildId, ...data };
      const updatedTried = [...triedFoods.filter(f => !(f.childId === activeChildId && f.id === foodName && f.date === data.date && f.meal === data.meal)), newLog];
      setTriedFoods(updatedTried);
      const isFirstTimeForChild = !activeTriedFoods.some(f => f.id === foodName);
      setModalState({ type: null });
      if (isFirstTimeForChild) {
          checkBadges(updatedTried.filter(f => f.childId === activeChildId));
          const customFood = customFoods.find(c => c.name === foodName);
          let allergens: string[] = [];
          if (customFood && customFood.details.allergen_info && customFood.details.allergen_info !== 'No common allergens') {
             allergens.push(customFood.details.allergen_info);
          }
          if (allergens.length > 0) setModalState({ type: 'ALLERGEN_ALERT', foodName, allergens });
      }
  };

  const handleBatchLogMeal = (items: LoggedItemData[], date: string, meal: string, photo?: string, notes?: string, strategy?: string) => {
      if (!activeChildId) return;
      const newLogs: TriedFoodLog[] = items.map(item => {
          let reaction = 6; 
          let moreThanOneBite = true;
          if (item.status === 'refused') { reaction = 1; moreThanOneBite = false; } 
          else if (item.status === 'touched') { reaction = 3; moreThanOneBite = false; }
          return { id: item.food, childId: activeChildId, date, meal, reaction, moreThanOneBite, allergyReaction: 'none', notes: notes || '', tryCount: 1, messyFaceImage: photo, behavioralTags: item.behavioralTags, portion: item.portion, consumption: item.consumption, usedStrategy: strategy };
      });
      const updatedTried = [...triedFoods, ...newLogs];
      setTriedFoods(updatedTried);
      checkBadges(updatedTried.filter(f => f.childId === activeChildId));
  };

  const handleUpdateBatchLog = (originalDate: string, originalMeal: string, items: LoggedItemData[], newDate: string, newMeal: string, photo?: string, notes?: string, strategy?: string) => {
      if (!activeChildId) return;
      const filteredTried = triedFoods.filter(f => !(f.childId === activeChildId && f.date === originalDate && f.meal === originalMeal));
      const newLogs: TriedFoodLog[] = items.map(item => {
          let reaction = 6; let moreThanOneBite = true;
          if (item.status === 'refused' || item.consumption === 'none') { reaction = 1; moreThanOneBite = false; } 
          else if (item.status === 'touched' || item.consumption === 'some') { reaction = 3; moreThanOneBite = false; }
          return { id: item.food, childId: activeChildId, date: newDate, meal: newMeal, reaction, moreThanOneBite, allergyReaction: 'none', notes: notes || '', tryCount: 1, messyFaceImage: photo, behavioralTags: item.behavioralTags, portion: item.portion, consumption: item.consumption, usedStrategy: strategy };
      });
      setTriedFoods([...filteredTried, ...newLogs]);
  };

  const handleBarcodeScan = async (barcode: string) => {
      setModalState({ type: null });
      try {
          const product = await fetchProductIngredients(barcode);
          if (!product) { alert(`Product not found or error fetching details.`); return; }
          if (product.matchedFoods.length === 1 && product.productName.toLowerCase().includes(product.matchedFoods[0].toLowerCase())) {
              setModalState({ type: 'LOG_MEAL', initialFoods: product.matchedFoods });
          } else {
              setModalState({ type: 'ADD_CUSTOM_FOOD', scannedData: { name: product.productName, brand: product.brand, ingredientsText: product.ingredientsText, image: product.imageUrl } });
          }
      } catch (error) { console.error(error); alert("Error looking up barcode. Please try again."); }
  };

  const handleCreateRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'rating'>) => {
      const newRecipe: Recipe = { ...recipeData, id: crypto.randomUUID(), createdAt: new Date().toISOString(), rating: 0 };
      setRecipes([...recipes, newRecipe]);
  };
  
  const handleUpdateRecipe = (id: string, updates: Partial<Recipe>) => setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  const handleDeleteRecipe = (id: string) => setRecipes(prev => prev.filter(r => r.id !== id));
  const handleDeleteCustomFood = (name: string) => { if (window.confirm(`Are you sure you want to delete "${name}"?`)) setCustomFoods(prev => prev.filter(f => f.name !== name)); };
  const saveMealToPlan = (date: string, meal: string, recipeId: string, recipeTitle: string) => { setMealPlan(prev => ({ ...prev, [date]: { ...prev[date], [meal]: { id: recipeId, title: recipeTitle } } })); setModalState({ type: null }); };
  const removeMealFromPlan = (date: string, meal: string) => setMealPlan(prev => { const newPlan = { ...prev }; if (newPlan[date]) { delete newPlan[date][meal]; if (Object.keys(newPlan[date]).length === 0) delete newPlan[date]; } return newPlan; });
  const handleSaveStrategy = (strategy: SavedStrategy) => setSavedStrategies(prev => [...prev, { ...strategy, childId: activeChildId }]);
  const handleDeleteStrategy = (id: string) => setSavedStrategies(prev => prev.filter(s => s.id !== id));
  const handleUpdateSafeFoods = (foods: string[]) => { if (userProfile) handleUpdateProfile({ ...userProfile, safeFoods: foods }); };
  const handleAddManualItem = (name: string) => setManualShoppingItems(prev => [...prev, { id: crypto.randomUUID(), name, addedAt: new Date().toISOString() }]);
  const handleToggleShoppingItem = (name: string, isChecked: boolean) => setShoppingCheckedItems(prev => { const next = { ...prev }; if (isChecked) next[name] = new Date().toISOString(); else delete next[name]; return next; });
  const handleClearCheckedItems = () => { if (window.confirm("Clear all checked items?")) { setManualShoppingItems(prev => prev.filter(item => !shoppingCheckedItems[item.name])); setShoppingCheckedItems({}); } };
  const handleLogFeed = (feed: FeedLog) => setFeedLogs(prev => [{...feed, childId: activeChildId}, ...prev]);
  const handleLogDiaper = (diaper: DiaperLog) => setDiaperLogs(prev => [{...diaper, childId: activeChildId}, ...prev]);
  const handleLogSleep = (sleep: SleepLog) => setSleepLogs(prev => [{...sleep, childId: activeChildId}, ...prev]);
  const handleUpdateSleepLog = (updatedLog: SleepLog) => setSleepLogs(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));
  const handleLogMedicine = (med: MedicineLog) => setMedicineLogs(prev => [{...med, childId: activeChildId}, ...prev]);
  const handleLogGrowth = (log: GrowthLog) => setGrowthLogs(prev => [{...log, childId: activeChildId}, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  const handleDeleteGrowth = (id: string) => setGrowthLogs(prev => prev.filter(l => l.id !== id));
  const handleUpdateMilestone = (m: Milestone) => setAllMilestones(prev => { const mWithId = { ...m, childId: activeChildId }; const others = prev.filter(p => !(p.id === m.id && (p.childId === activeChildId || (!p.childId && activeChildId === profiles[0]?.id)))); return [...others, mWithId]; });

  const renderPage = () => {
      const baseColorName = config.themeColor.replace('bg-', '').replace('-600', '').replace('-500', '');
      switch (currentPage) {
          case 'tracker':
              return <TrackerPage triedFoods={activeTriedFoods} customFoods={customFoods} onFoodClick={(food) => setModalState({ type: 'LOG_FOOD', food })} userProfile={userProfile} onShowGuide={(food) => setModalState({ type: 'HOW_TO_SERVE', food, customDetails: (food as CustomFood).isCustom ? (food as CustomFood).details : undefined })} onAddCustomFood={(initialName) => setModalState({ type: 'ADD_CUSTOM_FOOD', initialName })} onScanBarcode={mode === 'TODDLER' ? () => setModalState({ type: 'SCAN_BARCODE' }) : undefined} baseColor={baseColorName} />;
          case 'recommendations':
              return <IdeasPage userProfile={userProfile} triedFoods={activeTriedFoods} onSaveProfile={handleUpdateProfile} onFoodClick={(food) => setModalState({ type: 'LOG_FOOD', food })} onShowSubstitutes={(food) => setModalState({ type: 'SUBSTITUTES', food })} onShowFlavorPairing={() => setModalState({ type: 'FLAVOR_PAIRING' })} baseColor={baseColorName} />;
          case 'recipes':
              return <RecipesPage recipes={recipes} mealPlan={mealPlan} triedFoods={activeTriedFoods} customFoods={customFoods} savedStrategies={activeSavedStrategies} manualShoppingItems={manualShoppingItems} shoppingCheckedItems={shoppingCheckedItems} onShowAddRecipe={() => setModalState({ type: 'ADD_RECIPE' })} onShowImportRecipe={() => setModalState({ type: 'IMPORT_RECIPE' })} onShowSuggestRecipe={() => setModalState({ type: 'SUGGEST_RECIPE' })} onViewRecipe={(recipe) => setModalState({ type: 'VIEW_RECIPE', recipe })} onAddToPlan={(date, meal) => setModalState({ type: 'SELECT_RECIPE', date, meal })} onRemoveFromPlan={removeMealFromPlan} onShowShoppingList={() => setModalState({ type: 'SHOPPING_LIST' })} onBatchLog={handleBatchLogMeal} onUpdateBatchLog={handleUpdateBatchLog} onCreateRecipe={handleCreateRecipe} onEditRecipe={(recipe) => setModalState({ type: 'ADD_RECIPE', recipeData: recipe })} onDeleteRecipe={handleDeleteRecipe} onDeleteCustomFood={handleDeleteCustomFood} onAddCustomFood={(initialName) => setModalState({ type: 'ADD_CUSTOM_FOOD', initialName })} onScanBarcode={() => setModalState({ type: 'SCAN_BARCODE' })} baseColor={baseColorName} appMode={mode} />;
          case 'learn':
              return <LearnPage mode={mode} baseColor={baseColorName} onStartLiveSage={() => setModalState({ type: 'LIVE_SAGE' })} />;
          case 'profile':
              return <ProfilePage userProfile={userProfile} triedFoods={activeTriedFoods} milestones={activeMilestones} onSaveProfile={handleUpdateProfile} onResetData={handleResetData} onShowDoctorReport={() => setModalState({ type: 'DOCTOR_REPORT' })} onUpdateMilestone={handleUpdateMilestone} onShowCertificate={() => setModalState({ type: 'CERTIFICATE', babyName: userProfile?.babyName || 'Baby', date: new Date().toLocaleDateString() })} baseColor={baseColorName} />;
          case 'feed':
          case 'health_check':
          case 'sleep_growth':
              return <NewbornPage currentPage={currentPage} feedLogs={activeFeedLogs} diaperLogs={activeDiaperLogs} sleepLogs={activeSleepLogs} medicineLogs={activeMedicineLogs} growthLogs={activeGrowthLogs} onLogFeed={handleLogFeed} onLogDiaper={handleLogDiaper} onLogSleep={handleLogSleep} onUpdateSleepLog={handleUpdateSleepLog} onLogMedicine={handleLogMedicine} onLogGrowth={handleLogGrowth} onDeleteGrowth={handleDeleteGrowth} baseColor={baseColorName} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} />;
          case 'picky_eater':
              return <ToddlerPickyEater baseColor={baseColorName} savedStrategies={activeSavedStrategies} onSaveStrategy={handleSaveStrategy} onDeleteStrategy={handleDeleteStrategy} safeFoods={userProfile?.safeFoods || []} onUpdateSafeFoods={handleUpdateSafeFoods} />;
          case 'balance':
              return <BalanceDashboard triedFoods={activeTriedFoods} baseColor={baseColorName} />;
          case 'growth':
              return <ToddlerGrowthPage growthLogs={activeGrowthLogs} onLogGrowth={handleLogGrowth} onDeleteGrowth={handleDeleteGrowth} baseColor={baseColorName} userProfile={userProfile} />;
          default:
              return <TrackerPage triedFoods={activeTriedFoods} customFoods={customFoods} onFoodClick={(food) => setModalState({ type: 'LOG_FOOD', food })} userProfile={userProfile} onShowGuide={(food) => setModalState({ type: 'HOW_TO_SERVE', food, customDetails: (food as CustomFood).isCustom ? (food as CustomFood).details : undefined })} onAddCustomFood={(initialName) => setModalState({ type: 'ADD_CUSTOM_FOOD', initialName })} onScanBarcode={mode === 'TODDLER' ? () => setModalState({ type: 'SCAN_BARCODE' }) : undefined} baseColor={baseColorName} />;
      }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage} profile={userProfile} allProfiles={profiles} onSwitchProfile={setActiveChildId} onAddProfile={() => setModalState({ type: 'ADD_CHILD' })} progress={{ triedCount: new Set(activeTriedFoods.map(f => f.id)).size, totalCount: flatFoodList.length + customFoods.length }} mode={mode} config={config}>
      <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
        {renderPage()}
      </Suspense>

      {modalState.type === 'LOG_FOOD' && (
        <FoodLogModal food={modalState.food} existingLog={activeTriedFoods.find(f => f.id === modalState.food.name && f.date === new Date().toISOString().split('T')[0] && !f.meal)} onClose={() => setModalState({ type: null })} onSave={handleSaveFoodLog} onShowGuide={(food) => setModalState({ type: 'HOW_TO_SERVE', food, returnToLog: true, customDetails: (food as CustomFood).isCustom ? (food as CustomFood).details : undefined })} onIncrementTry={(id) => { const log = triedFoods.find(f => f.id === id && f.childId === activeChildId); if (log) { const updatedLog = { ...log, tryCount: (log.tryCount || 1) + 1 }; setTriedFoods(prev => prev.map(f => (f.id === id && f.childId === activeChildId) ? updatedLog : f)); } }} baseColor={config.themeColor.replace('bg-', '').replace('-600', '').replace('-500', '')} appMode={mode} />
      )}

      {modalState.type === 'HOW_TO_SERVE' && <HowToServeModal food={modalState.food} onClose={() => { if (modalState.returnToLog) setModalState({ type: 'LOG_FOOD', food: modalState.food }); else setModalState({ type: null }); }} />}
      {modalState.type === 'ADD_RECIPE' && <RecipeModal onClose={() => setModalState({ type: null })} onSave={(data) => { if (modalState.recipeData?.id) handleUpdateRecipe(modalState.recipeData.id, data); else handleCreateRecipe(data); setModalState({ type: null }); }} initialData={modalState.recipeData} />}
      {modalState.type === 'VIEW_RECIPE' && <ViewRecipeModal recipe={modalState.recipe} onClose={() => setModalState({ type: null })} onDelete={(id) => { handleDeleteRecipe(id); setModalState({ type: null }); }} onUpdateRating={(id, rating) => handleUpdateRecipe(id, { rating })} />}
      {modalState.type === 'IMPORT_RECIPE' && <AiImportModal onClose={() => setModalState({ type: null })} onRecipeParsed={(data) => setModalState({ type: 'ADD_RECIPE', recipeData: data })} />}
      {modalState.type === 'SUGGEST_RECIPE' && <AiSuggestModal onClose={() => setModalState({ type: null })} userProfile={userProfile} onRecipeParsed={(data) => setModalState({ type: 'ADD_RECIPE', recipeData: data })} />}
      {modalState.type === 'SHOPPING_LIST' && <ShoppingListModal recipes={recipes} mealPlan={mealPlan} triedFoods={activeTriedFoods} manualItems={manualShoppingItems} checkedItems={shoppingCheckedItems} onAddManualItem={handleAddManualItem} onToggleItem={handleToggleShoppingItem} onClearChecked={handleClearCheckedItems} onClose={() => setModalState({ type: null })} />}
      {modalState.type === 'SELECT_RECIPE' && <SelectRecipeModal recipes={recipes} meal={modalState.meal} onClose={() => setModalState({ type: null })} onSelect={(recipe) => saveMealToPlan(modalState.date, modalState.meal, recipe.id, recipe.title)} />}
      {modalState.type === 'SUBSTITUTES' && <SubstitutesModal food={modalState.food} userProfile={userProfile} onClose={() => setModalState({ type: null })} onSelectSubstitute={(food) => setModalState({ type: 'LOG_FOOD', food })} />}
      {modalState.type === 'DOCTOR_REPORT' && <DoctorReportModal userProfile={userProfile} triedFoods={activeTriedFoods} onClose={() => setModalState({ type: null })} />}
      {modalState.type === 'FLAVOR_PAIRING' && <FlavorPairingModal triedFoods={activeTriedFoods} onClose={() => setModalState({ type: null })} />}
      {modalState.type === 'ALLERGEN_ALERT' && <AllergenAlertModal foodName={modalState.foodName} allergens={modalState.allergens} onClose={() => setModalState({ type: null })} />}
      {modalState.type === 'BADGE_UNLOCKED' && <BadgeUnlockedModal badge={modalState.badge} onClose={() => setModalState({ type: null })} />}
      {modalState.type === 'CERTIFICATE' && <CertificateModal babyName={modalState.babyName} date={modalState.date} onClose={() => setModalState({ type: null })} />}
      {modalState.type === 'ADD_CUSTOM_FOOD' && <CustomFoodModal initialName={modalState.initialName} scannedData={modalState.scannedData} onClose={() => setModalState({ type: null })} onSave={(newFood) => { setCustomFoods(prev => [...prev, newFood]); setModalState({ type: null }); }} />}
      {modalState.type === 'LOG_MEAL' && <LogMealModal recipes={recipes} onClose={() => setModalState({ type: null })} onSave={handleBatchLogMeal} onCreateRecipe={handleCreateRecipe} baseColor={config.themeColor.replace('bg-', '').replace('-600', '').replace('-500', '')} initialFoods={modalState.initialFoods} customFoods={customFoods} enableScanner={mode === 'TODDLER'} onAddCustomFood={(initialName) => setModalState({ type: 'ADD_CUSTOM_FOOD', initialName })} />}
      {modalState.type === 'SCAN_BARCODE' && <Suspense fallback={<div>Loading Scanner...</div>}><BarcodeScannerModal onClose={() => setModalState({ type: null })} onScanSuccess={handleBarcodeScan} /></Suspense>}
      {modalState.type === 'ADD_CHILD' && <AddChildModal onClose={() => setModalState({ type: null })} onSave={handleCreateChild} />}
      {modalState.type === 'LIVE_SAGE' && <LiveSageModal onClose={() => setModalState({ type: null })} babyName={userProfile?.babyName} mode={mode} />}
      {isOnboarding && <TutorialModal onSave={(data) => { const newChild = { ...data, id: crypto.randomUUID() }; handleCreateChild(newChild); }} onClose={() => setIsOnboarding(false)} />}
    </Layout>
  );
};

export default App;
