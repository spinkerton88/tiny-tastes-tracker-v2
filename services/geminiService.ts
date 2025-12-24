
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Recipe, FoodSubstitute, CustomFoodDetails, DailyLogAnalysis, MedicineInstructions, SleepPrediction } from '../types';
import { flatFoodList } from '../constants';

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
 * Core function to handle API calls with robust exponential backoff for 429/503 errors.
 */
const generateContentWithRetry = async (params: {
    model: string;
    contents: any[];
    config?: any;
}): Promise<GenerateContentResponse> => {
    // Increased retries and base delay to handle strict free tier quotas
    const MAX_RETRIES = 5;
    const BASE_DELAY = 4000; // 4 seconds base delay (4s, 8s, 16s...)
    
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent(params);
            return response;
        } catch (error: any) {
            // Check for quota/rate limit errors (429) or server errors (503)
            const isRetryable = error.status === 429 || error.status === 503 || 
                                (error.message && (error.message.includes('429') || error.message.includes('503') || error.message.includes('quota') || error.message.includes('Resource has been exhausted')));

            if (isRetryable && attempt < MAX_RETRIES - 1) {
                // Calculate exponential backoff with jitter
                // Attempt 0: ~4s
                // Attempt 1: ~8s
                // Attempt 2: ~16s
                // Attempt 3: ~32s
                const delay = Math.pow(2, attempt) * BASE_DELAY + (Math.random() * 1000);
                console.warn(`Gemini API 429/503 (Attempt ${attempt + 1}). Retrying in ${Math.round(delay/1000)}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
            } else {
                console.error(`Gemini API Failed after ${attempt + 1} attempts:`, error);
                throw error;
            }
        }
    }
    throw new Error("Failed to generate content after maximum retries.");
};

/**
 * Helper to handle JSON parsing from the retry-enabled response.
 */
const callGemini = async <T>(params: {
    model: string;
    contents: any[];
    config?: any;
}): Promise<T> => {
    try {
        const response = await generateContentWithRetry(params);
        let text = response.text || "{}";
        
        if (text.trim().startsWith("```")) {
            text = text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
        
        return JSON.parse(text) as T;
    } catch (error) {
        console.error("Gemini JSON Parsing or API Error:", error);
        throw new Error("Failed to process AI response. Please try again in a moment.");
    }
};

export const suggestRecipe = async (prompt: string, babyAgeInMonths: number): Promise<Partial<Recipe>> => {
    return callGemini<Partial<Recipe>>({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: `Create a simple recipe appropriate for a baby who is ${babyAgeInMonths} months old using these ingredients: "${prompt}".` }] }],
        config: {
            systemInstruction: "You are a world-class pediatric chef and nutritionist.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    ingredients: { type: Type.STRING, description: "Bulleted list of ingredients" },
                    instructions: { type: Type.STRING, description: "Numbered list of steps" },
                },
                required: ["title", "ingredients", "instructions"]
            }
        },
    });
};

export const importRecipeFromImage = async (file: File): Promise<Partial<Recipe>> => {
    const imagePart = await fileToGenerativePart(file);
    return callGemini<Partial<Recipe>>({
        model: 'gemini-2.0-flash',
        contents: [{
            parts: [
                { text: "Extract the recipe details from this image." },
                imagePart
            ]
        }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    ingredients: { type: Type.STRING },
                    instructions: { type: Type.STRING }
                },
                required: ["title", "ingredients", "instructions"]
            }
        }
    });
};

export const identifyFoodFromImage = async (file: File): Promise<string | null> => {
    try {
        const imagePart = await fileToGenerativePart(file);
        const foodListString = flatFoodList.join(', ');

        const result = await callGemini<{ foodName: string | null }>({
            model: 'gemini-2.0-flash',
            contents: [{
                parts: [
                    { text: `Identify the single main food item in this image. Match against: [${foodListString}].` },
                    imagePart
                ]
            }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        foodName: { type: Type.STRING, nullable: true }
                    }
                }
            }
        });
        return result.foodName;
    } catch (error) {
        console.error("Error identifying food:", error);
        return null;
    }
};

export const getFlavorPairingSuggestions = async (triedFoods: string[]): Promise<{pairings: {title: string, description: string, ingredients: string[]}[]}> => {
    const triedString = triedFoods.length > 0 ? triedFoods.join(', ') : "starter baby foods";
    const result = await callGemini<{ pairings: any[] }>({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: `Suggest 3 creative pairings using: ${triedString}.` }] }],
        config: {
            systemInstruction: "You are Sage, a baby flavor sommelier.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    pairings: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        }
                    }
                }
            }
        }
    });
    return { pairings: result.pairings || [] };
};

export const askResearchAssistant = async (history: { role: string; text: string }[], question: string): Promise<{ answer: string; sources: any[]; suggestedQuestions: string[] }> => {
    const contents = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    contents.push({ role: 'user', parts: [{ text: question }] });

    try {
        // Now using generateContentWithRetry to handle 429s in the chat as well
        const response = await generateContentWithRetry({
            model: "gemini-2.0-flash",
            contents: contents,
            config: {
                systemInstruction: `You are Sage, a specialized research assistant for parents and caregivers. 
                Base your answers on high-authority sources like the AAP, CDC, WHO, and peer-reviewed journals.
                Provide clear, empathetic, and evidence-based guidance.
                
                At the very end of your response, strictly include 3 distinct followup questions for the user, 
                each starting with "FOLLOWUP: ".`,
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text || "I'm sorry, I couldn't find an answer to that right now.";
        
        const lines = text.split('\n');
        const answerLines = lines.filter(l => !l.startsWith('FOLLOWUP:'));
        const suggestedQuestions = lines
            .filter(l => l.startsWith('FOLLOWUP:'))
            .map(l => l.replace('FOLLOWUP:', '').trim());

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

        return {
            answer: answerLines.join('\n').trim(),
            sources,
            suggestedQuestions: suggestedQuestions.length > 0 ? suggestedQuestions : [
                "Is this safe for my baby's age?",
                "What are some iron-rich alternatives?",
                "When should I talk to my pediatrician about this?"
            ]
        };
    } catch (error) {
        console.error("Error asking research assistant:", error);
        throw new Error("Failed to get a research-backed answer. Please try again.");
    }
};

export const analyzeFoodWithGemini = async (foodName: string): Promise<CustomFoodDetails & { emoji: string, category: string }> => {
    return callGemini<CustomFoodDetails & { emoji: string, category: string }>({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: `Analyze "${foodName}" for a baby (6-12 months).` }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    safety_rating: { type: Type.STRING, enum: ["Safe", "Use Caution", "Avoid"] },
                    allergen_info: { type: Type.STRING },
                    texture_recommendation: { type: Type.STRING },
                    nutrition_highlight: { type: Type.STRING },
                    emoji: { type: Type.STRING },
                    category: { type: Type.STRING }
                },
                required: ["safety_rating", "allergen_info", "texture_recommendation", "nutrition_highlight", "emoji", "category"]
            }
        },
    });
};

export const generatePickyEaterStrategies = async (targetFood: string, safeFoods: string, ickFactor: string = "Unknown"): Promise<any> => {
    const result = await callGemini<any>({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: `Target Food: ${targetFood}\nSafe Foods: ${safeFoods}\nThe "Ick" Factor: ${ickFactor}.` }] }],
        config: {
            systemInstruction: `You are Sage, a pediatric nutritionist. Suggest 3 approaches to bridge the gap.`,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    strategies: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: { type: Type.STRING },
                                title: { type: Type.STRING },
                                why_it_works: { type: Type.STRING },
                                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                                instructions: { type: Type.STRING }
                            }
                        }
                    },
                    parent_tip: { type: Type.STRING }
                }
            }
        },
    });
    return result.strategies ? result : { strategies: [], parent_tip: "Try again later." };
};

export const predictSleepWindow = async (currentTime: string, lastWakeTime: string, sleepLogSummary: string): Promise<SleepPrediction> => {
    return callGemini<SleepPrediction>({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: `Current: ${currentTime}\nLast Wake: ${lastWakeTime}\nSummary: ${sleepLogSummary}` }] }],
        config: {
            systemInstruction: "Predict the next Sleep Sweet Spot.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    prediction_status: { type: Type.STRING, enum: ["Ready", "Needs More Data"] },
                    next_sweet_spot_start: { type: Type.STRING },
                    average_wake_window_minutes: { type: Type.NUMBER },
                    reasoning_summary: { type: Type.STRING },
                    troubleshooting_tip: { type: Type.STRING }
                }
            }
        },
    });
};

export const analyzeDailyLogTotals = async (ageDescription: string, data: { wetDiapers: number, dirtyDiapers: number, totalFeedOz?: number, totalFeeds: number }): Promise<DailyLogAnalysis> => {
    return callGemini<DailyLogAnalysis>({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: `Baby Age: ${ageDescription}. Totals: ${JSON.stringify(data)}.` }] }],
        config: {
            systemInstruction: `Analyze daily totals against WHO/AAP guidelines.`,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    overall_status: { type: Type.STRING, enum: ["Normal", "Watch Closely", "Contact Pediatrician"] },
                    data_points: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                metric: { type: Type.STRING },
                                value_logged: { type: Type.NUMBER },
                                normal_range: { type: Type.STRING },
                                status: { type: Type.STRING, enum: ["Normal", "Low", "High"] },
                                guidance: { type: Type.STRING }
                            }
                        }
                    },
                    disclaimer_warning: { type: Type.STRING }
                }
            }
        },
    });
};

export const categorizeShoppingList = async (items: string[]): Promise<Record<string, string[]>> => {
    try {
        const result = await callGemini<{ categories: { name: string, items: string[] }[] }>({
            model: "gemini-2.0-flash",
            contents: [{ parts: [{ text: `Categorize these shopping items: ${items.join(', ')}.` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        categories: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    items: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["name", "items"]
                            }
                        }
                    }
                }
            },
        });

        const mappedResult: Record<string, string[]> = {};
        if (result.categories && Array.isArray(result.categories)) {
            result.categories.forEach((cat) => {
                if (cat.name && Array.isArray(cat.items)) {
                    mappedResult[cat.name] = cat.items;
                }
            });
        }
        return Object.keys(mappedResult).length > 0 ? mappedResult : { "Groceries": items };
    } catch (error) {
        console.error("Error categorizing list:", error);
        return { "Uncategorized": items };
    }
};

export const getFoodSubstitutes = async (foodName: string, ageInMonths: number): Promise<FoodSubstitute[]> => {
    try {
        const result = await callGemini<{ substitutes: FoodSubstitute[] }>({
            model: "gemini-2.0-flash",
            contents: [{ parts: [{ text: `Suggest 3 baby-safe substitutes for "${foodName}" for a ${ageInMonths} month old.` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        substitutes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    reason: { type: Type.STRING }
                                },
                                required: ["name", "reason"]
                            }
                        }
                    }
                }
            }
        });
        return result.substitutes || [];
    } catch (error) {
        return [];
    }
};

export const analyzePackagedProduct = async (productName: string, ingredientsText: string): Promise<CustomFoodDetails & { emoji: string, category: string }> => {
    return callGemini<CustomFoodDetails & { emoji: string, category: string }>({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: `Analyze this packaged product for a baby (6-12 months). Product: ${productName}, Ingredients: ${ingredientsText}` }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    safety_rating: { type: Type.STRING, enum: ["Safe", "Use Caution", "Avoid"] },
                    allergen_info: { type: Type.STRING },
                    texture_recommendation: { type: Type.STRING },
                    nutrition_highlight: { type: Type.STRING },
                    emoji: { type: Type.STRING },
                    category: { type: Type.STRING }
                },
                required: ["safety_rating", "allergen_info", "texture_recommendation", "nutrition_highlight", "emoji", "category"]
            }
        },
    });
};

export const getNutrientGapSuggestions = async (missingNutrient: string, currentDiet: string): Promise<any> => {
    return callGemini<any>({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: `Suggest foods rich in ${missingNutrient} for a toddler. Context: ${currentDiet}` }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                food: { type: Type.STRING },
                                prep_time: { type: Type.STRING },
                                why: { type: Type.STRING }
                            },
                            required: ["food", "prep_time", "why"]
                        }
                    },
                    quick_tip: { type: Type.STRING }
                }
            }
        }
    });
};

export const getMedicineInstructions = async (medicineName: string, weight: string): Promise<MedicineInstructions> => {
    return callGemini<MedicineInstructions>({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: `Provide safety instructions for giving ${medicineName} to a baby weighing ${weight}.` }] }],
        config: {
            systemInstruction: "You are a pediatric medical assistant. Provide cautious, general guidance and ALWAYS advise consulting a doctor for dosage.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    medicine_name: { type: Type.STRING },
                    safe_administration_checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
                    critical_warning: { type: Type.STRING },
                    source_tip: { type: Type.STRING }
                },
                required: ["medicine_name", "safe_administration_checklist", "critical_warning", "source_tip"]
            }
        }
    });
};
