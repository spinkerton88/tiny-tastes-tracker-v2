
export type Page = 'tracker' | 'recommendations' | 'recipes' | 'learn' | 'profile';
export type Filter = 'all' | 'to_try' | 'tried';
export type RecipeFilter = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type TextureStage = 'puree' | 'mashed' | 'finger_food';

export type AppMode = 'NEWBORN' | 'EXPLORER' | 'TODDLER';

export interface AppModeConfig {
    themeColor: string; // Tailwind class for background (e.g., 'bg-teal-600')
    textColor: string;  // Tailwind class for text (e.g., 'text-teal-600')
    borderColor: string; // Tailwind class for borders
    navItems: { id: string; label: string; icon: string }[];
    homeTitle: string;
    showFoodTracker: boolean;
}

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
    image?: string; // Optional URL for scanned products
    category?: string; // Added category for better sorting in pantry
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
    behavioralTags?: string[];
    // New fields for Toddler Mode
    portion?: string; 
    consumption?: 'all' | 'most' | 'some' | 'none';
    usedStrategy?: string; // ID or Title of picky eater strategy used
}

export interface TriedFoodLog extends FoodLogData {
    id: string; // The food name
}

// --- Newborn Mode Types ---
export interface FeedLog {
    id: string;
    type: 'breast' | 'bottle';
    side?: 'left' | 'right'; // for breast
    amount?: number; // oz for bottle
    durationSeconds?: number; // for breast
    timestamp: string;
    notes?: string;
}

export interface DiaperLog {
    id: string;
    type: 'wet' | 'dirty' | 'mixed';
    timestamp: string;
    notes?: string;
}

export interface SleepLog {
    id: string;
    type: 'sleep';
    startTime: string;
    endTime?: string;
    notes?: string;
}

export interface MedicineLog {
    id: string;
    medicineName: string;
    amount?: string; // e.g. "2.5ml"
    unit?: string;
    timestamp: string;
    notes?: string;
}

export interface MedicineInstructions {
    medicine_name: string;
    safety_checklist: string[];
    dosage_warning: string;
}

export interface DailyLogAnalysis {
    overall_status: "Normal" | "Watch Closely" | "Contact Pediatrician";
    data_points: {
        metric: string;
        value_logged: number;
        normal_range: string;
        status: "Normal" | "Low" | "High";
        guidance: string;
    }[];
    disclaimer_warning: string;
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
    preferredMode?: AppMode;
    safeFoods?: string[];
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

// Picky Eater Types
export interface PickyEaterStrategy {
    type: string;
    title: string;
    why_it_works: string;
    ingredients: string[];
    instructions: string;
}

export interface SavedStrategy extends PickyEaterStrategy {
    id: string;
    targetFood: string;
    safeFood: string;
    dateSaved: string;
}

// Log Meal Types
export type FoodStatus = 'eaten' | 'touched' | 'refused';

export interface LoggedItemData {
    food: string;
    status: FoodStatus;
    tags: string[];
    portion?: string;
    consumption?: 'all' | 'most' | 'some' | 'none';
    behavioralTags?: string[];
}

export interface ScannedProductData {
    name: string;
    brand?: string;
    ingredientsText: string;
    image?: string;
}

// Shopping List Types
export interface ManualShoppingItem {
    id: string;
    name: string;
    addedAt: string;
}

export interface ShoppingListState {
    manualItems: ManualShoppingItem[];
    checkedItems: Record<string, string>; // Maps itemName -> ISODateString of when it was checked
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
type CustomFoodModalState = { type: 'ADD_CUSTOM_FOOD'; initialName?: string; scannedData?: ScannedProductData };
type LogMealModalState = { type: 'LOG_MEAL'; initialFoods?: string[] };
type ScanBarcodeModalState = { type: 'SCAN_BARCODE' };
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
  | LogMealModalState
  | ScanBarcodeModalState
  | NullModalState;
