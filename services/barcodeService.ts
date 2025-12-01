
export const fetchProductByBarcode = async (barcode: string) => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = await response.json();
    
    if (data.status === 1) {
      return {
        name: data.product.product_name,
        image: data.product.image_front_url,
        // The API returns ingredients_text_en (e.g., "Apples, Spinach, Water")
        // Fallback to ingredients_text if _en is missing
        ingredientsText: data.product.ingredients_text_en || data.product.ingredients_text || '' 
      };
    }
    return null;
  } catch (error) {
    console.error("Barcode lookup failed", error);
    return null;
  }
};

export const mapIngredientsToFoods = (ingredientText: string, allFoodsList: string[]) => {
  if (!ingredientText) return [];
  
  // Normalize and clean the text
  const cleanText = ingredientText
    .toLowerCase()
    .replace(/organic|puree|juice|concentrate|vitamin|flour|whole|paste|sauce|extract|powder|syrup|natural|flavor/g, '') // Remove common filler words
    .replace(/[,().:;]/g, ' '); // Remove punctuation

  const foundFoods: string[] = [];

  allFoodsList.forEach(dbFood => {
    const dbLower = dbFood.toLowerCase();
    
    // Handle basic singularization logic for matching
    // 1. "Strawberries" (DB) -> "Strawberry" (Text)
    // 2. "Apples" (DB) -> "Apple" (Text)
    let dbSingular = dbLower;
    if (dbLower.endsWith('ies')) {
        dbSingular = dbLower.slice(0, -3) + 'y'; // cherries -> cherry
    } else if (dbLower.endsWith('s')) {
        dbSingular = dbLower.slice(0, -1); // apples -> apple
    }

    // Check if the DB food name (or its singular version) exists in the ingredient text
    // We check both ways to catch "Gala Apple" (contains apple)
    if (cleanText.includes(dbLower) || cleanText.includes(dbSingular)) {
      if (!foundFoods.includes(dbFood)) {
          foundFoods.push(dbFood);
      }
    }
  });

  return foundFoods;
};
