
import { GoogleGenAI, Type } from "@google/genai";
// FIX: Added SleepPrediction to imports from types.ts
import { Recipe, FoodSubstitute, CustomFoodDetails, DailyLogAnalysis, MedicineInstructions, SleepPrediction } from '../types';
import { flatFoodList } from '../constants';

// FIX: Export SleepPrediction so it can be imported by NewbornPage.tsx
export type { SleepPrediction };

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Gemini API key is not set. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

/**
 * Sanitizes a string that should contain JSON, removing markdown blocks if present.
 */
const sanitizeJson = (text: string): string => {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return clean;
};

export const suggestRecipe = async (prompt: string, babyAgeInMonths: number): Promise<Partial<Recipe>> => {
  try {
    const systemInstruction = `You are a baby-led weaning recipe creator. Respond ONLY with a JSON object in the format {"title": "...", "ingredients": "...", "instructions": "..."}. Make sure ingredients are a bulleted list and instructions are a numbered list.`;
    const fullPrompt = `Create a simple recipe appropriate for a baby who is ${babyAgeInMonths} months old using these ingredients: "${prompt}".`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: fullPrompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = sanitizeJson(response.text || "{}");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error suggesting recipe with AI:", error);
    throw new Error("Failed to generate recipe from AI.");
  }
};

export const importRecipeFromImage = async (file: File): Promise<Partial<Recipe>> => {
  try {
    const imagePart = await fileToGenerativePart(file);
    const textPart = {
      text: `Extract the title, ingredients (as a bulleted list), and instructions (as a numbered list) from this recipe image. Respond ONLY with a JSON object in the format {"title": "...", "ingredients": "...", "instructions": "..."}. If you cannot find one of the fields, return an empty string for it.`
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [textPart, imagePart] },
    });
    
    const text = sanitizeJson(response.text || "{}");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error importing recipe from image:", error);
    throw new Error("Failed to parse recipe from image.");
  }
};

export const identifyFoodFromImage = async (file: File): Promise<string | null> => {
    try {
        const imagePart = await fileToGenerativePart(file);
        const foodListString = flatFoodList.join(', ');
        
        const prompt = `Identify the single main food item in this image. 
        Check if it closely matches any of these specific foods: [${foodListString}].
        If it matches one of those exactly, return ONLY a JSON object with the "foodName" property matching the list item exactly. 
        Example: {"foodName": "AVOCADO"}.
        If it is a food not on the list, return {"foodName": null}.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }, imagePart] },
        });

        const text = sanitizeJson(response.text || "{}");
        const json = JSON.parse(text);
        return json.foodName;
    } catch (error) {
        console.error("Error identifying food:", error);
        return null;
    }
}

export const getFlavorPairingSuggestions = async (triedFoods: string[]): Promise<{pairings: {title: string, description: string, ingredients: string[]}[]}> => {
    try {
        const triedString = triedFoods.length > 0 ? triedFoods.join(', ') : "common baby starter foods like Avocado, Banana, and Sweet Potato";
        
        const prompt = `You are "Sage", a flavor sommelier for babies.
        The baby has successfully tried these foods: ${triedString}.
        Suggest 3 creative but simple 2-3 ingredient food pairings or mini-recipes using PRIMARILY these tried foods.
        Focus on interesting texture and flavor compliments.
        Respond ONLY with a JSON object: { "pairings": [{ "title": "...", "description": "...", "ingredients": ["...", "..."] }] }`;

         const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" }
        });

        const text = sanitizeJson(response.text || "{\"pairings\": []}");
        return JSON.parse(text);
    } catch (error) {
         console.error("Error generating pairings:", error);
         throw new Error("Failed to generate pairings.");
    }
}

export const categorizeShoppingList = async (ingredients: string[]): Promise<Record<string, string[]>> => {
    try {
        const prompt = `Categorize this shopping list into the following groups: Produce, Dairy, Meat, Pantry, and Other. Respond ONLY with a JSON object where keys are the categories and values are arrays of ingredients from this list. \n\n${ingredients.join('\n')}`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
              responseMimeType: "application/json",
            },
        });
        
        const text = sanitizeJson(response.text || "{}");
        return JSON.parse(text);
    } catch (error) {
        console.error("Error categorizing shopping list:", error);
        throw new Error("Failed to categorize shopping list.");
    }
};

export const getFoodSubstitutes = async (foodName: string, babyAgeInMonths: number): Promise<FoodSubstitute[]> => {
    try {
        const isToddler = babyAgeInMonths >= 12;
        let prompt;

        if (isToddler) {
            prompt = `For a toddler (${babyAgeInMonths} months) who might be refusing "${foodName}", suggest 3-4 "Food Bridge" substitutes with similar texture or color. Respond ONLY with a JSON object in the format: {"substitutes": [{"name": "...", "reason": "..."}, ...]}.`;
        } else {
            prompt = `For a baby who is ${babyAgeInMonths} months old, suggest 3-4 simple food substitutes for "${foodName}" that are nutritionally similar. Respond ONLY with a JSON object in the format: {"substitutes": [{"name": "...", "reason": "..."}, ...]}.`;
        }

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
            },
        });
        
        const text = sanitizeJson(response.text || "{\"substitutes\": []}");
        const parsed = JSON.parse(text);
        return parsed.substitutes || [];
    } catch (error) {
        console.error("Error getting food substitutes:", error);
        throw new Error("Failed to get food substitutes from AI.");
    }
};

export const askResearchAssistant = async (history: { role: string; text: string }[], question: string): Promise<{ answer: string; sources: any[]; suggestedQuestions: string[] }> => {
  try {
    const systemInstruction = `You are Sage, a research assistant for parents. Base your answers on authoritative sources via Google Search. Cite sources using bracketed numbers [1]. Keep the answer under 250 words. At the end, add "---SUGGESTED_QUESTIONS---" followed by 3 follow-up questions, one per line.`;

    const contents = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    contents.push({
        role: 'user',
        parts: [{ text: question }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: [{googleSearch: {}}],
      },
    });

    let answer = response.text || "I couldn't generate an answer. Please try again.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    
    let suggestedQuestions: string[] = [];
    const separator = "---SUGGESTED_QUESTIONS---";

    if (answer.includes(separator)) {
        const parts = answer.split(separator);
        answer = parts[0].trim();
        const questionsRaw = parts[1].trim();
        suggestedQuestions = questionsRaw.split('\n')
            .map(q => q.trim().replace(/^\d+\.\s*/, '').replace(/^- \s*/, ''))
            .filter(q => q.length > 0)
            .slice(0, 3);
    }
    
    return { answer, sources, suggestedQuestions };

  } catch (error) {
    console.error("Error asking research assistant:", error);
    throw new Error("Failed to get an answer from the research assistant.");
  }
};

export const analyzeFoodWithGemini = async (foodName: string): Promise<CustomFoodDetails & { emoji: string, category: string }> => {
    try {
        const prompt = `Analyze "${foodName}" for a baby (6-12 months). Respond ONLY with a JSON object: {"safety_rating": "Safe" | "Use Caution" | "Avoid", "allergen_info": "...", "texture_recommendation": "...", "nutrition_highlight": "...", "emoji": "...", "category": "..."}.`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
            },
        });

        const text = sanitizeJson(response.text || "{}");
        return JSON.parse(text);
    } catch (error) {
        console.error("Error analyzing food with Gemini:", error);
        throw new Error("Failed to analyze food.");
    }
};

export const analyzePackagedProduct = async (productName: string, ingredientsText: string): Promise<CustomFoodDetails & { emoji: string, category: string }> => {
    try {
        const prompt = `Analyze scanned product "${productName}" with ingredients "${ingredientsText}" for a baby. Respond ONLY with JSON matching: {"safety_rating": "...", "allergen_info": "...", "texture_recommendation": "...", "nutrition_highlight": "...", "emoji": "...", "category": "..."}.`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
            },
        });

        const text = sanitizeJson(response.text || "{}");
        return JSON.parse(text);
    } catch (error) {
        console.error("Error analyzing packaged product:", error);
        throw new Error("Failed to analyze product.");
    }
};

export const generatePickyEaterStrategies = async (targetFood: string, safeFoods: string, ickFactor: string = "Unknown"): Promise<any> => {
  try {
    const systemInstruction = `You are "Sage," an expert pediatric nutritionist. Generate 3 distinct approaches to serve the Target Food using valid JSON.`;
    const prompt = `Target Food: ${targetFood}\nSafe Foods: ${safeFoods}\nThe "Ick" Factor: ${ickFactor}. Respond with JSON format only.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = sanitizeJson(response.text || "{\"strategies\": []}");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating picky eater strategies:", error);
    throw new Error("Failed to generate strategies.");
  }
};

export const getNutrientGapSuggestions = async (missingNutrient: string, currentDietTrend: string = "Balanced"): Promise<any> => {
  try {
    const systemInstruction = `You are a pediatric nutritionist. Suggest 3 specific whole-food snacks for a missing nutrient. Output JSON ONLY.`;
    const prompt = `Missing Nutrient: ${missingNutrient}\nCurrent Diet Trend: ${currentDietTrend}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = sanitizeJson(response.text || "{}");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error getting nutrient gap suggestions:", error);
    throw new Error("Failed to get suggestions.");
  }
};

export const predictSleepWindow = async (currentTime: string, lastWakeTime: string, sleepLogSummary: string): Promise<SleepPrediction> => {
    try {
        const systemInstruction = `You are Sage, a pediatric sleep assistant. Analyze sleep data and predict the next "Sleep Sweet Spot." Output JSON ONLY.`;
        const prompt = `Current Time: ${currentTime}\nLast Wake Time: ${lastWakeTime}\nSleep Log Data: ${sleepLogSummary}`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
            },
        });

        const text = sanitizeJson(response.text || "{}");
        return JSON.parse(text);
    } catch (error) {
        console.error("Error predicting sleep window:", error);
        throw new Error("Failed to predict sleep window.");
    }
};

export const analyzeDailyLogTotals = async (ageDescription: string, data: { wetDiapers: number, dirtyDiapers: number, totalFeedOz?: number, totalFeeds: number }): Promise<DailyLogAnalysis> => {
    try {
        const systemInstruction = `You are Sage, a pediatric log analyst. Compare daily totals against WHO/AAP guidelines. Respond ONLY with JSON matching the required schema.`;
        const prompt = `Baby Age: ${ageDescription}. Daily Totals (24h): ${JSON.stringify(data)}. Analyze these results and return strictly JSON.`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                tools: [{googleSearch: {}}],
            },
        });

        const text = sanitizeJson(response.text || "{}");
        return JSON.parse(text);
    } catch (error) {
        console.error("Error analyzing daily logs:", error);
        throw new Error("Failed to analyze daily logs.");
    }
};

export const getMedicineInstructions = async (medicineName: string, weightKg: string): Promise<MedicineInstructions> => {
    try {
        const systemInstruction = `You are Sage, a safety guide. Provide accurate safety steps for OTC medicine. DO NOT PROVIDE DOSAGE. Respond ONLY with JSON.`;
        const prompt = `Medicine: ${medicineName}\nWeight: ${weightKg}`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                tools: [{googleSearch: {}}],
            },
        });

        const text = sanitizeJson(response.text || "{}");
        return JSON.parse(text);
    } catch (error) {
        console.error("Error getting medicine instructions:", error);
        throw new Error("Failed to get medicine safety info.");
    }
};
