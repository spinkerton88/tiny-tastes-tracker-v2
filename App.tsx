
import React, { useState, useEffect } from 'react';
import { Page, Food, TriedFoodLog, Recipe, UserProfile, MealPlan, ModalState, FoodLogData, Milestone, Badge, CustomFood } from './types';
import { totalFoodCount, DEFAULT_MILESTONES, FOOD_ALLERGY_MAPPING, BADGES_LIST, allFoods, GREEN_VEGETABLES } from './constants';
import Layout from './components/Layout';
import TrackerPage from './components/pages/TrackerPage';
import RecommendationsPage from './components/pages/IdeasPage';
import RecipesPage from './components/pages/RecipesPage';
import LearnPage from './components/pages/LearnPage';
import ProfilePage from './components/pages/LogPage';
import FoodLogModal from './components/modals/FoodLogModal';
import HowToServeModal from './components/modals/HowToServeModal';
import RecipeModal from './components/modals/RecipeModal';
import ViewRecipeModal from './components/modals/ViewRecipeModal';
import AiImportModal from './components/modals/AiImportModal';
import AiSuggestModal from './components/modals/AiSuggestModal';
import ShoppingListModal from './components/modals/ShoppingListModal';
import SelectRecipeModal from './components/modals/SelectRecipeModal';
import SubstitutesModal from './components/modals/SubstitutesModal';
import TutorialModal from './components/modals/TutorialModal';
import DoctorReportModal from './components/modals/DoctorReportModal';
import FlavorPairingModal from './components/modals/FlavorPairingModal';
import AllergenAlertModal from './components/modals/AllergenAlertModal';
import BadgeUnlockedModal from './components/modals/BadgeUnlockedModal';
import CertificateModal from './components/modals/CertificateModal';
import CustomFoodModal from './components/modals/CustomFoodModal';

// Helper function to calculate badges - defined outside component for reuse
const calculateBadges = (currentTriedFoods: TriedFoodLog[], currentProfile: UserProfile): { updatedProfile: UserProfile, newBadge: Badge | null, badgesChanged: boolean } => {
    let updatedBadges = currentProfile.badges ? [...currentProfile.badges] : [...BADGES_LIST];
    let newBadge: Badge | null = null;
    let badgesChanged = false;
    
    const triedSet = new Set(currentTriedFoods.map(f => f.id));
    const triedCount = triedSet.size;
    const todayStr = new Date().toISOString().split('T')[0];

    const tryUnlock = (id: string) => {
        const badgeIndex = updatedBadges.findIndex(b => b.id === id);
        if (badgeIndex !== -1 && !updatedBadges[badgeIndex].isUnlocked) {
             updatedBadges[badgeIndex] = {
                 ...updatedBadges[badgeIndex],
                 isUnlocked: true,
                 dateUnlocked: todayStr
             };
             newBadge = updatedBadges[badgeIndex]; 
             badgesChanged = true;
        }
    };

    // 1. Numeric Intervals (10-90)
    for (let i = 10; i <= 90; i += 10) {
        if (triedCount >= i) tryUnlock(`tried_${i}`);
    }

    // 2. The 100 Club
    if (triedCount >= 100) tryUnlock('100_club');

    // 3. Fruit Ninja (15 Fruits)
    const fruitCategory = allFoods.find(c => c.category === 'Fruits');
    if (fruitCategory) {
         const fruitCount = fruitCategory.items.filter(item => triedSet.has(item.name)).length;
         if (fruitCount >= 15) tryUnlock('fruit_ninja');
    }

    // 4. Green Machine (10 Green Veggies)
    const greenCount = GREEN_VEGETABLES.filter(v => triedSet.has(v)).length;
    if (greenCount >= 10) tryUnlock('green_machine');
    
    // 5. Protein Power (5 Proteins)
    const proteinCategories = ['Meat', 'Plant Protein', 'Dairy & Eggs'];
    let proteinCount = 0;
    allFoods.forEach(cat => {
        if(proteinCategories.includes(cat.category)) {
            proteinCount += cat.items.filter(item => triedSet.has(item.name)).length;
        }
    });
    if (proteinCount >= 5) tryUnlock('protein_power');

    return {
        updatedProfile: { ...currentProfile, badges: updatedBadges },
        newBadge,
        badgesChanged
    };
};

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('tracker');
    const [triedFoods, setTriedFoods] = useState<TriedFoodLog[]>([]);
    const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [mealPlan, setMealPlan] = useState<MealPlan>({});
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [milestones, setMilestones] = useState<Milestone[]>(DEFAULT_MILESTONES);
    const [loading, setLoading] = useState(true);

    const [modalState, setModalState] = useState<ModalState>({ type: null });

    const handleResetData = () => {
        if (window.confirm("Are you sure you want to reset all app data? This action cannot be undone.")) {
            localStorage.removeItem('tiny-tastes-tracker-profile');
            localStorage.removeItem('tiny-tastes-tracker-triedFoods');
            localStorage.removeItem('tiny-tastes-tracker-customFoods');
            localStorage.removeItem('tiny-tastes-tracker-recipes');
            localStorage.removeItem('tiny-tastes-tracker-mealPlan');
            localStorage.removeItem('tiny-tastes-tracker-milestones');
            window.location.reload();
        }
    };

    const saveProfile = async (profile: UserProfile) => {
        // Ensure badges are initialized if they don't exist in the profile update
        const updatedProfile = {
            ...profile,
            badges: profile.badges || BADGES_LIST
        };
        localStorage.setItem(`tiny-tastes-tracker-profile`, JSON.stringify(updatedProfile));
        setUserProfile(updatedProfile);
    };

    const addCustomFood = async (food: CustomFood) => {
        const updatedCustomFoods = [...customFoods, food];
        localStorage.setItem('tiny-tastes-tracker-customFoods', JSON.stringify(updatedCustomFoods));
        setCustomFoods(updatedCustomFoods);
        setModalState({ type: null });
    };

    const saveTriedFood = async (foodName: string, data: FoodLogData) => {
        // Haptic Feedback: Confirm action with a subtle vibration
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }

        const isFirstTime = !triedFoods.some(f => f.id === foodName);
        
        const newLogData = {
            ...data,
            tryCount: data.tryCount || 1, 
        };
        const newTriedFoods = [...triedFoods.filter(f => f.id !== foodName), { id: foodName, ...newLogData }];
        
        localStorage.setItem(`tiny-tastes-tracker-triedFoods`, JSON.stringify(newTriedFoods));
        setTriedFoods(newTriedFoods);
        
        // Handle Badges logic if user profile exists
        if (userProfile) {
            const { updatedProfile, newBadge } = calculateBadges(newTriedFoods, userProfile);
            // If badges changed (simple check: if newBadge exists), save profile
            if (newBadge) {
                await saveProfile(updatedProfile);
            }
            
            // Priority: Badge Unlock Modal > Allergen Alert
            if (newBadge) {
                setModalState({ type: 'BADGE_UNLOCKED', badge: newBadge });
                return;
            }
        }
        
        // Allergen Alert Logic (Only if no badge unlocked to avoid modal stacking issues)
        const allergens = FOOD_ALLERGY_MAPPING[foodName];
        if (isFirstTime && allergens && allergens.length > 0) {
            setModalState({ type: 'ALLERGEN_ALERT', foodName, allergens });
        } else {
            setModalState({ type: null });
        }
    };

    const incrementTryCount = async (foodName: string) => {
        // Haptic Feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }

        const updatedTriedFoods = triedFoods.map(food => {
            if (food.id === foodName) {
                return { ...food, tryCount: (food.tryCount || 1) + 1 };
            }
            return food;
        });
        localStorage.setItem(`tiny-tastes-tracker-triedFoods`, JSON.stringify(updatedTriedFoods));
        setTriedFoods(updatedTriedFoods);
    };

    const updateMilestone = async (updatedMilestone: Milestone) => {
        const newMilestones = milestones.map(m => m.id === updatedMilestone.id ? updatedMilestone : m);
        localStorage.setItem(`tiny-tastes-tracker-milestones`, JSON.stringify(newMilestones));
        setMilestones(newMilestones);
    };

    const addRecipe = async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'rating'>) => {
        const newRecipe: Recipe = {
            ...recipeData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            rating: 0,
        };
        const updatedRecipes = [...recipes, newRecipe];
        localStorage.setItem(`tiny-tastes-tracker-recipes`, JSON.stringify(updatedRecipes));
        setRecipes(updatedRecipes);
        setModalState({ type: null });
    };

    const deleteRecipe = async (recipeId: string) => {
        const updatedRecipes = recipes.filter(r => r.id !== recipeId);
        localStorage.setItem(`tiny-tastes-tracker-recipes`, JSON.stringify(updatedRecipes));
        setRecipes(updatedRecipes);
        
        const updatedMealPlan = { ...mealPlan };
        let mealPlanChanged = false;
        Object.keys(updatedMealPlan).forEach(date => {
            Object.keys(updatedMealPlan[date]).forEach(meal => {
                if (updatedMealPlan[date][meal].id === recipeId) {
                    delete updatedMealPlan[date][meal];
                    mealPlanChanged = true;
                }
            });
            if (Object.keys(updatedMealPlan[date]).length === 0) {
                delete updatedMealPlan[date];
            }
        });

        if (mealPlanChanged) {
            localStorage.setItem(`tiny-tastes-tracker-mealPlan`, JSON.stringify(updatedMealPlan));
            setMealPlan(updatedMealPlan);
        }
        setModalState({ type: null });
    };
    
    const updateRecipeRating = async (recipeId: string, rating: number) => {
        let updatedRecipe: Recipe | undefined;
        const updatedRecipes = recipes.map(r => {
            if (r.id === recipeId) {
                updatedRecipe = { ...r, rating };
                return updatedRecipe;
            }
            return r;
        });
        localStorage.setItem(`tiny-tastes-tracker-recipes`, JSON.stringify(updatedRecipes));
        setRecipes(updatedRecipes);

        // If the recipe is currently being viewed in the modal, update the modal state as well
        if (modalState.type === 'VIEW_RECIPE' && modalState.recipe.id === recipeId && updatedRecipe) {
            setModalState({ type: 'VIEW_RECIPE', recipe: updatedRecipe });
        }
    };
    
    const saveMealToPlan = async (date: string, meal: string, recipeId: string, recipeTitle: string) => {
        const updatedMealPlan = { ...mealPlan };
        if (!updatedMealPlan[date]) {
            updatedMealPlan[date] = {};
        }
        updatedMealPlan[date][meal] = { id: recipeId, title: recipeTitle };
        localStorage.setItem(`tiny-tastes-tracker-mealPlan`, JSON.stringify(updatedMealPlan));
        setMealPlan(updatedMealPlan);
        setModalState({ type: null });
    };

    const removeMealFromPlan = async (date: string, meal: string) => {
        const updatedMealPlan = { ...mealPlan };
        if (updatedMealPlan[date]?.[meal]) {
            delete updatedMealPlan[date][meal];
            if (Object.keys(updatedMealPlan[date]).length === 0) {
                delete updatedMealPlan[date];
            }
            localStorage.setItem(`tiny-tastes-tracker-mealPlan`, JSON.stringify(updatedMealPlan));
            setMealPlan(updatedMealPlan);
        }
    };

    useEffect(() => {
        setLoading(true);
        
        const getFromStorage = <T,>(key: string, defaultValue: T): T => {
            try {
                const storedValue = localStorage.getItem(`tiny-tastes-tracker-${key}`);
                return storedValue ? JSON.parse(storedValue) : defaultValue;
            } catch (error) {
                console.error(`Error parsing ${key} from localStorage`, error);
                return defaultValue;
            }
        };
        
        let loadedProfile = getFromStorage<UserProfile | null>('profile', null);
        let loadedTriedFoods = getFromStorage<TriedFoodLog[]>('triedFoods', []).map(log => ({
            ...log,
            tryCount: log.tryCount || 1
        }));
        
        // Legacy data migration for allergies (string -> string[])
        if (loadedProfile && typeof loadedProfile.knownAllergies === 'string') {
            loadedProfile.knownAllergies = []; 
        }
        
        // Migration: Rename "Cow's Milk" to "Dairy"
        if (loadedProfile && Array.isArray(loadedProfile.knownAllergies)) {
            if (loadedProfile.knownAllergies.includes("Cow's Milk")) {
                loadedProfile.knownAllergies = loadedProfile.knownAllergies.map(a => a === "Cow's Milk" ? "Dairy" : a);
            }
        }

        // Initialize badges if missing or merge new badges if existing ones are old
        if (loadedProfile) {
            if (!loadedProfile.badges) {
                loadedProfile.badges = BADGES_LIST;
            } else {
                // Merge loaded badges with BADGES_LIST to ensure new badges (like tried_10, tried_20 etc) appear
                const currentBadges = loadedProfile.badges;
                const mergedBadges = BADGES_LIST.map(defBadge => {
                    const existing = currentBadges.find(b => b.id === defBadge.id);
                    return existing ? existing : defBadge;
                });
                loadedProfile.badges = mergedBadges;
            }

            // --- RETROACTIVE BADGE CHECK ---
            // If the user has enough tried foods but badges are locked (e.g. from data import or old version), unlock them now.
            const { updatedProfile, badgesChanged } = calculateBadges(loadedTriedFoods, loadedProfile);
            if (badgesChanged) {
                console.log("Retroactively unlocked badges based on history.");
                loadedProfile = updatedProfile;
                localStorage.setItem(`tiny-tastes-tracker-profile`, JSON.stringify(loadedProfile));
            }
        }
        
        setUserProfile(loadedProfile);
        setTriedFoods(loadedTriedFoods);

        if (loadedProfile) {
            // Load Custom Foods
            const loadedCustomFoods = getFromStorage<CustomFood[]>('customFoods', []);
            setCustomFoods(loadedCustomFoods);

            const rawRecipes = getFromStorage<any[]>('recipes', []);
            const cleanedRecipes = rawRecipes.map((r): Recipe | null => {
                if (!r || typeof r !== 'object') return null;
                return {
                    ...r,
                    id: r.id || crypto.randomUUID(),
                    title: r.title || 'Untitled Recipe',
                    ingredients: Array.isArray(r.ingredients) ? r.ingredients.join('\n') : (typeof r.ingredients === 'string' ? r.ingredients : ''),
                    instructions: Array.isArray(r.instructions) ? r.instructions.join('\n') : (typeof r.instructions === 'string' ? r.instructions : ''),
                    tags: Array.isArray(r.tags) ? r.tags : [],
                    mealTypes: Array.isArray(r.mealTypes) ? r.mealTypes : [],
                    createdAt: r.createdAt || new Date().toISOString(),
                    rating: r.rating || 0,
                };
            }).filter((r): r is Recipe => r !== null);
            setRecipes(cleanedRecipes);

            setMealPlan(getFromStorage<MealPlan>('mealPlan', {}));

            const storedMilestones = getFromStorage<Milestone[]>('milestones', []);
            const mergedMilestones = DEFAULT_MILESTONES.map(def => {
                const found = storedMilestones.find(m => m.id === def.id);
                return found ? { 
                    ...def, 
                    isAchieved: found.isAchieved, 
                    dateAchieved: found.dateAchieved, 
                    notes: found.notes 
                } : def;
            });
            setMilestones(mergedMilestones);
        }

        setLoading(false);
    }, []);

    const handleOnboardingSave = async (profile: UserProfile) => {
        await saveProfile(profile);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'tracker':
                return <TrackerPage 
                    triedFoods={triedFoods} 
                    customFoods={customFoods}
                    onFoodClick={(food: Food) => setModalState({ type: 'LOG_FOOD', food })} 
                    userProfile={userProfile}
                    onShowGuide={(food: Food) => setModalState({ type: 'HOW_TO_SERVE', food, returnToLog: false })}
                    onAddCustomFood={(name) => setModalState({ type: 'ADD_CUSTOM_FOOD', initialName: name })}
                />;
            case 'recommendations':
                return <RecommendationsPage
                    userProfile={userProfile} 
                    triedFoods={triedFoods} 
                    onSaveProfile={saveProfile} 
                    onFoodClick={(food: Food) => setModalState({ type: 'LOG_FOOD', food })}
                    onShowSubstitutes={(food: Food) => setModalState({ type: 'SUBSTITUTES', food })}
                    onShowFlavorPairing={() => setModalState({ type: 'FLAVOR_PAIRING' })}
                />;
            case 'recipes':
                return <RecipesPage 
                    recipes={recipes} 
                    mealPlan={mealPlan}
                    onShowAddRecipe={() => setModalState({ type: 'ADD_RECIPE' })}
                    onShowImportRecipe={() => setModalState({ type: 'IMPORT_RECIPE' })}
                    onShowSuggestRecipe={() => setModalState({ type: 'SUGGEST_RECIPE' })}
                    onViewRecipe={(recipe) => setModalState({ type: 'VIEW_RECIPE', recipe })}
                    onAddToPlan={(date, meal) => setModalState({ type: 'SELECT_RECIPE', date, meal })}
                    onShowShoppingList={() => setModalState({ type: 'SHOPPING_LIST' })}
                />;
            case 'learn':
                return <LearnPage />;
            case 'profile':
                return <ProfilePage 
                    userProfile={userProfile} 
                    triedFoods={triedFoods} 
                    milestones={milestones}
                    onSaveProfile={saveProfile} 
                    onResetData={handleResetData} 
                    onShowDoctorReport={() => setModalState({ type: 'DOCTOR_REPORT' })}
                    onUpdateMilestone={updateMilestone}
                    onShowCertificate={() => setModalState({ type: 'CERTIFICATE', babyName: userProfile?.babyName || 'Baby', date: new Date().toLocaleDateString() })}
                />;
            default:
                return <TrackerPage 
                    triedFoods={triedFoods} 
                    onFoodClick={(food: Food) => setModalState({ type: 'LOG_FOOD', food })} 
                    userProfile={userProfile} 
                    onShowGuide={(food: Food) => setModalState({ type: 'HOW_TO_SERVE', food, returnToLog: false })}
                />;
        }
    };

    const renderModals = () => {
        const modal = modalState;
        if (modal.type === null) return null;
        switch (modal.type) {
            case 'LOG_FOOD': {
                const existingLog = triedFoods.find(f => f.id === modal.food.name);
                return <FoodLogModal 
                    food={modal.food} 
                    existingLog={existingLog}
                    onClose={() => setModalState({ type: null })} 
                    onSave={saveTriedFood}
                    onIncrementTry={incrementTryCount}
                    onShowGuide={(food) => setModalState({ type: 'HOW_TO_SERVE', food, returnToLog: true })}
                />;
            }
            case 'HOW_TO_SERVE': {
                return <HowToServeModal 
                    food={modal.food} 
                    onClose={() => {
                        if (modal.returnToLog) {
                            setModalState({ type: 'LOG_FOOD', food: modal.food });
                        } else {
                            setModalState({ type: null });
                        }
                    }} 
                />;
            }
            case 'ADD_RECIPE': {
                return <RecipeModal 
                    onClose={() => setModalState({ type: null })} 
                    onSave={addRecipe} 
                    initialData={modal.recipeData} 
                />;
            }
            case 'VIEW_RECIPE': {
                return <ViewRecipeModal 
                    recipe={modal.recipe} 
                    onClose={() => setModalState({ type: null })} 
                    onDelete={deleteRecipe}
                    onUpdateRating={updateRecipeRating}
                />;
            }
            case 'IMPORT_RECIPE':
                return <AiImportModal 
                    onClose={() => setModalState({ type: null })} 
                    onRecipeParsed={(recipeData) => setModalState({ type: 'ADD_RECIPE', recipeData })}
                />;
            case 'SUGGEST_RECIPE':
                return <AiSuggestModal 
                    onClose={() => setModalState({ type: null })}
                    onRecipeParsed={(recipeData) => setModalState({ type: 'ADD_RECIPE', recipeData })}
                    userProfile={userProfile}
                />;
            case 'SELECT_RECIPE': {
                return <SelectRecipeModal 
                    recipes={recipes} 
                    meal={modal.meal}
                    onClose={() => setModalState({ type: null })}
                    onSelect={(recipe) => saveMealToPlan(modal.date, modal.meal, recipe.id, recipe.title)}
                />;
            }
            case 'SHOPPING_LIST':
                 return <ShoppingListModal
                    recipes={recipes}
                    mealPlan={mealPlan}
                    onClose={() => setModalState({ type: null })}
                />;
            case 'SUBSTITUTES': {
                return <SubstitutesModal 
                    food={modal.food}
                    userProfile={userProfile}
                    onClose={() => setModalState({ type: null })}
                    onSelectSubstitute={(substituteFood) => setModalState({ type: 'LOG_FOOD', food: substituteFood })}
                />;
            }
            case 'DOCTOR_REPORT': {
                return <DoctorReportModal
                    userProfile={userProfile}
                    triedFoods={triedFoods}
                    onClose={() => setModalState({ type: null })}
                />
            }
            case 'FLAVOR_PAIRING': {
                return <FlavorPairingModal
                    triedFoods={triedFoods}
                    onClose={() => setModalState({ type: null })}
                />
            }
            case 'ALLERGEN_ALERT': {
                return <AllergenAlertModal
                    foodName={modal.foodName}
                    allergens={modal.allergens}
                    onClose={() => setModalState({ type: null })}
                />
            }
            case 'BADGE_UNLOCKED': {
                return <BadgeUnlockedModal
                    badge={modal.badge}
                    onClose={() => setModalState({ type: null })}
                />
            }
            case 'CERTIFICATE': {
                return <CertificateModal
                    babyName={modal.babyName}
                    date={modal.date}
                    onClose={() => setModalState({ type: null })}
                />
            }
            case 'ADD_CUSTOM_FOOD': {
                return <CustomFoodModal
                    initialName={modal.initialName}
                    onClose={() => setModalState({ type: null })}
                    onSave={addCustomFood}
                />
            }
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!userProfile) {
        return <TutorialModal onSave={handleOnboardingSave} />;
    }

    return (
        <>
            <Layout
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                profile={userProfile}
                progress={{ triedCount: triedFoods.length, totalCount: totalFoodCount + customFoods.length }}
            >
                {renderPage()}
            </Layout>
            {renderModals()}
        </>
    );
};

export default App;
