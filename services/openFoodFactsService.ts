
import { flatFoodList } from '../constants';

// Words to strip out to find the "real" food name
const IGNORED_WORDS = [
    'organic', 'puree', 'concentrate', 'juice', 'vitamin', 'acid', 'citric', 'ascorbic', 
    'water', 'of', 'and', 'extract', 'flavor', 'flavour', 'natural', 'sauce', 'paste',
    'dried', 'powder', 'syrup', 'starch', 'gum', 'lecithin'
];

interface OpenFoodFactsResponse {
    status: number;
    product: {
        product_name: string;
        ingredients_text: string;
        ingredients_tags?: string[];
        image_url?: string;
    };
}

export const fetchProductIngredients = async (barcode: string): Promise<{ productName: string; matchedFoods: string[]; imageUrl?: string } | null> => {
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
        const data: OpenFoodFactsResponse = await response.json();

        if (data.status !== 1 || !data.product) {
            return null;
        }

        const { product } = data;
        const matchedFoods = new Set<string>();

        // Strategy 1: Use ingredients_tags (e.g., "en:apple", "en:banana") - usually cleanest
        if (product.ingredients_tags && product.ingredients_tags.length > 0) {
            product.ingredients_tags.forEach(tag => {
                const cleanTag = tag.replace('en:', '').replace(/-/g, ' ');
                const match = findMatchInDatabase(cleanTag);
                if (match) matchedFoods.add(match);
            });
        }

        // Strategy 2: Fallback to parsing raw text if tags didn't yield enough results
        if (matchedFoods.size === 0 && product.ingredients_text) {
            // Split by commas, brackets, or "and"
            const rawIngredients = product.ingredients_text.split(/[,()]/);
            
            rawIngredients.forEach(rawIng => {
                const cleaned = cleanIngredientString(rawIng);
                const match = findMatchInDatabase(cleaned);
                if (match) matchedFoods.add(match);
            });
        }

        return {
            productName: product.product_name || "Unknown Snack",
            matchedFoods: Array.from(matchedFoods),
            imageUrl: product.image_url
        };

    } catch (error) {
        console.error("Error fetching product:", error);
        return null;
    }
};

const cleanIngredientString = (text: string): string => {
    let cleaned = text.toLowerCase();
    
    // Remove ignored words
    IGNORED_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });

    return cleaned.trim();
};

const findMatchInDatabase = (ingredientInput: string): string | null => {
    const input = ingredientInput.toLowerCase().trim();
    if (!input) return null;

    // Direct check against our flat list
    // We try to match "Apple" to "APPLES"
    for (const dbFood of flatFoodList) {
        const dbLower = dbFood.toLowerCase();
        
        // 1. Exact match
        if (dbLower === input) return dbFood;

        // 2. Singular/Plural check (Simple 's' logic)
        if (dbLower + 's' === input || dbLower === input + 's') return dbFood;

        // 3. Inclusion (e.g. "Gala Apple" matches "APPLES")
        // Check if the database food name appears in the input string, OR vice versa
        // We prioritize shorter database names appearing in longer input strings (e.g. "Apple" in "Apple Puree")
        if (input.includes(dbLower)) return dbFood;
    }

    return null;
};
