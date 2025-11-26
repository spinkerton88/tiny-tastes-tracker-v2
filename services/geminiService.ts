
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, FoodSubstitute, CustomFoodDetails } from '../types';
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
        const prompt = `For a baby who is ${babyAgeInMonths} months old and doing baby-led weaning, suggest 3-4 simple food substitutes for "${foodName}". 
The substitutes should be nutritionally similar, commonly available, and safe for that age. 
Provide a brief reason for each suggestion, focusing on texture, key nutrients, or preparation.
Respond ONLY with a JSON object in the format: {"substitutes": [{"name": "...", "reason": "..."}, ...]}.
Ensure the 'name' of the substitute is just the food name (e.g., "Mashed Peas", "Avocado Spears").`;

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

export const analyzeFoodWithGemini = async (foodName: string): Promise<CustomFoodDetails & { emoji: string }> => {
    try {
        const prompt = `Analyze the food "${foodName}" for a baby (6-12 months) starting solid foods (Baby Led Weaning). 
        Respond ONLY with a JSON object with the following properties:
        - "safety_rating": strictly one of "Safe", "Use Caution", or "Avoid".
        - "allergen_info": string describing if it is a common allergen (Top 9) or "No common allergens".
        - "texture_recommendation": one concise sentence on how to serve it safely (e.g., "Steam until soft" or "Serve as mash").
        - "nutrition_highlight": one key vitamin or nutritional benefit (e.g., "High in Iron").
        - "emoji": a single emoji representing this food.`;

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
