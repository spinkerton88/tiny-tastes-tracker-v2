import React, { useState, useEffect } from 'react';
import { Page, Food, TriedFoodLog, Recipe, UserProfile, MealPlan, ModalState, FoodLogData } from './types';
import { totalFoodCount } from './constants';
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


const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('tracker');
    const [triedFoods, setTriedFoods] = useState<TriedFoodLog[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [mealPlan, setMealPlan] = useState<MealPlan>({});
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const [modalState, setModalState] = useState<ModalState>({ type: null });

    const handleResetData = () => {
        if (window.confirm("Are you sure you want to reset all app data? This action cannot be undone.")) {
            localStorage.removeItem('tiny-tastes-tracker-profile');
            localStorage.removeItem('tiny-tastes-tracker-triedFoods');
            localStorage.removeItem('tiny-tastes-tracker-recipes');
            localStorage.removeItem('tiny-tastes-tracker-mealPlan');
            window.location.reload();
        }
    };

    const saveProfile = async (profile: UserProfile) => {
        localStorage.setItem(`tiny-tastes-tracker-profile`, JSON.stringify(profile));
        setUserProfile(profile);
    };

    const saveTriedFood = async (foodName: string, data: FoodLogData) => {
        const newLogData = {
            ...data,
            tryCount: data.tryCount || 1, 
        };
        const newTriedFoods = [...triedFoods.filter(f => f.id !== foodName), { id: foodName, ...newLogData }];
        localStorage.setItem(`tiny-tastes-tracker-triedFoods`, JSON.stringify(newTriedFoods));
        setTriedFoods(newTriedFoods);
        setModalState({ type: null });
    };

    const incrementTryCount = async (foodName: string) => {
        const updatedTriedFoods = triedFoods.map(food => {
            if (food.id === foodName) {
                return { ...food, tryCount: (food.tryCount || 1) + 1 };
            }
            return food;
        });
        localStorage.setItem(`tiny-tastes-tracker-triedFoods`, JSON.stringify(updatedTriedFoods));
        setTriedFoods(updatedTriedFoods);
    };

    const addRecipe = async (recipeData: Omit<Recipe, 'id' | 'createdAt'>) => {
        const newRecipe: Recipe = {
            ...recipeData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
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
        
        const loadedProfile = getFromStorage<UserProfile | null>('profile', null);
        setUserProfile(loadedProfile);

        if (loadedProfile) {
            const loadedTriedFoods = getFromStorage<TriedFoodLog[]>('triedFoods', []).map(log => ({
                ...log,
                tryCount: log.tryCount || 1
            }));
            setTriedFoods(loadedTriedFoods);
            
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
                };
            }).filter((r): r is Recipe => r !== null);
            setRecipes(cleanedRecipes);

            setMealPlan(getFromStorage<MealPlan>('mealPlan', {}));
        }

        setLoading(false);
    }, []);

    const handleOnboardingSave = async (profile: UserProfile) => {
        await saveProfile(profile);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'tracker':
                return <TrackerPage triedFoods={triedFoods} onFoodClick={(food: Food) => setModalState({ type: 'LOG_FOOD', food })} />;
            case 'recommendations':
                return <RecommendationsPage
                    userProfile={userProfile} 
                    triedFoods={triedFoods} 
                    onSaveProfile={saveProfile} 
                    onFoodClick={(food: Food) => setModalState({ type: 'LOG_FOOD', food })}
                    onShowSubstitutes={(food: Food) => setModalState({ type: 'SUBSTITUTES', food })}
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
                    onSaveProfile={saveProfile} 
                    onResetData={handleResetData} 
                />;
            default:
                return <TrackerPage triedFoods={triedFoods} onFoodClick={(food: Food) => setModalState({ type: 'LOG_FOOD', food })} />;
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
                    onShowGuide={(food) => setModalState({ type: 'HOW_TO_SERVE', food })}
                />;
            }
            case 'HOW_TO_SERVE': {
                return <HowToServeModal 
                    food={modal.food} 
                    onClose={() => setModalState({ type: 'LOG_FOOD', food: modal.food })} 
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
                progress={{ triedCount: triedFoods.length, totalCount: totalFoodCount }}
            >
                {renderPage()}
            </Layout>
            {renderModals()}
        </>
    );
};

export default App;