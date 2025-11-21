export type Page = 'tracker' | 'recommendations' | 'recipes' | 'learn' | 'profile';
export type Filter = 'all' | 'to_try' | 'tried';
export type RecipeFilter = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Food {
    name: string;
    emoji: string;
}

export interface FoodCategory {
    category: string;
    color: string;
    textColor: string;
    borderColor: string;
    items: Food[];
}

export interface FoodLogData {
    reaction: number;
    date: string;
    moreThanOneBite: boolean;
    meal: string;
    allergyReaction: string;
    notes: string;
    tryCount: number;
}

export interface TriedFoodLog extends FoodLogData {
    id: string; // The food name
}

export interface Recipe {
    id: string;
    title: string;
    ingredients: string;
    instructions: string;
    tags: string[];
    mealTypes: RecipeFilter[];
    createdAt: string; // Changed from Firebase Timestamp to ISO string
}

export interface UserProfile {
    babyName?: string;
    birthDate?: string;
    knownAllergies?: string;
    pediatricianApproved?: boolean;
}

export interface MealPlan {
    [date: string]: {
        [meal: string]: {
            id: string;
            title: string;
        }
    }
}

export interface FoodSubstitute {
    name: string;
    reason: string;
}

// Modal State Types
type LogFoodModalState = { type: 'LOG_FOOD'; food: Food };
type HowToServeModalState = { type: 'HOW_TO_SERVE'; food: Food };
type AddRecipeModalState = { type: 'ADD_RECIPE'; recipeData?: Partial<Recipe> };
type ViewRecipeModalState = { type: 'VIEW_RECIPE'; recipe: Recipe };
type ImportRecipeModalState = { type: 'IMPORT_RECIPE' };
type SuggestRecipeModalState = { type: 'SUGGEST_RECIPE' };
type ShoppingListModalState = { type: 'SHOPPING_LIST' };
type SelectRecipeModalState = { type: 'SELECT_RECIPE'; date: string; meal: string; };
type SubstitutesModalState = { type: 'SUBSTITUTES'; food: Food };
type NullModalState = { type: null };

export type ModalState =
  | LogFoodModalState
  | HowToServeModalState
  | AddRecipeModalState
  | ViewRecipeModalState
  | ImportRecipeModalState
  | SuggestRecipeModalState
  | ShoppingListModalState
  | SelectRecipeModalState
  | SubstitutesModalState
  | NullModalState;