
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, FoodSubstitute, CustomFoodDetails, DailyLogAnalysis } from '../types';
import { flatFoodList } from '../constants';

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

export const suggestRecipe = async (prompt: string, babyAgeInMonths: number): Promise<Partial<Recipe>> => {
  try {
    const fullPrompt = `You are a baby-led weaning recipe creator. A parent wants a recipe using the following ingredients: "${prompt}". 
    Create a simple recipe appropriate for a baby who is ${babyAgeInMonths} months old. 
    Respond ONLY with a JSON object in the format {"title": "...", "ingredients": "...", "instructions": "..."}.
    Make sure ingredients are a bulleted list and instructions are a numbered list.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: fullPrompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text.trim();
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
      text: `You are a recipe parser. Extract the title, ingredients (as a bulleted list), and instructions (as a numbered list) from this image. Respond ONLY with a JSON object in the format {"title": "...", "ingredients": "...", "instructions": "..."}. If you cannot find one of the fields, return an empty string for it.`
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [textPart, imagePart] },
    });
    
    // Clean up potential markdown code blocks
    let text = response.text.trim();
    if (text.startsWith('```json')) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
        text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

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
        If it is a food not on the list, return {"foodName": null}.
        Do not include markdown formatting.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }, imagePart] },
        });

        let text = response.text.trim();
        // Clean up potential markdown code blocks
        if (text.startsWith('```json')) {
            text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (text.startsWith('```')) {
            text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

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
        You can include one common safe staple (like yogurt, oatmeal, or olive oil) even if not listed.
        Focus on interesting texture and flavor compliments (e.g. "Creamy & Sweet", "Savory Mash").
        Respond ONLY with a JSON object: { "pairings": [{ "title": "...", "description": "...", "ingredients": ["...", "..."] }] }`;

         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" }
        });

        const text = response.text.trim();
        return JSON.parse(text);
    } catch (error) {
         console.error("Error generating pairings:", error);
         throw new Error("Failed to generate pairings.");
    }
}

export const categorizeShoppingList = async (ingredients: string[]): Promise<Record<string, string[]>> => {
    try {
        const prompt = `Categorize this shopping list into the following groups: Produce, Dairy, Meat, Pantry, and Other. Respond ONLY with a JSON object where keys are the categories and values are arrays of ingredients from this list. If an item doesn't fit, put it in 'Other'. \n\n${ingredients.join('\n')}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
              responseMimeType: "application/json",
            },
        });
        
        const text = response.text.trim();
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
            prompt = `For a toddler (${babyAgeInMonths} months) who might be refusing "${foodName}", suggest 3-4 "Food Bridge" substitutes.
            The goal is to find foods with similar TEXTURE, COLOR, or MOUTHFEEL to "${foodName}" (rather than just nutritional value) to help them accept new foods.
            Example: If refusing Mushrooms (squishy), suggest Eggplant (similar texture).
            Provide a brief reason for each, highlighting the sensory connection.
            Respond ONLY with a JSON object in the format: {"substitutes": [{"name": "...", "reason": "..."}, ...]}.
            Ensure the 'name' of the substitute is just the food name (e.g., "Eggplant", "Tofu").`;
        } else {
            prompt = `For a baby who is ${babyAgeInMonths} months old and doing baby-led weaning, suggest 3-4 simple food substitutes for "${foodName}". 
            The substitutes should be nutritionally similar, commonly available, and safe for that age. 
            Provide a brief reason for each suggestion, focusing on texture, key nutrients, or preparation.
            Respond ONLY with a JSON object in the format: {"substitutes": [{"name": "...", "reason": "..."}, ...]}.
            Ensure the 'name' of the substitute is just the food name (e.g., "Mashed Peas", "Avocado Spears").`;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
            },
        });
        
        const text = response.text.trim();
        const parsed = JSON.parse(text);
        if (parsed.substitutes && Array.isArray(parsed.substitutes)) {
            return parsed.substitutes;
        }
        return [];
    } catch (error) {
        console.error("Error getting food substitutes:", error);
        throw new Error("Failed to get food substitutes from AI.");
    }
};

export const askResearchAssistant = async (history: { role: string; text: string }[], question: string): Promise<{ answer: string; sources: any[]; suggestedQuestions: string[] }> => {
  try {
    const systemInstruction = `You are Sage, a research assistant for parents, specializing in baby-led weaning and infant nutrition. Your answers must be based on information from peer-reviewed journals, scientific studies, and meta-analyses found via Google Search.
Synthesize the findings into a CLEAR, CONCISE answer for a non-scientific audience. Avoid extra fluff or lengthy introductions. Keep the answer under 250 words if possible.
Cite sources in the text using bracketed numbers, like [1], corresponding to the order of the sources found.
If you absolutely must use a source that is not a peer-reviewed study (like a reputable health organization's website), you MUST explicitly flag it in the text.

At the very end of your response, strictly following the answer, add exactly this separator on a new line: "---SUGGESTED_QUESTIONS---"
Then list 3 short, relevant follow-up questions that the user might want to ask next, one per line. Do not number them.`;

    // Convert simple history object to Gemini Content format
    const contents = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    // Add current question
    contents.push({
        role: 'user',
        parts: [{ text: question }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
            .map(q => q.trim().replace(/^\d+\.\s*/, '').replace(/^- \s*/, '')) // Remove bullets/numbers
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
        const prompt = `Analyze the food item "${foodName}" for a baby (6-12 months) starting solid foods.
        
        Context for reasoning:
        - Distinguish between a WHOLE single ingredient (e.g. "Raw Apple", "Broccoli Floret") vs a PRE-PACKAGED PRODUCT/BLEND (e.g. "Pouch", "Yogurt Blend", "Cereal", "Puffs").
        - If it is a pre-packaged blend or pouch, the advice must be relevant to that format.
        
        Respond ONLY with a JSON object:
        - "safety_rating": strictly one of "Safe", "Use Caution", or "Avoid".
        - "allergen_info": Check for common allergens.
        - "texture_recommendation": Concise serving advice.
        - "nutrition_highlight": One key benefit.
        - "emoji": A single emoji.
        - "category": Best fit from [Vegetables, Fruits, Grains, Protein, Dairy, Snacks]. Default to "Snacks" if unsure or packaged.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
            },
        });

        const text = response.text.trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Error analyzing food with Gemini:", error);
        throw new Error("Failed to analyze food.");
    }
};

export const analyzePackagedProduct = async (productName: string, ingredientsText: string): Promise<CustomFoodDetails & { emoji: string, category: string }> => {
    try {
        const prompt = `Analyze this specific scanned packaged food product for a baby (6-12 months).
        
        Product Name: "${productName}"
        Ingredients List: "${ingredientsText}"
        
        Instructions:
        1. "safety_rating": Is this safe? (e.g. "Safe", "Use Caution", "Avoid").
        2. "allergen_info": Scan ingredient list for common allergens.
        3. "texture_recommendation": How to serve this specific product type?
        4. "nutrition_highlight": Key benefit.
        5. "emoji": Relevant emoji.
        6. "category": Best fit from [Vegetables, Fruits, Grains, Protein, Dairy, Snacks]. Use "Snacks" for puffs/biscuits.

        Respond ONLY with a JSON object matching this structure.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
            },
        });

        const text = response.text.trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Error analyzing packaged product:", error);
        throw new Error("Failed to analyze product.");
    }
};

export const generatePickyEaterStrategies = async (targetFood: string, safeFoods: string, ickFactor: string = "Unknown"): Promise<any> => {
  try {
    const systemInstruction = `System Role:
You are "Sage," an expert pediatric nutritionist and creative chef specializing in reversing picky eating in toddlers (ages 12 months to 4 years). Your goal is to reduce mealtime stress and gradually expand the child's palate using evidence-based strategies like "Food Bridging" and "Repeated Exposure."

The Input:
You will receive:
1. Target Food: The ingredient the child is refusing.
2. Safe Foods: Foods the child currently loves.
3. The "Ick" Factor: Why the parent thinks they hate it.

Your Task:
Generate 3 distinct approaches to serve the Target Food. Return the response in strictly valid JSON format.

The 3 Approaches:
1. The "Bridge" (Look-Alike): Create a version of the Target Food that mimics the texture/flavor of a Safe Food.
2. The "Hidden" (Nutrient Boost): A recipe that makes the Target Food invisible or undetectable, blended into a favorite.
3. The "Play" (No Pressure): A serving suggestion that focuses on fun or sensory play, not eating.

JSON Structure:
{
  "strategies": [
    {
      "type": "The Bridge",
      "title": "Name of the dish",
      "why_it_works": "One sentence explaining the psychology.",
      "ingredients": ["Item 1", "Item 2"],
      "instructions": "Brief preparation steps (max 3 sentences)."
    },
    {
      "type": "The Stealth Mode",
      "title": "Name of the dish",
      "why_it_works": "One sentence explaining why.",
      "ingredients": ["Item 1", "Item 2"],
      "instructions": "Brief preparation steps."
    },
    {
      "type": "The Fun Factor",
      "title": "Name of the activity",
      "why_it_works": "One sentence explaining why.",
      "ingredients": ["Item 1", "Item 2"],
      "instructions": "Brief preparation steps."
    }
  ],
  "parent_tip": "A short, empathetic encouraging tip for the parent dealing with rejection."
}

Constraints:
- Keep recipes simple (under 5 ingredients if possible).
- Avoid choking hazards for toddlers (no whole nuts, whole grapes, or popcorn).
- Tone should be encouraging, not judgmental.`;

    const prompt = `Target Food: ${targetFood}\nSafe Foods: ${safeFoods}\nThe "Ick" Factor: ${ickFactor}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text.trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating picky eater strategies:", error);
    throw new Error("Failed to generate strategies.");
  }
};

export const getNutrientGapSuggestions = async (missingNutrient: string, currentDietTrend: string = "Balanced"): Promise<any> => {
  try {
    const systemInstruction = `System Role: You are a pediatric nutritionist helping a parent fill nutritional gaps for a toddler.

Input:
- Missing Nutrient: The nutrient that is lacking.
- Current Diet Trend: General description of what they are eating.

Task:
Suggest 3 specific, simple "Gap Filler" snacks or meal add-ons.
Do NOT suggest supplements. Focus on whole foods.

Output JSON:
{
  "gap": "Nutrient Name",
  "suggestions": [
    {
      "food": "Name of food",
      "why": "Reason why it helps.",
      "prep_time": "Preparation time"
    }
  ],
  "quick_tip": "A short tip for absorption or serving."
}`;

    const prompt = `Missing Nutrient: ${missingNutrient}\nCurrent Diet Trend: ${currentDietTrend}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text.trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error getting nutrient gap suggestions:", error);
    throw new Error("Failed to get suggestions.");
  }
};

export interface SleepPrediction {
    prediction_status: "Ready" | "Insufficient Data";
    next_sweet_spot_start: string;
    average_wake_window_minutes: number;
    reasoning_summary: string;
    troubleshooting_tip: string;
}

export const predictSleepWindow = async (currentTime: string, lastWakeTime: string, sleepLogSummary: string): Promise<SleepPrediction> => {
    try {
        const systemInstruction = `System Role: You are a pediatric sleep science assistant named "Sage." Your goal is to identify a stable wake window pattern and predict the most biologically optimal time for a baby to fall asleep naturally, known as the "Sleep Sweet Spot." Base your recommendations on typical infant sleep physiology and the provided recent data.

Input:
- Current Time: [HH:MM AM/PM]
- Last Wake Time: [The timestamp of the most recent wake-up]
- Sleep Log Data (Past 48 hrs): [Array of recent wake-up/nap patterns]

Task:
1. Analyze the provided sleep data (which is in 24-hour time format).
2. Calculate the average, minimum, and maximum **Wake Window** (time between waking and next sleep).
3. Determine a recommended 15-minute "Sleep Sweet Spot" start time for the next nap, targeting the average wake window found.
4. Provide a supportive explanation and one troubleshooting tip.

JSON Structure:
{
  "prediction_status": "Ready" | "Insufficient Data",
  "next_sweet_spot_start": "HH:MM AM/PM",
  "average_wake_window_minutes": Number,
  "reasoning_summary": "Based on the last X windows, the baby's average wake window is Y minutes.",
  "troubleshooting_tip": "A brief tip if the baby misses the sweet spot."
}`;

        const prompt = `Current Time: ${currentTime}\nLast Wake Time: ${lastWakeTime}\nSleep Log Data: ${sleepLogSummary}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            },
        });

        const text = response.text.trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Error predicting sleep window:", error);
        throw new Error("Failed to predict sleep window.");
    }
};

export const analyzeDailyLogTotals = async (ageDescription: string, data: { wetDiapers: number, dirtyDiapers: number, totalFeedOz?: number, totalFeeds: number }): Promise<DailyLogAnalysis> => {
    try {
        const systemInstruction = `System Role: You are a pediatric log analyst named "Sage." Your priority is to ensure the logged data is within expected benchmarks for infant safety and development (0-6 months). Do not give medical advice. Only provide data comparison and guidance for when to contact a doctor. You must rely on real-time data from authoritative sources like the WHO, AAP, or CDC. 

Input:
- Baby Age: ${ageDescription}
- Daily Totals (Last 24 hours): ${JSON.stringify(data)}

Task:
1. Compare the input data against the established safety minimums and averages for a baby of this age for Wet Diapers, Dirty Diapers, and Total Fluid Intake (if available) or Total Feeds.
2. Determine if any value falls into a "Red Flag" (below minimum requirement) or "Normal" range.
3. Structure the output clearly with simple statuses.

JSON Structure:
{
  "overall_status": "Normal" | "Watch Closely" | "Contact Pediatrician",
  "data_points": [
    {
      "metric": "Wet Diapers",
      "value_logged": Number,
      "normal_range": "Minimum X to Y per day",
      "status": "Normal" | "Low",
      "guidance": "Encourage more feeds if output is low."
    },
    {
      "metric": "Dirty Diapers",
      "value_logged": Number,
      "normal_range": "Minimum X per day",
      "status": "Normal" | "Low" | "High",
      "guidance": "Brief, non-alarming guidance."
    }
    // Include Fluid Intake or Total Feeds metric if applicable
  ],
  "disclaimer_warning": "This tool is for informational comparison only. Always contact your doctor immediately with health concerns."
}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: "Analyze daily logs" }] }],
            config: {
                systemInstruction: systemInstruction,
                tools: [{googleSearch: {}}],
                responseMimeType: "application/json",
            },
        });

        // The tool result text might contain the JSON we need, but sometimes it comes in parts.
        // The standard response.text accessor should handle concatenation.
        let text = response.text;
        
        // Remove markdown formatting if present
        if (text && text.startsWith('```json')) {
            text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (text && text.startsWith('```')) {
            text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        return JSON.parse(text || "{}");
    } catch (error) {
        console.error("Error analyzing daily logs:", error);
        throw new Error("Failed to analyze daily logs.");
    }
};
