
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

import { useAppMode } from './hooks/useAppMode';
import { UserProfile, TriedFoodLog, Recipe, MealPlan, Milestone, ModalState, Food, CustomFood, FoodLogData, Badge, SavedStrategy, LoggedItemData, ManualShoppingItem, FeedLog, DiaperLog, SleepLog, MedicineLog, GrowthLog } from './types';
import { DEFAULT_MILESTONES, BADGES_LIST, flatFoodList } from './constants';
import { fetchProductIngredients } from './services/openFoodFactsService';

// Lazy load the scanner modal to prevent initialization errors if the library isn't fully ready
const BarcodeScannerModal = React.lazy(() => import('./components/modals/BarcodeScannerModal'));

const App: React.FC = () => {
  // --- CHILD MANAGEMENT STATE ---
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
      const savedProfiles = localStorage.getItem('tiny-tastes-tracker-profiles');
      if (savedProfiles) return JSON.parse(savedProfiles);
      
      // MIGRATION: Check for legacy single profile
      const legacyProfile = localStorage.getItem('tiny-tastes-tracker-profile');
      if (legacyProfile) {
          const parsed = JSON.parse(legacyProfile);
          if (!parsed.id) parsed.id = crypto.randomUUID(); // Assign ID if missing
          return [parsed];
      }
      return [];
  });

  const [activeChildId, setActiveChildId] = useState<string>(() => {
      const savedId = localStorage.getItem('tiny-tastes-tracker-activeChildId');
      if (savedId) return savedId;
      // Default to first child if available
      const savedProfiles = localStorage.getItem('tiny-tastes-tracker-profiles');
      if (savedProfiles) {
          const parsed = JSON.parse(savedProfiles);
          if (parsed.length > 0) return parsed[0].id;
      }
      // Migration fallback
      const legacyProfile = localStorage.getItem('tiny-tastes-tracker-profile');
      if (legacyProfile) {
          const parsed = JSON.parse(legacyProfile);
          return parsed.id || 'default'; // Should match ID generated in profiles state
      }
      return '';
  });

  // Derived Active Profile
  const userProfile = useMemo(() => profiles.find(p => p.id === activeChildId) || null, [profiles, activeChildId]);

  // Track if we are in the initial onboarding flow
  const [isOnboarding, setIsOnboarding] = useState(profiles.length === 0);

  // --- DATA STATE (ALL LOGS) ---
  // Note: All logs are loaded entirely, then filtered by activeChildId for display.
  // When saving, we attach activeChildId.
  // Legacy migration: If a log has no childId, we assume it belongs to the first profile/legacy profile.

  const [triedFoods, setTriedFoods] = useState<TriedFoodLog[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-triedFoods');
      const data = saved ? JSON.parse(saved) : [];
      // Migration: Ensure logs have childId if possible
      return data;
  });
  
  // Recipes & Meal Plan are GLOBAL (shared across family)
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-recipes');
      return saved ? JSON.parse(saved) : [];
  });
  const [mealPlan, setMealPlan] = useState<MealPlan>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-mealPlan');
      return saved ? JSON.parse(saved) : {};
  });
  
  // Custom foods are GLOBAL
  const [customFoods, setCustomFoods] = useState<CustomFood[]>(() => {
    const saved = localStorage.getItem('tiny-tastes-tracker-customFoods');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Milestones: Child Specific (Filtered below)
  const [allMilestones, setAllMilestones] = useState<Milestone[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-milestones');
      return saved ? JSON.parse(saved) : DEFAULT_MILESTONES; // This might be buggy for new children, dealt with in logic
  });

  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-savedStrategies');
      return saved ? JSON.parse(saved) : [];
  });
  
  // Safe Foods: Child Specific (Stored as simple strings, needs migration to object or separate keys if we want per-child. 
  // For now, let's keep it simple and share safe foods or filter if we update the structure. 
  // Strategy: Add childId to key in localStorage? No, let's keep array but maybe prefix? 
  // BETTER: Store as object { childId: string[] } or array of objects. 
  // CURRENT: It's string[]. Let's migrate to object map in a future refactor. For now, assume global or migrate.
  // ACTUALLY: Let's make safeFoods part of UserProfile! It already is in types.ts!
  // So we sync safeFoods state with the active profile.
  
  // Shopping List: Global
  const [manualShoppingItems, setManualShoppingItems] = useState<ManualShoppingItem[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-manualShopping');
      return saved ? JSON.parse(saved) : [];
  });
  const [shoppingCheckedItems, setShoppingCheckedItems] = useState<Record<string, string>>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-shoppingChecked');
      return saved ? JSON.parse(saved) : {};
  });

  // Newborn Logs: Child Specific
  const [feedLogs, setFeedLogs] = useState<FeedLog[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-feedLogs');
      return saved ? JSON.parse(saved) : [];
  });
  const [diaperLogs, setDiaperLogs] = useState<DiaperLog[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-diaperLogs');
      return saved ? JSON.parse(saved) : [];
  });
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-sleepLogs');
      return saved ? JSON.parse(saved) : [];
  });
  const [medicineLogs, setMedicineLogs] = useState<MedicineLog[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-medicineLogs');
      return saved ? JSON.parse(saved) : [];
  });
  const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>(() => {
      const saved = localStorage.getItem('tiny-tastes-tracker-growthLogs');
      return saved ? JSON.parse(saved) : [];
  });

  const [currentPage, setCurrentPage] = useState('tracker');
  const [modalState, setModalState] = useState<ModalState>({ type: null });

  // --- FILTERED DATA FOR ACTIVE CHILD ---
  // Helper: If a log has no childId, assign it to the first profile found (Legacy Support)
  const filterByChild = <T extends { childId?: string }>(logs: T[]) => {
      if (!activeChildId) return [];
      return logs.filter(log => {
          if (log.childId) return log.childId === activeChildId;
          // If no childId, assume it belongs to the first profile (migration logic)
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
  
  // Milestones are tricky. If we switch children, we need a fresh set of milestones if they don't exist.
  const activeMilestones = useMemo(() => {
      if (!activeChildId) return DEFAULT_MILESTONES;
      const childMilestones = allMilestones.filter(m => m.childId === activeChildId);
      // If no milestones found for this child (new child), return default. 
      // Note: We need to handle saving these properly.
      if (childMilestones.length === 0 && activeChildId !== (profiles[0]?.id)) {
          return DEFAULT_MILESTONES.map(m => ({ ...m, childId: activeChildId }));
      }
      // For legacy data (no childId), associate with first profile
      if (childMilestones.length === 0 && profiles.length > 0 && activeChildId === profiles[0].id) {
          return allMilestones.filter(m => !m.childId);
      }
      return childMilestones.length > 0 ? childMilestones : DEFAULT_MILESTONES.map(m => ({...m, childId: activeChildId}));
  }, [allMilestones, activeChildId, profiles]);


  const { mode, config } = useAppMode(userProfile);

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-profiles', JSON.stringify(profiles)), [profiles]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-activeChildId', activeChildId), [activeChildId]);
  
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-triedFoods', JSON.stringify(triedFoods)), [triedFoods]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-recipes', JSON.stringify(recipes)), [recipes]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-mealPlan', JSON.stringify(mealPlan)), [mealPlan]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-milestones', JSON.stringify(allMilestones)), [allMilestones]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-customFoods', JSON.stringify(customFoods)), [customFoods]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-savedStrategies', JSON.stringify(savedStrategies)), [savedStrategies]);
  // safeFoods are inside profiles now
  
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-manualShopping', JSON.stringify(manualShoppingItems)), [manualShoppingItems]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-shoppingChecked', JSON.stringify(shoppingCheckedItems)), [shoppingCheckedItems]);

  useEffect(() => localStorage.setItem('tiny-tastes-tracker-feedLogs', JSON.stringify(feedLogs)), [feedLogs]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-diaperLogs', JSON.stringify(diaperLogs)), [diaperLogs]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-sleepLogs', JSON.stringify(sleepLogs)), [sleepLogs]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-medicineLogs', JSON.stringify(medicineLogs)), [medicineLogs]);
  useEffect(() => localStorage.setItem('tiny-tastes-tracker-growthLogs', JSON.stringify(growthLogs)), [growthLogs]);

  // Handle Mode Change redirects
  useEffect(() => {
    if (config && config.navItems.length > 0) {
        const itemExists = config.navItems.some(item => item.id === currentPage);
        if (!itemExists) {
            setCurrentPage(config.navItems[0].id);
        }
    }
  }, [mode, config]);


  // --- ACTIONS ---

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

  // Helper to update badges for ACTIVE child
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
      
      // Update global list, but logic relies on checking if *this child* already tried it
      const updatedTried = [...triedFoods.filter(f => !(f.childId === activeChildId && f.id === foodName && f.date === data.date && f.meal === data.meal)), newLog];
      setTriedFoods(updatedTried);
      
      const isFirstTimeForChild = !activeTriedFoods.some(f => f.id === foodName);
      setModalState({ type: null });
      
      if (isFirstTimeForChild) {
          // Pass the CHILD's tried foods to check badges
          checkBadges(updatedTried.filter(f => f.childId === activeChildId));
          const customFood = customFoods.find(c => c.name === foodName);
          let allergens: string[] = [];
          if (customFood && customFood.details.allergen_info && customFood.details.allergen_info !== 'No common allergens') {
             allergens.push(customFood.details.allergen_info);
          }
          if (allergens.length > 0) {
             setModalState({ type: 'ALLERGEN_ALERT', foodName, allergens });
          }
      }
  };

  const handleBatchLogMeal = (items: LoggedItemData[], date: string, meal: string, photo?: string, notes?: string, strategy?: string) => {
      if (!activeChildId) return;
      const newLogs: TriedFoodLog[] = items.map(item => {
          let reaction = 6; // Default to "Liked" (6/7)
          let moreThanOneBite = true;
          
          if (item.status === 'refused') {
              reaction = 1; // Hated it / Refused
              moreThanOneBite = false;
          } else if (item.status === 'touched') {
              reaction = 3; // Neutral/Meh
              moreThanOneBite = false;
          }

          return {
              id: item.food,
              childId: activeChildId,
              date,
              meal,
              reaction, 
              moreThanOneBite,
              allergyReaction: 'none',
              notes: notes || '',
              tryCount: 1,
              messyFaceImage: photo,
              behavioralTags: item.behavioralTags,
              portion: item.portion,
              consumption: item.consumption,
              usedStrategy: strategy
          };
      });
      
      const updatedTried = [...triedFoods, ...newLogs];
      setTriedFoods(updatedTried);
      checkBadges(updatedTried.filter(f => f.childId === activeChildId));
  };

  const handleUpdateBatchLog = (originalDate: string, originalMeal: string, items: LoggedItemData[], newDate: string, newMeal: string, photo?: string, notes?: string, strategy?: string) => {
      if (!activeChildId) return;
      // Remove old logs for THIS child at THIS meal
      const filteredTried = triedFoods.filter(f => !(f.childId === activeChildId && f.date === originalDate && f.meal === originalMeal));
      
      const newLogs: TriedFoodLog[] = items.map(item => {
          let reaction = 6;
          let moreThanOneBite = true;
          
          if (item.status === 'refused' || item.consumption === 'none') {
              reaction = 1;
              moreThanOneBite = false;
          } else if (item.status === 'touched' || item.consumption === 'some') {
              reaction = 3;
              moreThanOneBite = false;
          }

          return {
              id: item.food,
              childId: activeChildId,
              date: newDate,
              meal: newMeal,
              reaction,
              moreThanOneBite,
              allergyReaction: 'none',
              notes: notes || '',
              tryCount: 1,
              messyFaceImage: photo,
              behavioralTags: item.behavioralTags,
              portion: item.portion,
              consumption: item.consumption,
              usedStrategy: strategy
          };
      });

      const updatedTried = [...filteredTried, ...newLogs];
      setTriedFoods(updatedTried);
  };

  // ... (Barcode, Recipe, Custom Food handlers remain mostly same, mostly global)
  const handleBarcodeScan = async (barcode: string) => {
      setModalState({ type: null });
      
      try {
          const product = await fetchProductIngredients(barcode);

          if (!product) {
               alert(`Product not found or error fetching details.`);
               return;
          }
          
          if (product.matchedFoods.length === 1 && product.productName.toLowerCase().includes(product.matchedFoods[0].toLowerCase())) {
              setModalState({ 
                  type: 'LOG_MEAL', 
                  initialFoods: product.matchedFoods 
              });
          } else {
              setModalState({ 
                  type: 'ADD_CUSTOM_FOOD', 
                  scannedData: {
                      name: product.productName,
                      brand: product.brand,
                      ingredientsText: product.ingredientsText,
                      image: product.imageUrl
                  }
              });
          }

      } catch (error) {
          console.error(error);
          alert("Error looking up barcode. Please try again.");
      }
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

  const handleDeleteRecipe = (id: string) => {
      setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const handleDeleteCustomFood = (name: string) => {
      if (window.confirm(`Are you sure you want to delete "${name}" from your food list?`)) {
          setCustomFoods(prev => prev.filter(f => f.name !== name));
      }
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

  const removeMealFromPlan = (date: string, meal: string) => {
      setMealPlan(prev => {
          const newPlan = { ...prev };
          if (newPlan[date]) {
              delete newPlan[date][meal];
              if (Object.keys(newPlan[date]).length === 0) {
                  delete newPlan[date];
              }
          }
          return newPlan;
      });
  };
  
  const handleSaveStrategy = (strategy: SavedStrategy) => {
      setSavedStrategies(prev => [...prev, { ...strategy, childId: activeChildId }]);
  };
  
  const handleDeleteStrategy = (id: string) => {
      setSavedStrategies(prev => prev.filter(s => s.id !== id));
  };

  // Safe Foods now stored in Profile
  const handleUpdateSafeFoods = (foods: string[]) => {
      if (userProfile) {
          handleUpdateProfile({ ...userProfile, safeFoods: foods });
      }
  };

  const handleAddManualItem = (name: string) => {
      const newItem: ManualShoppingItem = {
          id: crypto.randomUUID(),
          name,
          addedAt: new Date().toISOString()
      };
      setManualShoppingItems(prev => [...prev, newItem]);
  };

  const handleToggleShoppingItem = (name: string, isChecked: boolean) => {
      setShoppingCheckedItems(prev => {
          const next = { ...prev };
          if (isChecked) {
              next[name] = new Date().toISOString();
          } else {
              delete next[name];
          }
          return next;
      });
  };

  const handleClearCheckedItems = () => {
      if (window.confirm("Clear all checked items? This will remove checked manual items.")) {
          setManualShoppingItems(prev => prev.filter(item => {
              const normalizedItem = item.name.toLowerCase().trim();
              if (shoppingCheckedItems[item.name]) return false;
              const isChecked = Object.keys(shoppingCheckedItems).some(key => {
                  const normalizedKey = key.toLowerCase().trim();
                  return normalizedKey === normalizedItem || 
                         normalizedKey === normalizedItem + 's' || 
                         (normalizedKey.endsWith('s') && normalizedKey.slice(0, -1) === normalizedItem);
              });
              return !isChecked;
          }));
          setShoppingCheckedItems({});
      }
  };

  // --- Newborn Action Handlers ---
  const handleLogFeed = (feed: FeedLog) => {
      setFeedLogs(prev => [{...feed, childId: activeChildId}, ...prev]);
  };
  const handleLogDiaper = (diaper: DiaperLog) => {
      setDiaperLogs(prev => [{...diaper, childId: activeChildId}, ...prev]);
  };
  const handleLogSleep = (sleep: SleepLog) => {
      setSleepLogs(prev => [{...sleep, childId: activeChildId}, ...prev]);
  };
  const handleUpdateSleepLog = (updatedLog: SleepLog) => {
      setSleepLogs(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));
  };
  const handleLogMedicine = (med: MedicineLog) => {
      setMedicineLogs(prev => [{...med, childId: activeChildId}, ...prev]);
  }
  const handleLogGrowth = (log: GrowthLog) => {
      setGrowthLogs(prev => [{...log, childId: activeChildId}, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }
  const handleDeleteGrowth = (id: string) => {
      setGrowthLogs(prev => prev.filter(l => l.id !== id));
  }
  const handleUpdateMilestone = (m: Milestone) => {
      setAllMilestones(prev => {
          // If editing a legacy milestone (no childId), attach current childId
          // Or if new
          const mWithId = { ...m, childId: activeChildId };
          
          // Remove existing entry for this child/milestone if exists, then add new
          const others = prev.filter(p => !(p.id === m.id && (p.childId === activeChildId || (!p.childId && activeChildId === profiles[0]?.id))));
          return [...others, mWithId];
      });
  }

  const renderPage = () => {
      const baseColorName = config.themeColor.replace('bg-', '').replace('-600', '').replace('-500', '');

      switch (currentPage) {
          case 'tracker':
              return <TrackerPage 
                  triedFoods={activeTriedFoods} 
                  customFoods={customFoods}
                  onFoodClick={(food) => setModalState({ type: 'LOG_FOOD', food })}
                  userProfile={userProfile}
                  onShowGuide={(food) => setModalState({ type: 'HOW_TO_SERVE', food, customDetails: (food as CustomFood).isCustom ? (food as CustomFood).details : undefined })}
                  onAddCustomFood={(initialName) => setModalState({ type: 'ADD_CUSTOM_FOOD', initialName })}
                  onScanBarcode={mode === 'TODDLER' ? () => setModalState({ type: 'SCAN_BARCODE' }) : undefined}
                  baseColor={baseColorName}
              />;
          case 'recommendations':
              return <IdeasPage 
                  userProfile={userProfile}
                  triedFoods={activeTriedFoods}
                  onSaveProfile={handleUpdateProfile}
                  onFoodClick={(food) => setModalState({ type: 'LOG_FOOD', food })}
                  onShowSubstitutes={(food) => setModalState({ type: 'SUBSTITUTES', food })}
                  onShowFlavorPairing={() => setModalState({ type: 'FLAVOR_PAIRING' })}
                  baseColor={baseColorName}
              />;
          case 'recipes':
              return <RecipesPage 
                  recipes={recipes}
                  mealPlan={mealPlan}
                  triedFoods={activeTriedFoods}
                  customFoods={customFoods}
                  savedStrategies={activeSavedStrategies}
                  manualShoppingItems={manualShoppingItems}
                  shoppingCheckedItems={shoppingCheckedItems}
                  onShowAddRecipe={() => setModalState({ type: 'ADD_RECIPE' })}
                  onShowImportRecipe={() => setModalState({ type: 'IMPORT_RECIPE' })}
                  onShowSuggestRecipe={() => setModalState({ type: 'SUGGEST_RECIPE' })}
                  onViewRecipe={(recipe) => setModalState({ type: 'VIEW_RECIPE', recipe })}
                  onAddToPlan={(date, meal) => setModalState({ type: 'SELECT_RECIPE', date, meal })}
                  onRemoveFromPlan={removeMealFromPlan}
                  onShowShoppingList={() => setModalState({ type: 'SHOPPING_LIST' })}
                  onBatchLog={handleBatchLogMeal}
                  onUpdateBatchLog={handleUpdateBatchLog}
                  onCreateRecipe={handleCreateRecipe}
                  onEditRecipe={(recipe) => setModalState({ type: 'ADD_RECIPE', recipeData: recipe })}
                  onDeleteRecipe={handleDeleteRecipe}
                  onDeleteCustomFood={handleDeleteCustomFood}
                  onAddCustomFood={(initialName) => setModalState({ type: 'ADD_CUSTOM_FOOD', initialName })}
                  onScanBarcode={() => setModalState({ type: 'SCAN_BARCODE' })}
                  baseColor={baseColorName}
                  appMode={mode}
              />;
          case 'learn':
              return <LearnPage mode={mode} baseColor={baseColorName} />;
          case 'profile':
              return <ProfilePage 
                  userProfile={userProfile}
                  triedFoods={activeTriedFoods}
                  milestones={activeMilestones}
                  onSaveProfile={handleUpdateProfile}
                  onResetData={handleResetData}
                  onShowDoctorReport={() => setModalState({ type: 'DOCTOR_REPORT' })}
                  onUpdateMilestone={handleUpdateMilestone}
                  onShowCertificate={() => setModalState({ type: 'CERTIFICATE', babyName: userProfile?.babyName || 'Baby', date: new Date().toLocaleDateString() })}
                  baseColor={baseColorName}
              />;
          // NEWBORN PAGES
          case 'feed':
          case 'health_check':
          case 'sleep_growth':
              return <NewbornPage 
                  currentPage={currentPage}
                  feedLogs={activeFeedLogs}
                  diaperLogs={activeDiaperLogs}
                  sleepLogs={activeSleepLogs}
                  medicineLogs={activeMedicineLogs}
                  growthLogs={activeGrowthLogs}
                  onLogFeed={handleLogFeed}
                  onLogDiaper={handleLogDiaper}
                  onLogSleep={handleLogSleep}
                  onUpdateSleepLog={handleUpdateSleepLog}
                  onLogMedicine={handleLogMedicine}
                  onLogGrowth={handleLogGrowth}
                  onDeleteGrowth={handleDeleteGrowth}
                  baseColor={baseColorName}
                  userProfile={userProfile}
                  onUpdateProfile={handleUpdateProfile}
              />;
          // TODDLER PAGES
          case 'picky_eater':
              return <ToddlerPickyEater 
                  baseColor={baseColorName}
                  savedStrategies={activeSavedStrategies}
                  onSaveStrategy={handleSaveStrategy}
                  onDeleteStrategy={handleDeleteStrategy}
                  safeFoods={userProfile?.safeFoods || []}
                  onUpdateSafeFoods={handleUpdateSafeFoods}
              />;
          case 'balance':
              return <BalanceDashboard triedFoods={activeTriedFoods} baseColor={baseColorName} />;
          case 'growth': // Toddler specific growth route
              return <ToddlerGrowthPage 
                  growthLogs={activeGrowthLogs} 
                  onLogGrowth={handleLogGrowth} 
                  onDeleteGrowth={handleDeleteGrowth} 
                  baseColor={baseColorName} 
                  userProfile={userProfile}
              />;
          default:
              return <TrackerPage 
                  triedFoods={activeTriedFoods} 
                  customFoods={customFoods}
                  onFoodClick={(food) => setModalState({ type: 'LOG_FOOD', food })}
                  userProfile={userProfile}
                  onShowGuide={(food) => setModalState({ type: 'HOW_TO_SERVE', food, customDetails: (food as CustomFood).isCustom ? (food as CustomFood).details : undefined })}
                  onAddCustomFood={(initialName) => setModalState({ type: 'ADD_CUSTOM_FOOD', initialName })}
                  onScanBarcode={mode === 'TODDLER' ? () => setModalState({ type: 'SCAN_BARCODE' }) : undefined}
                  baseColor={baseColorName}
              />;
      }
  };

  return (
    <Layout 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage} 
      profile={userProfile} 
      allProfiles={profiles}
      onSwitchProfile={setActiveChildId}
      onAddProfile={() => setModalState({ type: 'ADD_CHILD' })}
      progress={{ triedCount: new Set(activeTriedFoods.map(f => f.id)).size, totalCount: flatFoodList.length + customFoods.length }}
      mode={mode}
      config={config}
    >
      <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
        {renderPage()}
      </Suspense>

      {/* Modals */}
      {modalState.type === 'LOG_FOOD' && (
        <FoodLogModal 
          food={modalState.food} 
          existingLog={activeTriedFoods.find(f => f.id === modalState.food.name && f.date === new Date().toISOString().split('T')[0] && !f.meal)} // Simplified check
          onClose={() => setModalState({ type: null })}
          onSave={handleSaveFoodLog}
          onShowGuide={(food) => setModalState({ type: 'HOW_TO_SERVE', food, returnToLog: true, customDetails: (food as CustomFood).isCustom ? (food as CustomFood).details : undefined })}
          onIncrementTry={(id) => {
              const log = triedFoods.find(f => f.id === id && f.childId === activeChildId);
              if (log) {
                  const updatedLog = { ...log, tryCount: (log.tryCount || 1) + 1 };
                  setTriedFoods(prev => prev.map(f => (f.id === id && f.childId === activeChildId) ? updatedLog : f));
              }
          }}
          baseColor={config.themeColor.replace('bg-', '').replace('-600', '').replace('-500', '')}
          appMode={mode}
        />
      )}

      {modalState.type === 'HOW_TO_SERVE' && (
        <HowToServeModal 
          food={modalState.food} 
          onClose={() => {
              if (modalState.returnToLog) {
                  setModalState({ type: 'LOG_FOOD', food: modalState.food });
              } else {
                  setModalState({ type: null });
              }
          }} 
        />
      )}

      {modalState.type === 'ADD_RECIPE' && (
          <RecipeModal 
            onClose={() => setModalState({ type: null })} 
            onSave={(data) => {
                if (modalState.recipeData?.id) {
                    handleUpdateRecipe(modalState.recipeData.id, data);
                } else {
                    handleCreateRecipe(data);
                }
                setModalState({ type: null });
            }}
            initialData={modalState.recipeData}
          />
      )}

      {modalState.type === 'VIEW_RECIPE' && (
          <ViewRecipeModal 
            recipe={modalState.recipe}
            onClose={() => setModalState({ type: null })}
            onDelete={(id) => { handleDeleteRecipe(id); setModalState({ type: null }); }}
            onUpdateRating={(id, rating) => handleUpdateRecipe(id, { rating })}
          />
      )}

      {modalState.type === 'IMPORT_RECIPE' && (
          <AiImportModal 
            onClose={() => setModalState({ type: null })}
            onRecipeParsed={(data) => {
                setModalState({ type: 'ADD_RECIPE', recipeData: data });
            }}
          />
      )}

      {modalState.type === 'SUGGEST_RECIPE' && (
          <AiSuggestModal 
            onClose={() => setModalState({ type: null })}
            userProfile={userProfile}
            onRecipeParsed={(data) => {
                setModalState({ type: 'ADD_RECIPE', recipeData: data });
            }}
          />
      )}

      {modalState.type === 'SHOPPING_LIST' && (
          <ShoppingListModal 
            recipes={recipes}
            mealPlan={mealPlan}
            triedFoods={activeTriedFoods}
            manualItems={manualShoppingItems}
            checkedItems={shoppingCheckedItems}
            onAddManualItem={handleAddManualItem}
            onToggleItem={handleToggleShoppingItem}
            onClearChecked={handleClearCheckedItems}
            onClose={() => setModalState({ type: null })}
          />
      )}

      {modalState.type === 'SELECT_RECIPE' && (
          <SelectRecipeModal 
            recipes={recipes}
            meal={modalState.meal}
            onClose={() => setModalState({ type: null })}
            onSelect={(recipe) => saveMealToPlan(modalState.date, modalState.meal, recipe.id, recipe.title)}
          />
      )}

      {modalState.type === 'SUBSTITUTES' && (
          <SubstitutesModal 
            food={modalState.food}
            userProfile={userProfile}
            onClose={() => setModalState({ type: null })}
            onSelectSubstitute={(food) => setModalState({ type: 'LOG_FOOD', food })}
          />
      )}

      {modalState.type === 'DOCTOR_REPORT' && (
          <DoctorReportModal 
            userProfile={userProfile}
            triedFoods={activeTriedFoods}
            onClose={() => setModalState({ type: null })}
          />
      )}

      {modalState.type === 'FLAVOR_PAIRING' && (
          <FlavorPairingModal 
            triedFoods={activeTriedFoods}
            onClose={() => setModalState({ type: null })}
          />
      )}

      {modalState.type === 'ALLERGEN_ALERT' && (
          <AllergenAlertModal 
            foodName={modalState.foodName}
            allergens={modalState.allergens}
            onClose={() => setModalState({ type: null })}
          />
      )}

      {modalState.type === 'BADGE_UNLOCKED' && (
          <BadgeUnlockedModal 
            badge={modalState.badge}
            onClose={() => setModalState({ type: null })}
          />
      )}

      {modalState.type === 'CERTIFICATE' && (
          <CertificateModal 
            babyName={modalState.babyName}
            date={modalState.date}
            onClose={() => setModalState({ type: null })}
          />
      )}

      {modalState.type === 'ADD_CUSTOM_FOOD' && (
          <CustomFoodModal 
            initialName={modalState.initialName}
            scannedData={modalState.scannedData}
            onClose={() => setModalState({ type: null })}
            onSave={(newFood) => {
                setCustomFoods(prev => [...prev, newFood]);
                setModalState({ type: null });
                // Optional: immediately open log modal
                // setModalState({ type: 'LOG_FOOD', food: newFood });
            }}
          />
      )}

      {modalState.type === 'LOG_MEAL' && (
          <LogMealModal 
            recipes={recipes}
            onClose={() => setModalState({ type: null })}
            onSave={handleBatchLogMeal}
            onCreateRecipe={handleCreateRecipe}
            baseColor={config.themeColor.replace('bg-', '').replace('-600', '').replace('-500', '')}
            initialFoods={modalState.initialFoods}
            customFoods={customFoods}
            enableScanner={mode === 'TODDLER'}
            onAddCustomFood={(initialName) => setModalState({ type: 'ADD_CUSTOM_FOOD', initialName })}
          />
      )}

      {modalState.type === 'SCAN_BARCODE' && (
          <Suspense fallback={<div>Loading Scanner...</div>}>
              <BarcodeScannerModal 
                  onClose={() => setModalState({ type: null })}
                  onScanSuccess={handleBarcodeScan}
              />
          </Suspense>
      )}

      {modalState.type === 'ADD_CHILD' && (
          <AddChildModal 
            onClose={() => setModalState({ type: null })}
            onSave={handleCreateChild}
          />
      )}

      {/* First Time Tutorial */}
      {isOnboarding && (
          <TutorialModal 
            onSave={(data) => {
                const newChild = { ...data, id: crypto.randomUUID() };
                handleCreateChild(newChild);
            }} 
            onClose={() => setIsOnboarding(false)}
          />
      )}
    </Layout>
  );
};

export default App;
