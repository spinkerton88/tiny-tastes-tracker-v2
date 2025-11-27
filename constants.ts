
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

export const GREEN_VEGETABLES = [
    "ASPARAGUS", "BROCCOLI", "ZUCCHINI", "CUCUMBER", "PEAS", "SNAP PEAS", 
    "KALE", "SPINACH", "AVOCADO", "BRUSSELS SPROUTS", "CELERY", "PARSLEY", "CILANTRO",
    "ARTICHOKE", "GREEN BEANS", "EDAMAME"
];

export const FOOD_COLORS: Record<string, string> = {
    // RED
    "TOMATOES": "red", "STRAWBERRIES": "red", "RASPBERRIES": "red", "APPLES": "red", "WATERMELON": "red", "RED PEPPER": "red", "CHERRIES": "red", "POMEGRANATE": "red", "BEETS": "red", // Beets can be red/purple, usually distinct but red fits rainbow often
    
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
    // Category Specific
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
    // Numeric Milestones
    { id: 'tried_10', title: '10 Foods Down!', description: 'You are off to a great start.', icon: 'star', isUnlocked: false, color: 'text-teal-600 bg-teal-100 border-teal-200' },
    { id: 'tried_20', title: '20 Foods Tried', description: 'Building that palate!', icon: 'utensils', isUnlocked: false, color: 'text-indigo-600 bg-indigo-100 border-indigo-200' },
    { id: 'tried_30', title: '30 Foods Milestone', description: 'Getting adventurous.', icon: 'compass', isUnlocked: false, color: 'text-violet-600 bg-violet-100 border-violet-200' },
    { id: 'tried_40', title: '40 Foods', description: 'Almost halfway there!', icon: 'sandwich', isUnlocked: false, color: 'text-pink-600 bg-pink-100 border-pink-200' },
    { id: 'tried_50', title: 'Halfway Hero', description: '50 foods tried! Amazing progress.', icon: 'award', isUnlocked: false, color: 'text-purple-600 bg-purple-100 border-purple-200' },
    { id: 'tried_60', title: '60 Foods', description: 'Exploring new flavors.', icon: 'carrot', isUnlocked: false, color: 'text-fuchsia-600 bg-fuchsia-100 border-fuchsia-200' },
    { id: 'tried_70', title: '70 Foods', description: 'Serious foodie in the making.', icon: 'chef-hat', isUnlocked: false, color: 'text-rose-600 bg-rose-100 border-rose-200' },
    { id: 'tried_80', title: '80 Foods', description: 'Only 20 to go!', icon: 'flame', isUnlocked: false, color: 'text-orange-600 bg-orange-100 border-orange-200' },
    { id: 'tried_90', title: '90 Foods', description: 'The finish line is in sight.', icon: 'zap', isUnlocked: false, color: 'text-yellow-600 bg-yellow-100 border-yellow-200' },
    // Completion
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
    
    // Wheat/Gluten (Simplified to Wheat for Top 9 tracking)
    "KAMUT": ["Wheat"],
    "PASTA": ["Wheat"],
    "COUSCOUS": ["Wheat"],
    "BREAD": ["Wheat"],
    "FARRO": ["Wheat"],
    "BULGUR": ["Wheat"],
    "FREEKEH": ["Wheat"],
    "WAFFLES": ["Wheat", "Egg", "Dairy", "Lactose"], // Common ingredients assumed
    "HEALTHY MUFFINS": ["Wheat", "Egg"], // Common ingredients assumed
    "GNOCCHI": ["Wheat"],
    "TORTILLA": ["Wheat"], // Often wheat, though corn exists. Flagging to be safe.
    
    // Soy
    "TOFU": ["Soy"],
    "EDAMAME": ["Soy"],
    
    // Peanuts
    "PEANUTS": ["Peanut"],
    "PEANUT BUTTER": ["Peanut"],
    
    // Tree Nuts
    "ALMONDS": ["Tree Nut"],
    "ALMOND BUTTER": ["Tree Nut"],
    "COCONUT": ["Tree Nut"], // FDA classifies coconut as a tree nut
    
    // Fish
    "FISH": ["Fish"],
    "TUNA": ["Fish"],
    "SARDINES": ["Fish"],
    "SALMON": ["Fish"],
    
    // Shellfish
    "SHRIMP": ["Shellfish"],
    
    // Sesame
    "SEEDS": ["Sesame"], // Often includes sesame/tahini
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
    "CEREALS": ["Iron", "Zinc"], // Fortified
    "MILLET": ["Magnesium", "Antioxidants"],
    "OATMEAL": ["Iron", "Fiber", "Zinc", "Magnesium"],
    "BUCKWHEAT": ["Fiber", "Magnesium"],
    "WAFFLES": ["Iron"], // Often fortified
    "HEALTHY MUFFINS": ["Fiber"], // Generic
    "PASTA": ["Iron"], // Often fortified
    "COUSCOUS": ["Selenium"],
    "POLENTA": ["Vitamin A"],
    "CORNMEAL": ["Iron"],
    "BREAD": ["Iron", "Fiber"], // Fortified
    "GNOCCHI": ["Potassium"],
    "TORTILLA": ["Calcium"], // Corn tortillas
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
    "SEEDS": ["Fiber", "Healthy Fats", "Iron", "Magnesium"], // General for Chia/Hemp/Flax

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

export const foodGuideData: { [key: string]: { allergyRisk: string; chokingRisk: string; serve6to8: string; serve9to12: string; } } = {
    "ASPARAGUS": { allergyRisk: "Low", chokingRisk: "Low (when soft-cooked)", serve6to8: "<h4 class='font-semibold'>6-8 Months:</h4><p>Steam or roast whole asparagus spears until very tender. Offer the whole spear for baby to gnaw on. The fibrous end is tough to chew through, reducing risk.</p>", serve9to12: "<h4 class='font-semibold mt-4'>9-12 Months:</h4><p>Continue serving whole, soft-cooked spears. As pincer grasp develops, you can chop the soft-cooked tips and stems into small, bite-sized pieces.</p>" },
};

export const guidesData = [
    { 
        title: "How Many Meals a Day?", 
        icon: "utensils-crossed",
        content: `<p>Follow your baby's lead! This is a general guide, but every baby is different. Focus on exploration, not volume.</p><ul class="list-disc list-outside space-y-2 pl-5"><li><strong>~6 Months:</strong> Start with <strong>1 meal</strong> a day. This is just for practice. Timing doesn't matter, just pick a time when baby is happy, rested, and not starving.</li><li><strong>~7-8 Months:</strong> When baby seems to be getting the hang of it, you can move to <strong>2 meals</strong> a day.</li><li><strong>~9-11 Months:</strong> Baby is likely a pro by now and can handle <strong>3 meals</strong> a day, often at the same time as the family (breakfast, lunch, dinner).</li></ul><p class="mt-2"><strong>Remember:</strong> Breastmilk or formula is still their primary source of nutrition until age 1.</p>`
    }
];

export const researchData = [
    { 
        title: "1. Key Signs of Readiness", 
        icon: "clipboard-check",
        content: `<p>Age alone isn't the only factor. Before starting any solids (purées or BLW), your baby should meet <strong>all</strong> of these milestones, which typically happen around 6 months:</p><ul class="list-disc list-outside space-y-2 pl-5"><li><strong>Sits Independently:</strong> Baby can sit in a high chair unassisted or with minimal support and has good head and neck control. This is crucial for safely managing food and swallowing.</li><li><strong>Lost Tongue-Thrust Reflex:</strong> Baby no longer automatically pushes food out of their mouth with their tongue. You can test this by offering a (safe) empty spoon; if they push it out, they're likely not ready.</li><li><strong>Interest in Food:</strong> Baby watches you eat with interest, leans forward, and may try to grab food from your plate.</li><li><strong>Can Grab and Hold:</strong> Baby has developed the motor skills to pick up pieces of food and bring them to their mouth.</li></ul>`
    },
    {
        title: "2. Introducing Top Allergens",
        icon: "bean",
        content: `<p>Current guidelines have changed: experts now recommend introducing top allergenic foods <strong>early and often</strong> (after 6 months and once a few other foods have been tolerated) to help *prevent* allergies.</p><p>The top 9 allergens account for ~90% of food allergies:</p><ol class="list-decimal list-outside space-y-2 pl-5"><li>Cow's Milk (e.g., in yogurt, cheese)</li><li>Egg (fully cooked, e.g., scrambled or in a muffin)</li><li>Peanuts (NEVER whole. Offer as a thin paste on toast or watered down.)</li><li>Tree Nuts (e.g., almond, walnut. Offer as nut butter, same as peanuts.)</li><li>Fish (e.g., soft, flaky salmon)</li><li>Shellfish (e.g., minced shrimp)</li><li>Soy (e.g., tofu, edamame)</li><li>Wheat (e.g., toast, pasta)</li><li>Sesame (e.g., tahini swirled into yogurt)</li></ol><p><strong>SafetyProtocol:</strong> Introduce one allergen at a time. Wait 3-5 days before introducing another new allergen to watch for any reaction (hives, vomiting, swelling, wheezing). Once an allergen is successfully introduced, keep offering it regularly (e.g., 2-3 times a week) to maintain tolerance.</p>`
    },
    {
        title: "3. The Importance of Iron",
        icon: "beef",
        content: `<p>This is a common concern with BLW. At 6 months, a baby's natural iron stores (which they built up in the womb) begin to deplete. Breast milk is naturally low in iron. While formula and iron-fortified cereals are packed with it, BLW babies may not consume large quantities of cereal.</p><p>It is <strong>essential</strong> to offer iron-rich foods at every meal.</p><ul class="list-disc list-outside space-y-2 pl-5"><li><strong>Heme Iron (Easily Absorbed):</strong> Beef (slow-cooked strips, ground beef), chicken (dark meat), turkey (dark meat), salmon, sardines.</li><li><strong>Non-Heme Iron:</strong> Lentils, tofu, chickpeas, black beans, edamame, eggs, iron-fortified oatmeal/cereal (can be used in muffins or pancakes).</li></ul><p><strong>Pro-Tip:</strong> Pair non-heme iron foods with a food high in Vitamin C to dramatically boost absorption! (e.g., lentils with tomatoes, tofu with bell peppers, oatmeal with strawberries).</p>`
    },
    {
        title: "4. Reputable Sources",
        icon: "book-text",
        content: `<p>For more detailed information, you can look up guidelines from these trusted organizations:</p><ul class="list-disc list-outside space-y-2 pl-5"><li>American Academy of Pediatrics (AAP)</li><li>Centers for Disease Control and Prevention (CDC)</li><li>World Health Organization (WHO)</li><li>Solid Starts (A popular, comprehensive app and website)</li></ul>`
    }
];

export const recommendationData: Record<string, { title: string; message: string; foods: string[] }> = {
    "too_young": {
        title: "Wait a bit longer",
        message: "Ideally, wait until around 6 months when baby shows all signs of readiness.",
        foods: []
    },
    "6_months": {
        title: "6 Months: Simple Starters",
        message: "Focus on iron-rich foods and easy-to-hold pieces. Introduce allergens one at a time.",
        foods: ["AVOCADO", "SWEET POTATO", "BANANA", "BROCCOLI", "BEEF, SLICED", "CARROTS", "EGGPLANT", "ZUCCHINI", "OATMEAL"]
    },
    "7_8_months": {
        title: "7-8 Months: Expanding Horizons",
        message: "Baby is getting the hang of it! Introduce more flavors, textures, and allergens.",
        foods: ["EGGS", "SALMON", "YOGURT", "TOFU", "PEACHES", "PEARS", "PEANUT BUTTER", "CHICKEN", "LENTILS", "BEETS"]
    },
    "9_11_months": {
        title: "9-11 Months: Pincer Grasp Practice",
        message: "Offer smaller bite-sized pieces as baby develops their pincer grasp.",
        foods: ["BLUEBERRIES", "PEAS", "BLACK BEANS", "MOZZARELLA", "PASTA", "TURKEY", "BROWN RICE", "CORN", "SNAP PEAS"]
    },
    "12_plus": {
        title: "12+ Months: Toddler Meals",
        message: "Baby can eat most family meals. Watch sodium and sugar.",
        foods: ["TOMATOES", "MUSHROOMS", "GRAPES", "STRAWBERRIES", "ORANGE", "BREAD", "SHRIMP", "PORK", "BELL PEPPERS"]
    }
};
