
import { FoodCategory, Milestone, TextureStage, Badge } from './types';

export const COMMON_ALLERGENS = [
    "Dairy",
    "Lactose",
    "Egg",
    "Peanut",
    "Tree Nut",
    "Soy",
    "Wheat",
    "Fish",
    "Shellfish",
    "Sesame"
];

export const STATUS_CONFIG = {
    eaten: { color: 'bg-green-50 border-green-200', icon: 'check', label: 'Ate it', text: 'text-green-700' },
    touched: { color: 'bg-yellow-50 border-yellow-200', icon: 'hand', label: 'Played/Touched', text: 'text-yellow-700' },
    refused: { color: 'bg-red-50 border-red-200', icon: 'x', label: 'Refused', text: 'text-red-700' }
};

export const BEHAVIOR_TAGS = {
    touched: ['Licked it', 'Played with it', 'Pushed away', 'Only one bite'],
    refused: ['Threw it', 'Spat out', 'Cried', 'Gagged', 'Ignored it', 'Said No']
};

export const GREEN_VEGETABLES = [
    "ASPARAGUS", "BROCCOLI", "ZUCCHINI", "CUCUMBER", "PEAS", "SNAP PEAS", 
    "KALE", "SPINACH", "AVOCADO", "BRUSSELS SPROUTS", "CELERY", "PARSLEY", "CILANTRO",
    "ARTICHOKE", "GREEN BEANS", "EDAMAME"
];

export const FOOD_COLORS: Record<string, string> = {
    // RED
    "TOMATOES": "red", "STRAWBERRIES": "red", "RASPBERRIES": "red", "APPLES": "red", "WATERMELON": "red", "RED PEPPER": "red", "CHERRIES": "red", "POMEGRANATE": "red", "BEETS": "red",
    
    // ORANGE
    "CARROTS": "orange", "SWEET POTATO": "orange", "ORANGE": "orange", "MANGO": "orange", "PEACHES": "orange", "CANTALOUPE": "orange", "PAPAYA": "orange", "PUMPKIN": "orange", "BUTTERNUT SQUASH": "orange", "APRICOT": "orange",
    
    // YELLOW
    "BANANA": "yellow", "CORN": "yellow", "PINEAPPLE": "yellow", "LEMON & LIME": "yellow", "STARFRUIT": "yellow", "SQUASH": "yellow", "YELLOW PEPPER": "yellow",
    
    // GREEN
    "SPINACH": "green", "BROCCOLI": "green", "KALE": "green", "PEAS": "green", "AVOCADO": "green", "KIWIFRUIT": "green", "ASPARAGUS": "green", "ZUCCHINI": "green", "GREEN BEANS": "green", "CUCUMBER": "green", "CELERY": "green", "BRUSSELS SPROUTS": "green", "EDAMAME": "green", "HONEYDEW": "green", "PEARS": "green",
    
    // PURPLE / BLUE
    "BLUEBERRIES": "purple", "EGGPLANT": "purple", "GRAPES": "purple", "BLACKBERRIES": "purple", "PLUMS": "purple", "FIGS": "purple", "PURPLE CABBAGE": "purple"
};

export const BADGES_LIST: Badge[] = [
    { 
        id: 'green_machine', 
        title: 'The Green Machine', 
        description: 'Tried 10 green vegetables.', 
        icon: 'leaf', 
        isUnlocked: false,
        color: 'text-green-600 bg-green-100 border-green-200'
    },
    { 
        id: 'fruit_ninja', 
        title: 'Fruit Ninja', 
        description: 'Tried 15 different fruits.', 
        icon: 'citrus', 
        isUnlocked: false,
        color: 'text-orange-600 bg-orange-100 border-orange-200'
    },
    {
        id: 'protein_power', 
        title: 'Protein Power', 
        description: 'Tried 5 different protein sources.', 
        icon: 'dumbbell', 
        isUnlocked: false,
        color: 'text-blue-600 bg-blue-100 border-blue-200'
    },
    { id: 'tried_10', title: '10 Foods Down!', description: 'You are off to a great start.', icon: 'star', isUnlocked: false, color: 'text-teal-600 bg-teal-100 border-teal-200' },
    { id: 'tried_20', title: '20 Foods Tried', description: 'Building that palate!', icon: 'utensils', isUnlocked: false, color: 'text-indigo-600 bg-indigo-100 border-indigo-200' },
    { id: 'tried_30', title: '30 Foods Milestone', description: 'Getting adventurous.', icon: 'compass', isUnlocked: false, color: 'text-violet-600 bg-violet-100 border-violet-200' },
    { id: 'tried_40', title: '40 Foods', description: 'Almost halfway there!', icon: 'sandwich', isUnlocked: false, color: 'text-pink-600 bg-pink-100 border-pink-200' },
    { id: 'tried_50', title: 'Halfway Hero', description: '50 foods tried! Amazing progress.', icon: 'award', isUnlocked: false, color: 'text-purple-600 bg-purple-100 border-purple-200' },
    { id: 'tried_60', title: '60 Foods', description: 'Exploring new flavors.', icon: 'carrot', isUnlocked: false, color: 'text-fuchsia-600 bg-fuchsia-100 border-fuchsia-200' },
    { id: 'tried_70', title: '70 Foods', description: 'Serious foodie in the making.', icon: 'chef-hat', isUnlocked: false, color: 'text-rose-600 bg-rose-100 border-rose-200' },
    { id: 'tried_80', title: '80 Foods', description: 'Only 20 to go!', icon: 'flame', isUnlocked: false, color: 'text-orange-600 bg-orange-100 border-orange-200' },
    { id: 'tried_90', title: '90 Foods', description: 'The finish line is in sight.', icon: 'zap', isUnlocked: false, color: 'text-yellow-600 bg-yellow-100 border-yellow-200' },
    { 
        id: '100_club', 
        title: 'The 100 Club', 
        description: 'Tried all 100 foods!', 
        icon: 'trophy', 
        isUnlocked: false,
        color: 'text-yellow-600 bg-yellow-100 border-yellow-200'
    },
];

export const TEXTURE_STAGES: { id: TextureStage; title: string; desc: string; icon: string }[] = [
    { id: 'puree', title: 'Smooth Purees', desc: 'Blended, liquidy foods.', icon: 'soup' },
    { id: 'mashed', title: 'Mashed / Lumpy', desc: 'Thicker textures mashed with a fork.', icon: 'utensils' },
    { id: 'finger_food', title: 'Finger Foods', desc: 'Soft pieces baby picks up.', icon: 'hand' }
];

export const DEFAULT_MILESTONES: Milestone[] = [
    { id: 'sit_unassisted', title: 'Sits Unassisted', icon: 'baby', description: 'Can sit in a high chair with minimal support.', isAchieved: false },
    { id: 'first_taste', title: 'First Taste', icon: 'utensils', description: 'Tried their very first solid food.', isAchieved: false },
    { id: 'bring_to_mouth', title: 'Self-Feeding', icon: 'hand', description: 'Successfully brought food to mouth independently.', isAchieved: false },
    { id: 'pincer_grasp', title: 'Pincer Grasp', icon: 'fingerprint', description: 'Uses thumb and forefinger to pick up small pieces of food.', isAchieved: false },
    { id: 'open_cup', title: 'Open Cup', icon: 'cup-soda', description: 'Took a sip from an open cup (even if messy!).', isAchieved: false },
    { id: 'straw_cup', title: 'Straw Cup', icon: 'milk', description: 'Successfully drank from a straw.', isAchieved: false },
    { id: 'spoon_feed', title: 'Spoon Master', icon: 'utensils-crossed', description: 'Loaded a spoon and brought it to mouth.', isAchieved: false },
    { id: 'chew_swallow', title: 'Advanced Chewing', icon: 'apple', description: 'Chewed and swallowed a complex texture (like meat or bread).', isAchieved: false },
];

export const FOOD_ALLERGY_MAPPING: Record<string, string[]> = {
    // Dairy
    "YOGURT": ["Dairy", "Lactose"],
    "MOZZARELLA": ["Dairy", "Lactose"],
    "RICOTTA CHEESE": ["Dairy", "Lactose"],
    "COTTAGE CHEESE": ["Dairy", "Lactose"],
    
    // Eggs
    "EGGS": ["Egg"],
    
    // Wheat/Gluten
    "KAMUT": ["Wheat"],
    "PASTA": ["Wheat"],
    "COUSCOUS": ["Wheat"],
    "BREAD": ["Wheat"],
    "FARRO": ["Wheat"],
    "BULGUR": ["Wheat"],
    "FREEKEH": ["Wheat"],
    "WAFFLES": ["Wheat", "Egg", "Dairy"], 
    "HEALTHY MUFFINS": ["Wheat", "Egg"], 
    "GNOCCHI": ["Wheat"],
    "TORTILLA": ["Wheat"],
    
    // Soy
    "TOFU": ["Soy"],
    "EDAMAME": ["Soy"],
    
    // Peanuts
    "PEANUTS": ["Peanut"],
    "PEANUT BUTTER": ["Peanut"],
    
    // Tree Nuts
    "ALMONDS": ["Tree Nut"],
    "ALMOND BUTTER": ["Tree Nut"],
    "COCONUT": ["Tree Nut"], 
    
    // Fish
    "FISH": ["Fish"],
    "TUNA": ["Fish"],
    "SARDINES": ["Fish"],
    "SALMON": ["Fish"],
    
    // Shellfish
    "SHRIMP": ["Shellfish"],
    
    // Sesame
    "SEEDS": ["Sesame"],
};

export const NUTRIENT_STYLES: Record<string, { bg: string, text: string, border: string, icon: string, label: string }> = {
    "Iron": { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", icon: "battery-charging", label: "Iron" },
    "Vitamin C": { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", icon: "sun", label: "Vit C" },
    "Omega-3": { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", icon: "fish", label: "Omega-3" },
    "Protein": { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", icon: "dumbbell", label: "Protein" },
    "Fiber": { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200", icon: "leaf", label: "Fiber" },
    "Vitamin A": { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", icon: "eye", label: "Vit A" },
    "Calcium": { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200", icon: "bone", label: "Calcium" },
    "Healthy Fats": { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-200", icon: "droplet", label: "Healthy Fats" },
    "Zinc": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200", icon: "shield", label: "Zinc" },
    "Potassium": { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200", icon: "zap", label: "Potassium" },
    "Vitamin D": { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200", icon: "sun-medium", label: "Vit D" },
    "Folate": { bg: "bg-green-50", text: "text-green-800", border: "border-green-200", icon: "sprout", label: "Folate" },
    "Choline": { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-200", icon: "brain", label: "Choline" },
    "Vitamin B6": { bg: "bg-fuchsia-100", text: "text-fuchsia-800", border: "border-fuchsia-200", icon: "zap", label: "Vit B6" },
    "Vitamin B12": { bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-200", icon: "zap", label: "Vit B12" },
    "Vitamin K": { bg: "bg-lime-100", text: "text-lime-800", border: "border-lime-200", icon: "droplet", label: "Vit K" },
    "Vitamin E": { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200", icon: "droplet", label: "Vit E" },
    "Magnesium": { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200", icon: "layers", label: "Magnesium" },
    "Antioxidants": { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-200", icon: "heart", label: "Antioxidants" },
    "Hydration": { bg: "bg-sky-100", text: "text-sky-800", border: "border-sky-200", icon: "glass-water", label: "Hydration" },
    "Selenium": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", icon: "sparkles", label: "Selenium" },
    "Probiotics": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", icon: "biceps-flexed", label: "Probiotics" }
};

export const FOOD_NUTRIENT_MAPPING: Record<string, string[]> = {
    // VEGETABLES
    "ASPARAGUS": ["Fiber", "Folate", "Vitamin K", "Antioxidants"],
    "BUTTERNUT SQUASH": ["Vitamin A", "Fiber", "Potassium", "Vitamin C"],
    "CAULIFLOWER": ["Vitamin C", "Fiber", "Vitamin K", "Choline"],
    "SWEET POTATO": ["Vitamin A", "Fiber", "Potassium", "Vitamin B6"],
    "POTATOES": ["Potassium", "Vitamin C", "Fiber", "Vitamin B6"],
    "PARSNIPS": ["Fiber", "Vitamin C", "Folate"],
    "BELL PEPPERS": ["Vitamin C", "Vitamin A", "Fiber", "Vitamin B6"],
    "BEETS": ["Folate", "Fiber", "Potassium"],
    "CHAYOTE SQUASH": ["Folate", "Fiber", "Vitamin C"],
    "PUMPKIN": ["Vitamin A", "Fiber", "Potassium"],
    "CARROTS": ["Vitamin A", "Fiber", "Vitamin K", "Potassium"],
    "ZUCCHINI": ["Folate", "Potassium", "Vitamin A"],
    "MUSHROOMS": ["Vitamin D", "Magnesium", "Potassium"],
    "ONION": ["Vitamin C", "Potassium"],
    "BRUSSELS SPROUTS": ["Vitamin K", "Vitamin C", "Fiber", "Folate"],
    "CORN": ["Fiber", "Magnesium"],
    "CUCUMBER": ["Hydration", "Vitamin K"],
    "CELERY": ["Hydration", "Vitamin K", "Folate"],
    "PEAS": ["Protein", "Fiber", "Vitamin A", "Vitamin K"],
    "SNAP PEAS": ["Vitamin C", "Fiber", "Vitamin K"],
    "CILANTRO": ["Vitamin K", "Antioxidants"],
    "EGGPLANT": ["Fiber", "Antioxidants"],
    "GARLIC": ["Vitamin B6", "Vitamin C"],
    "PARSLEY": ["Vitamin K", "Vitamin C", "Vitamin A"],
    "KALE": ["Vitamin K", "Vitamin C", "Calcium", "Fiber"],
    "ARTICHOKE": ["Fiber", "Vitamin K", "Folate"],
    "BROCCOLI": ["Vitamin C", "Iron", "Fiber", "Calcium", "Vitamin K"],

    // GRAINS
    "KAMUT": ["Protein", "Fiber", "Zinc"],
    "CEREALS": ["Iron", "Zinc"],
    "MILLET": ["Magnesium", "Antioxidants"],
    "OATMEAL": ["Iron", "Fiber", "Zinc", "Magnesium"],
    "BUCKWHEAT": ["Fiber", "Magnesium"],
    "WAFFLES": ["Iron"],
    "HEALTHY MUFFINS": ["Fiber"],
    "PASTA": ["Iron"],
    "COUSCOUS": ["Selenium"],
    "POLENTA": ["Vitamin A"],
    "CORNMEAL": ["Iron"],
    "BREAD": ["Iron", "Fiber"],
    "GNOCCHI": ["Potassium"],
    "TORTILLA": ["Calcium"],
    "FARRO": ["Fiber", "Protein", "Magnesium", "Zinc"],
    "BARLEY": ["Fiber", "Selenium"],
    "BULGUR": ["Fiber", "Magnesium"],
    "BROWN RICE": ["Fiber", "Magnesium"],
    "QUINOA": ["Protein", "Iron", "Fiber", "Magnesium", "Folate"],
    "FREEKEH": ["Fiber", "Protein"],

    // FRUITS
    "AVOCADO": ["Healthy Fats", "Fiber", "Potassium", "Vitamin E"],
    "TOMATOES": ["Vitamin C", "Antioxidants", "Vitamin K"],
    "ORANGE": ["Vitamin C", "Fiber", "Folate"],
    "LEMON & LIME": ["Vitamin C"],
    "PAPAYA": ["Vitamin C", "Vitamin A", "Folate"],
    "PINEAPPLE": ["Vitamin C", "Magnesium"],
    "KIWIFRUIT": ["Vitamin C", "Fiber", "Vitamin K"],
    "MANGO": ["Vitamin C", "Vitamin A", "Folate"],
    "STARFRUIT": ["Vitamin C"],
    "FIGS": ["Fiber", "Potassium", "Calcium"],
    "BANANA": ["Potassium", "Fiber", "Vitamin B6", "Vitamin C"],
    "COCONUT": ["Healthy Fats", "Magnesium"],
    "WATERMELON": ["Hydration", "Vitamin C"],
    "HONEYDEW": ["Vitamin C", "Potassium"],
    "CANTALOUPE": ["Vitamin A", "Vitamin C"],
    "APPLESAUCE": ["Vitamin C"],
    "RASPBERRIES": ["Fiber", "Vitamin C"],
    "BLUEBERRIES": ["Antioxidants", "Vitamin C", "Fiber", "Vitamin K"],
    "STRAWBERRIES": ["Vitamin C", "Folate", "Antioxidants"],
    "GRAPES": ["Vitamin K", "Hydration"],
    "PEACHES": ["Vitamin C", "Vitamin A", "Potassium"],
    "PEARS": ["Fiber", "Vitamin C"],
    "APPLES": ["Fiber", "Vitamin C"],

    // PLANT PROTEIN
    "TOFU": ["Protein", "Iron", "Calcium"],
    "EDAMAME": ["Protein", "Iron", "Fiber", "Folate"],
    "PEANUTS": ["Protein", "Healthy Fats", "Vitamin E"],
    "ALMONDS": ["Healthy Fats", "Protein", "Vitamin E", "Magnesium"],
    "WHITE BEANS": ["Iron", "Protein", "Fiber", "Calcium"],
    "CHICKPEAS": ["Iron", "Protein", "Fiber", "Folate"],
    "BLACK BEANS": ["Iron", "Protein", "Fiber", "Magnesium"],
    "KIDNEY BEANS": ["Iron", "Protein", "Fiber", "Folate"],
    "LENTILS": ["Iron", "Protein", "Fiber", "Folate"],
    "ALMOND BUTTER": ["Healthy Fats", "Protein", "Vitamin E"],
    "PEANUT BUTTER": ["Protein", "Healthy Fats", "Vitamin E"],
    "SEEDS": ["Fiber", "Healthy Fats", "Iron", "Magnesium"],

    // MEAT
    "FISH": ["Protein", "Omega-3", "Vitamin B12"],
    "TUNA": ["Protein", "Omega-3", "Vitamin B12"],
    "SARDINES": ["Omega-3", "Calcium", "Iron", "Protein", "Vitamin D"],
    "SALMON": ["Omega-3", "Protein", "Vitamin D", "Vitamin B12"],
    "SHRIMP": ["Protein", "Vitamin B12"],
    "BEEF, SLICED": ["Iron", "Protein", "Zinc", "Vitamin B12"],
    "BEEF, GROUND": ["Iron", "Protein", "Zinc", "Vitamin B12"],
    "CHICKEN": ["Protein", "Iron", "Zinc", "Vitamin B6"],
    "LAMB": ["Iron", "Protein", "Zinc", "Vitamin B12"],
    "TURKEY": ["Protein", "Iron", "Zinc"],
    "PORK": ["Protein", "Zinc"],

    // DAIRY & EGGS
    "YOGURT": ["Calcium", "Protein", "Probiotics", "Vitamin B12"],
    "EGGS": ["Protein", "Choline", "Iron", "Vitamin D"],
    "MOZZARELLA": ["Calcium", "Protein"],
    "RICOTTA CHEESE": ["Calcium", "Protein", "Vitamin A"],
    "COTTAGE CHEESE": ["Protein", "Calcium"],

    // OTHER
    "WATER": ["Hydration"],
    "SPICES & HERBS": ["Antioxidants"]
};

export const allFoods: FoodCategory[] = [
    {
        category: "Vegetables",
        color: "bg-green-100", textColor: "text-green-800", borderColor: "border-green-300",
        items: [
            { name: "ASPARAGUS", emoji: "🥬" }, { name: "BUTTERNUT SQUASH", emoji: "🎃" }, { name: "CAULIFLOWER", emoji: "🥦" },
            { name: "SWEET POTATO", emoji: "🍠" }, { name: "POTATOES", emoji: "🥔" }, { name: "PARSNIPS", emoji: "🥕" },
            { name: "BELL PEPPERS", emoji: "🫑" }, { name: "BEETS", emoji: "💜" }, { name: "CHAYOTE SQUASH", emoji: "🍐" },
            { name: "PUMPKIN", emoji: "🎃" }, { name: "CARROTS", emoji: "🥕" }, { name: "ZUCCHINI", emoji: "🥒" },
            { name: "MUSHROOMS", emoji: "🍄" }, { name: "ONION", emoji: "🧅" }, { name: "BRUSSELS SPROUTS", emoji: "🥬" },
            { name: "CORN", emoji: "🌽" }, { name: "CUCUMBER", emoji: "🥒" }, { name: "CELERY", emoji: "🥬" },
            { name: "PEAS", emoji: "🫛" }, { name: "SNAP PEAS", emoji: "🫛" }, { name: "CILANTRO", emoji: "🌿" },
            { name: "EGGPLANT", emoji: "🍆" }, { name: "GARLIC", emoji: "🧄" }, { name: "PARSLEY", emoji: "🌿" },
            { name: "KALE", emoji: "🥬" }, { name: "ARTICHOKE", emoji: "🌿" }, { name: "BROCCOLI", emoji: "🥦" }
        ]
    },
    {
        category: "Grains",
        color: "bg-yellow-100", textColor: "text-yellow-800", borderColor: "border-yellow-300",
        items: [
            { name: "KAMUT", emoji: "🌾" }, { name: "CEREALS", emoji: "🥣" }, { name: "MILLET", emoji: "🌾" },
            { name: "OATMEAL", emoji: "🥣" }, { name: "BUCKWHEAT", emoji: "🌾" }, { name: "WAFFLES", emoji: "🧇" },
            { name: "HEALTHY MUFFINS", emoji: "🧁" }, { name: "PASTA", emoji: "🍝" }, { name: "COUSCOUS", emoji: "🍚" },
            { name: "POLENTA", emoji: "🌽" }, { name: "CORNMEAL", emoji: "🌽" }, { name: "BREAD", emoji: "🍞" },
            { name: "GNOCCHI", emoji: "🥔" }, { name: "TORTILLA", emoji: "🌮" }, { name: "FARRO", emoji: "🌾" },
            { name: "BARLEY", emoji: "🌾" }, { name: "BULGUR", emoji: "🌾" }, { name: "BROWN RICE", emoji: "🍚" },
            { name: "QUINOA", emoji: "🍚" }, { name: "FREEKEH", emoji: "🌾" }
        ]
    },
    {
        category: "Fruits",
        color: "bg-pink-100", textColor: "text-pink-800", borderColor: "border-pink-300",
        items: [
            { name: "AVOCADO", emoji: "🥑" }, { name: "TOMATOES", emoji: "🍅" }, { name: "ORANGE", emoji: "🍊" },
            { name: "LEMON & LIME", emoji: "🍋" }, { name: "PAPAYA", emoji: "🥭" }, { name: "PINEAPPLE", emoji: "🍍" },
            { name: "KIWIFRUIT", emoji: "🥝" }, { name: "MANGO", emoji: "🥭" }, { name: "STARFRUIT", emoji: "⭐" },
            { name: "FIGS", emoji: "💜" }, { name: "BANANA", emoji: "🍌" }, { name: "COCONUT", emoji: "🥥" },
            { name: "WATERMELON", emoji: "🍉" }, { name: "HONEYDEW", emoji: "🍈" }, { name: "CANTALOUPE", emoji: "🍈" },
            { name: "APPLESAUCE", emoji: "🍎" }, { name: "RASPBERRIES", emoji: "🍓" }, { name: "BLUEBERRIES", emoji: "🫐" },
            { name: "STRAWBERRIES", emoji: "🍓" }, { name: "GRAPES", emoji: "🍇" }, { name: "PEACHES", emoji: "🍑" },
            { name: "PEARS", emoji: "🍐" }, { name: "APPLES", emoji: "🍎" }
        ]
    },
    {
        category: "Plant Protein",
        color: "bg-blue-100", textColor: "text-blue-800", borderColor: "border-blue-300",
        items: [
            { name: "TOFU", emoji: "⬜" }, { name: "EDAMAME", emoji: "🫛" }, { name: "PEANUTS", emoji: "🥜" },
            { name: "ALMONDS", emoji: "🌰" }, { name: "WHITE BEANS", emoji: "🫘" }, { name: "CHICKPEAS", emoji: "🫘" },
            { name: "BLACK BEANS", emoji: "🫘" }, { name: "KIDNEY BEANS", emoji: "🫘" },
            { name: "LENTILS", emoji: "🍚" }, { name: "ALMOND BUTTER", emoji: "🌰" }, { name: "PEANUT BUTTER", emoji: "🥜" }, { name: "SEEDS", emoji: "🌱" }
        ]
    },
    {
        category: "Meat",
        color: "bg-red-100", textColor: "text-red-800", borderColor: "border-red-300",
        items: [
            { name: "FISH", emoji: "🐟" }, { name: "TUNA", emoji: "🐟" }, { name: "SARDINES", emoji: "🐟" },
            { name: "SALMON", emoji: "🐟" }, { name: "SHRIMP", emoji: "🍤" }, { name: "BEEF, SLICED", emoji: "🥩" },
            { name: "BEEF, GROUND", emoji: "🍔" }, { name: "CHICKEN", emoji: "🍗" }, { name: "LAMB", emoji: "🐑" },
            { name: "TURKEY", emoji: "🦃" }, { name: "PORK", emoji: "🐖" }
        ]
    },
    {
        category: "Dairy & Eggs",
        color: "bg-purple-100", textColor: "text-purple-800", borderColor: "border-purple-300",
        items: [
            { name: "YOGURT", emoji: "🥣" }, { name: "EGGS", emoji: "🥚" }, { name: "MOZZARELLA", emoji: "🧀" },
            { name: "RICOTTA CHEESE", emoji: "🧀" }, { name: "COTTAGE CHEESE", emoji: "🧀" }
        ]
    },
    {
        category: "Other",
        color: "bg-gray-100", textColor: "text-gray-800", borderColor: "border-gray-300",
        items: [
            { name: "WATER", emoji: "💧" },
            { name: "SPICES & HERBS", emoji: "🌿" }
        ]
    }
];

export const flatFoodList = allFoods.flatMap(cat => cat.items.map(item => item.name));
export const totalFoodCount = flatFoodList.length;

// Updated foodGuideData to cover more items
export const foodGuideData: { [key: string]: { allergyRisk: string; chokingRisk: string; serve6to8: string; serve9to12: string; } } = {
    "ASPARAGUS": { allergyRisk: "Low", chokingRisk: "Low (when soft-cooked)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Steam or roast whole asparagus spears until very tender. Offer the whole spear for baby to gnaw on. The fibrous end is tough to chew through, reducing risk.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Continue serving whole, soft-cooked spears. As pincer grasp develops, you can chop the soft-cooked tips and stems into small, bite-sized pieces.</p>" },
    "AVOCADO": { allergyRisk: "Low", chokingRisk: "Low", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Offer large, ripe wedges that baby can grip with their whole hand (palmar grasp). You can roll the wedge in hemp seeds or crushed cereal to make it less slippery.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Cut into smaller, bite-sized chunks as baby develops their pincer grasp.</p>" },
    "BANANA": { allergyRisk: "Low", chokingRisk: "Low", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Offer half a peeled banana. You can leave a bit of peel on the bottom to help baby grip it (wash peel first). Or push a finger down the center to split it into natural thirds.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Cut into small slices or chunks.</p>" },
    "SWEET POTATO": { allergyRisk: "Low", chokingRisk: "Low (when soft)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Steam or roast wedges until very soft. They should be easily squashed between your fingers.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Cut into smaller cubes. You can also mash it.</p>" },
    "CARROTS": { allergyRisk: "Low", chokingRisk: "High (if raw)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p><strong>MUST be cooked soft.</strong> Steam or roast whole carrots until they are completely soft. Do not serve raw.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Cut cooked carrots into small pieces. Grated raw carrot is also okay.</p>" },
    "BROCCOLI": { allergyRisk: "Low", chokingRisk: "Low", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Steam large florets until soft. The 'handle' (stalk) is easy for babies to hold.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Chop into smaller pieces, including the florets.</p>" },
    "BUTTERNUT SQUASH": { allergyRisk: "Low", chokingRisk: "Low (cooked)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Roast large crescent-shaped wedges until soft. Remove seeds and skin. The natural curve makes it easy for baby to hold.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Cut into small, bite-sized cubes.</p>" },
    "CAULIFLOWER": { allergyRisk: "Low", chokingRisk: "Low (cooked)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Steam large florets until soft. Baby can hold the stem.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Chop into small pieces.</p>" },
    "ZUCCHINI": { allergyRisk: "Low", chokingRisk: "Low", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Steam large spears or wedges until soft. If the skin is tough, peel it off in stripes.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Chopped pieces or half-moons.</p>" },
    "BELL PEPPERS": { allergyRisk: "Low", chokingRisk: "Low (cooked)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Roast large quarters until skin peels off easily. Remove skin and serve soft strips.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Chopped cooked peppers.</p>" },
    "EGGS": { allergyRisk: "High (Common Allergen)", chokingRisk: "Low", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Serve omelet strips roughly the size of two adult fingers. Ensure egg is fully cooked.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Scrambled eggs or hard-boiled egg pieces.</p>" },
    "PEANUT BUTTER": { allergyRisk: "High (Common Allergen)", chokingRisk: "High (if thick)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p><strong>Never serve plain thick peanut butter.</strong> Thin it out with water, breastmilk, or formula, or stir it into oatmeal/yogurt.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Spread thinly on toast strips.</p>" },
    "YOGURT": { allergyRisk: "High (Dairy)", chokingRisk: "Low", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Serve plain, whole-milk yogurt on a pre-loaded spoon for baby to grab, or let them use their hands.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Continue with pre-loaded spoons or practice dipping fruit.</p>" },
    "SALMON": { allergyRisk: "High (Fish)", chokingRisk: "Low (bones)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Cook until well-done and flake it to ensure there are absolutely no bones. Serve large flakes.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Continue serving flakes or mix into mashed potatoes.</p>" },
    "CHICKEN": { allergyRisk: "Low", chokingRisk: "Medium", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Serve a large drumstick (skin and cartilage removed) for baby to gnaw on, or slow-cooked shredded thigh meat.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Chopped pieces of soft chicken or ground chicken.</p>" },
    "APPLE": { allergyRisk: "Low", chokingRisk: "High (raw)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p><strong>Cook until soft.</strong> Steam or bake wedges. Do not serve raw slices.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Grated raw apple or very thin slices.</p>" },
    "BLUEBERRIES": { allergyRisk: "Low", chokingRisk: "High (whole)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p><strong>Flatten or quarter</strong> every single berry. Never serve whole round berries.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Continue to flatten or quarter.</p>" },
    "STRAWBERRIES": { allergyRisk: "Low", chokingRisk: "Low", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Serve large, whole berries (larger than baby's mouth) so they can gnaw on them.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Chop into small pieces.</p>" },
    "OATMEAL": { allergyRisk: "Low", chokingRisk: "Low", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Serve thick enough to stick to a spoon (pre-load spoon) or roll into balls.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Baby can practice scooping with a spoon or eating oatmeal fingers.</p>" },
    "PASTA": { allergyRisk: "High (Wheat/Egg)", chokingRisk: "Low", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Large pasta shapes like Fusilli or Penne cooked very soft. Serve plain or with a little oil/sauce.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Cut up spaghetti or continue with shapes. Macaroni is great for pincer grasp.</p>" },
    "WATERMELON": { allergyRisk: "Low", chokingRisk: "Low", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Remove seeds. Serve large rectangular strips with rind removed.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Cut into bite-sized pieces.</p>" },
    "TOFU": { allergyRisk: "High (Soy)", chokingRisk: "Low", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Serve large strips of firm tofu. It is soft and easy to gum.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Cut into cubes.</p>" },
    "CUCUMBER": { allergyRisk: "Low", chokingRisk: "Medium", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Serve long, wide spears with the skin removed if it's tough. Avoid round slices.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Small pieces or thin half-moons.</p>" },
    "CHEESE": { allergyRisk: "High (Dairy)", chokingRisk: "Medium", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Grated cheese or very thin slices. Avoid cubes.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Small pieces or shreds.</p>" },
    "BREAD": { allergyRisk: "High (Wheat)", chokingRisk: "Medium (gummy)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Toast lightly and serve in strips. Soft bread can ball up and cause gagging, toast holds shape better.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Small pieces of toast with toppings.</p>" },
    "BEEF, GROUND": { allergyRisk: "Low", chokingRisk: "Low", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Cook into meatballs or logs that are easy to hold.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Crumbled ground beef.</p>" },
    "ORANGE": { allergyRisk: "Low", chokingRisk: "Medium (membranes)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Cut into wedges with the membrane and peel removed (supremes).</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Cut segments into smaller pieces.</p>" },
    "TOMATOES": { allergyRisk: "Low (Acidic)", chokingRisk: "Medium (Cherry tomatoes)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Large wedges of big tomatoes. If serving cherry tomatoes, <strong>quarter them lengthwise</strong>.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Small pieces.</p>" },
    "PEARS": { allergyRisk: "Low", chokingRisk: "Low (if ripe)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>If very soft/ripe, serve in large halves/quarters. If hard, steam until soft.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Small bite-sized pieces.</p>" },
    "MUSHROOMS": { allergyRisk: "Low", chokingRisk: "Medium (if rubbery)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Cook very well (sauté or steam) until soft. Serve large whole caps or large slices.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Chopped cooked mushrooms.</p>" },
    "ONION": { allergyRisk: "Low", chokingRisk: "Low (cooked)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Roast large wedges until sweet and soft.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Chopped cooked onion mixed into other dishes.</p>" },
    "CORN": { allergyRisk: "Low", chokingRisk: "Medium (loose kernels)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Serve on the cob! Baby can gnaw on the kernels.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Cut kernels off the cob. Flatten them slightly if possible.</p>" },
    "EGGPLANT": { allergyRisk: "Low", chokingRisk: "Low", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Roast strips or rounds until very soft. Leave skin on to help it hold together, or peel if preferred.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Chopped cooked eggplant.</p>" }
};

export const recommendationData: Record<string, { title: string; message: string; foods: string[] }> = {
    too_young: {
        title: "Preparing for Solids",
        message: "Your baby is getting ready! Watch for signs like sitting up unassisted and bringing toys to their mouth. Consult your pediatrician before starting.",
        foods: []
    },
    '6_months': {
        title: "6 Months: First Tastes",
        message: "Focus on iron-rich foods and easy-to-hold shapes (strips). Let baby explore textures.",
        foods: ["AVOCADO", "SWEET POTATO", "BANANA", "BROCCOLI", "BEEF, SLICED", "OATMEAL"]
    },
    '7_8_months': {
        title: "7-8 Months: Allergens & Flavors",
        message: "Introduce top allergens one at a time. Mix flavors and offer lumpy mashed textures.",
        foods: ["EGGS", "PEANUT BUTTER", "SALMON", "YOGURT", "TOFU", "STRAWBERRIES"]
    },
    '9_11_months': {
        title: "9-11 Months: Pincer Grasp",
        message: "Baby is using thumb and forefinger. Offer smaller, bite-sized pieces (like a chickpea).",
        foods: ["BLUEBERRIES", "PEAS", "MOZZARELLA", "PASTA", "CHICKPEAS", "BEEF, GROUND", "CORN"]
    },
    '12_plus': {
        title: "12+ Months: Table Foods",
        message: "Baby can eat most family meals! Watch sodium/sugar. Continue offering variety.",
        foods: ["TOMATOES", "MUSHROOMS", "SPINACH", "SHRIMP", "BELL PEPPERS"]
    }
};

export const LEARNING_RESOURCES: Record<string, { guides: {title: string, icon: string, content: string}[], research: {title: string, icon: string, content: string}[] }> = {
    NEWBORN: {
        guides: [
            { title: "Breastfeeding 101", icon: "milk", content: "Focus on a deep latch. Feed on demand and watch for hunger cues like rooting or sucking on hands." },
            { title: "Formula Safety", icon: "droplet", content: "Always follow preparation instructions exactly. Use boiled water (cooled) if recommended." }
        ],
        research: [
            { title: "Sleep Cycles", icon: "moon", content: "Newborns have shorter sleep cycles (approx 45-50 mins) and spend more time in active sleep." }
        ]
    },
    EXPLORER: {
        guides: [
            { title: "Gagging vs Choking", icon: "alert-triangle", content: "Gagging is loud and red; choking is silent and blue. Gagging is a safety reflex." },
            { title: "The 100 Foods Challenge", icon: "trophy", content: "Exposing baby to 100 foods before age 1 reduces pickiness and potential allergies." }
        ],
        research: [
            { title: "Iron Importance", icon: "battery-charging", content: "Iron stores from birth deplete around 6 months, making dietary iron crucial." }
        ]
    },
    TODDLER: {
        guides: [
            { title: "Division of Responsibility", icon: "scale", content: "You decide what, when, and where; they decide how much and whether to eat." },
            { title: "Food Throwing", icon: "x-circle", content: "It's normal testing of boundaries. Calmly remove the food if it continues." }
        ],
        research: [
            { title: "Neophobia", icon: "frown", content: "Fear of new foods peaks around 18-24 months. Keep offering without pressure." }
        ]
    }
};
