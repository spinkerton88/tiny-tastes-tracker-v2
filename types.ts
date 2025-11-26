
export type Page = 'tracker' | 'recommendations' | 'recipes' | 'learn' | 'profile';
export type Filter = 'all' | 'to_try' | 'tried';
export type RecipeFilter = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type TextureStage = 'puree' | 'mashed' | 'finger_food';

export interface Food {
    name: string;
    emoji: string;
}

export interface CustomFoodDetails {
    safety_rating: "Safe" | "Use Caution" | "Avoid";
    allergen_info: string;
    texture_recommendation: string;
    nutrition_highlight: string;
}

export interface CustomFood extends Food {
    isCustom: true;
    details: CustomFoodDetails;
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
    messyFaceImage?: string; // Base64 string for the photo
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
    rating?: number;
}

export interface Badge {
    id: string;
    title: string;
    description: string;
    icon: string;
    isUnlocked: boolean;
    dateUnlocked?: string;
    color: string;
}

export interface UserProfile {
    babyName?: string;
    birthDate?: string;
    knownAllergies?: string[]; // Changed from string to string[]
    pediatricianApproved?: boolean;
    currentTextureStage?: TextureStage;
    badges?: Badge[];
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

export interface Milestone {
    id: string;
    title: string;
    icon: string;
    description: string;
    isAchieved: boolean;
    dateAchieved?: string;
    notes?: string;
}

// Modal State Types
type LogFoodModalState = { type: 'LOG_FOOD'; food: Food };
type HowToServeModalState = { type: 'HOW_TO_SERVE'; food: Food; customDetails?: CustomFoodDetails; returnToLog?: boolean };
type AddRecipeModalState = { type: 'ADD_RECIPE'; recipeData?: Partial<Recipe> };
type ViewRecipeModalState = { type: 'VIEW_RECIPE'; recipe: Recipe };
type ImportRecipeModalState = { type: 'IMPORT_RECIPE' };
type SuggestRecipeModalState = { type: 'SUGGEST_RECIPE' };
type ShoppingListModalState = { type: 'SHOPPING_LIST' };
type SelectRecipeModalState = { type: 'SELECT_RECIPE'; date: string; meal: string; };
type SubstitutesModalState = { type: 'SUBSTITUTES'; food: Food };
type DoctorReportModalState = { type: 'DOCTOR_REPORT' };
type FlavorPairingModalState = { type: 'FLAVOR_PAIRING' };
type AllergenAlertModalState = { type: 'ALLERGEN_ALERT'; foodName: string; allergens: string[] };
type BadgeUnlockedModalState = { type: 'BADGE_UNLOCKED'; badge: Badge };
type CertificateModalState = { type: 'CERTIFICATE'; babyName: string; date: string };
type CustomFoodModalState = { type: 'ADD_CUSTOM_FOOD'; initialName?: string };
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
  | DoctorReportModalState
  | FlavorPairingModalState
  | AllergenAlertModalState
  | BadgeUnlockedModalState
  | CertificateModalState
  | CustomFoodModalState
  | NullModalState;
