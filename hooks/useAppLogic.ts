import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { 
    UserProfile, TriedFoodLog, Recipe, MealPlan, Milestone, 
    ModalState, Food, CustomFood, FoodLogData, Badge, SavedStrategy, 
    LoggedItemData, ManualShoppingItem, FeedLog, DiaperLog, SleepLog, 
    MedicineLog, GrowthLog 
} from '../types';
import { DEFAULT_MILESTONES, BADGES_LIST } from '../constants';
import { fetchProductIngredients } from '../services/openFoodFactsService';

export const useAppLogic = () => {
    // --- Data State ---
    const [profiles, setProfiles] = useLocalStorage<UserProfile[]>('tiny-tastes-tracker-profiles', []);
    const [activeChildId, setActiveChildId] = useLocalStorage<string>('tiny-tastes-tracker-activeChildId', '');
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

    // --- UI State ---
    const [modalState, setModalState] = useState<ModalState>({ type: null });
    const [isOnboarding, setIsOnboarding] = useState(false);

    // --- Effects & Initialization ---

    // 1. Initialize activeChildId
    useEffect(() => {
        if (!activeChildId && profiles.length > 0) {
            setActiveChildId(profiles[0].id);
        }
    }, [profiles, activeChildId, setActiveChildId]);

    // 2. Migration & Onboarding Check
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
            } else {
                setIsOnboarding(true);
            }
        }
    }, [profiles.length, setProfiles]);

    // --- Derived Data Helpers ---

    const userProfile = useMemo(() => profiles.find(p => p.id === activeChildId) || null, [profiles, activeChildId]);

    const filterByChild = useCallback(<T extends { childId?: string }>(logs: T[]) => {
        if (!activeChildId) return [];
        return logs.filter(log => {
            if (log.childId) return log.childId === activeChildId;
            return profiles.length > 0 && profiles[0].id === activeChildId;
        });
    }, [activeChildId, profiles]);

    const activeTriedFoods = useMemo(() => filterByChild(triedFoods), [triedFoods, filterByChild]);
    const activeFeedLogs = useMemo(() => filterByChild(feedLogs), [feedLogs, filterByChild]);
    const activeDiaperLogs = useMemo(() => filterByChild(diaperLogs), [diaperLogs, filterByChild]);
    const activeSleepLogs = useMemo(() => filterByChild(sleepLogs), [sleepLogs, filterByChild]);
    const activeMedicineLogs = useMemo(() => filterByChild(medicineLogs), [medicineLogs, filterByChild]);
    const activeGrowthLogs = useMemo(() => filterByChild(growthLogs), [growthLogs, filterByChild]);
    const activeSavedStrategies = useMemo(() => filterByChild(savedStrategies), [savedStrategies, filterByChild]);
    
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

    // --- Actions ---

    const handleCreateChild = (child: UserProfile) => {
        setProfiles(prev => [...prev, child]);
        setActiveChildId(child.id);
        setModalState({ type: null });
        setIsOnboarding(false);
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
    
    // Increment log try count helper
    const handleIncrementTry = (id: string) => {
        const log = triedFoods.find(f => f.id === id && f.childId === activeChildId);
        if (log) {
            const updatedLog = { ...log, tryCount: (log.tryCount || 1) + 1 };
            setTriedFoods(prev => prev.map(f => (f.id === id && f.childId === activeChildId) ? updatedLog : f));
        }
    };

    return {
        state: {
            profiles, activeChildId, userProfile, isOnboarding,
            triedFoods, activeTriedFoods, recipes, mealPlan,
            customFoods, activeMilestones, activeSavedStrategies,
            manualShoppingItems, shoppingCheckedItems,
            feedLogs: activeFeedLogs, diaperLogs: activeDiaperLogs,
            sleepLogs: activeSleepLogs, medicineLogs: activeMedicineLogs,
            growthLogs: activeGrowthLogs,
            modalState
        },
        actions: {
            setActiveChildId,
            setModalState,
            setIsOnboarding,
            handleCreateChild,
            handleUpdateProfile,
            handleResetData,
            handleSaveFoodLog,
            handleBatchLogMeal,
            handleUpdateBatchLog,
            handleBarcodeScan,
            handleCreateRecipe,
            handleUpdateRecipe,
            handleDeleteRecipe,
            handleDeleteCustomFood,
            saveMealToPlan,
            removeMealFromPlan,
            handleSaveStrategy,
            handleDeleteStrategy,
            handleUpdateSafeFoods,
            handleAddManualItem,
            handleToggleShoppingItem,
            handleClearCheckedItems,
            handleLogFeed,
            handleLogDiaper,
            handleLogSleep,
            handleUpdateSleepLog,
            handleLogMedicine,
            handleLogGrowth,
            handleDeleteGrowth,
            handleUpdateMilestone,
            handleIncrementTry,
            setCustomFoods, // Needed for direct update in modal
            setTriedFoods
        }
    };
};