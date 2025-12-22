
export type Page = 'tracker' | 'recommendations' | 'recipes' | 'learn' | 'profile' | 'growth';
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
    childId?: string; // Link to specific child
}

// --- Newborn Mode Types ---
export interface FeedLog {
    id: string;
    childId?: string; // Link to specific child
    type: 'breast' | 'bottle' | 'pump';
    side?: 'left' | 'right' | 'both'; // for breast
    amount?: number; // oz for bottle/pump (Total)
    leftAmount?: number; // oz for pump
    rightAmount?: number; // oz for pump
    durationSeconds?: number; // for breast
    leftDuration?: number; // split duration
    rightDuration?: number; // split duration
    timestamp: string;
    notes?: string;
}

export interface DiaperLog {
    id: string;
    childId?: string; // Link to specific child
    type: 'wet' | 'dirty' | 'mixed';
    timestamp: string;
    notes?: string;
}

export interface SleepLog {
    id: string;
    childId?: string; // Link to specific child
    type: 'sleep';
    startTime: string;
    endTime?: string;
    notes?: string;
}

// FIX: Added SleepPrediction interface to support typing in NewbornPage.tsx and geminiService.ts
export interface SleepPrediction {
    prediction_status: 'Ready' | 'Needs More Data';
    next_sweet_spot_start: string;
    average_wake_window_minutes: number;
    reasoning_summary: string;
    troubleshooting_tip: string;
}

export interface MedicineLog {
    id: string;
    childId?: string; // Link to specific child
    medicineName: string;
    amount?: string; // e.g. "2.5ml"
    unit?: string;
    timestamp: string;
    notes?: string;
}

export interface GrowthLog {
    id: string;
    childId?: string; // Link to specific child
    date: string;
    weightLb?: number; // Whole pounds
    weightOz?: number; // Ounces
    heightIn?: number; // Inches
    headCircumferenceIn?: number; // Inches
    notes?: string;
}

export interface MedicineInstructions {
    medicine_name: string;
    safe_administration_checklist: string[];
    critical_warning: string;
    source_tip: string;
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
    id: string; // Unique ID for multi-child support
    babyName?: string;
    birthDate?: string;
    gender?: 'boy' | 'girl'; // Added gender for growth percentiles
    knownAllergies?: string[]; // Changed from string to string[]
    pediatricianApproved?: boolean;
    currentTextureStage?: TextureStage;
    badges?: Badge[];
    preferredMode?: AppMode;
    safeFoods?: string[];
    feedIntervalHours?: number; // NEW: Preferred feeding interval
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
    childId?: string; // Link to specific child (optional for backward compatibility)
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
    childId?: string;
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
type AddChildModalState = { type: 'ADD_CHILD' };
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
  | AddChildModalState
  | NullModalState;
