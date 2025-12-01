
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
        ingredientsText: data.product.ingredients_text_en || '' 
      };
    }
    return null;
  } catch (error) {
    console.error("Barcode lookup failed", error);
    return null;
  }
};

export const mapIngredientsToFoods = (ingredientText: string, allFoodsList: string[]) => {
  // Normalize: "Organic Spinach Puree" -> "SPINACH"
  const cleanText = ingredientText
    .toLowerCase()
    .replace(/organic|puree|juice|concentrate|vitamin|flour|whole/g, '') // Remove noise
    .replace(/[,().]/g, ' '); // Remove punctuation

  const foundFoods: string[] = [];

  allFoodsList.forEach(dbFood => {
    // Check if your DB food (e.g. "Spinach") exists in the cleaned text
    if (cleanText.includes(dbFood.toLowerCase())) {
      foundFoods.push(dbFood);
    }
  });

  return foundFoods; // Returns ["Spinach", "Apple"]
};
