# Tiny Tastes Tracker AI - Project Documentation

## 1. Executive Summary
**Tiny Tastes Tracker AI** is an intelligent, adaptive web application designed to assist parents through the critical stages of early childhood nutrition and development. Unlike static tracking apps, it evolves with the child—from a newborn logger to a solid food tracker (The "100 Foods Challenge"), and finally into a toddler meal planner and picky eater assistant. It leverages Google's Gemini AI ("Sage") to provide real-time safety checks, recipe generation, and parenting advice.

---

## 2. Business Requirements

### 2.1 Problem Statement
Parents often use fragmented tools: one app for breastfeeding timers, another for tracking solid food introduction, and Google Search for safety questions ("Can babies eat honey?"). This leads to data silos and decision fatigue.

### 2.2 Objectives
*   **Consolidation:** Combine health logging, food tracking, and meal planning into one app.
*   **Safety:** Provide immediate, AI-vetted advice on allergens, choking hazards, and serving sizes.
*   **Gamification:** Encourage dietary variety through badges and progress bars (e.g., "The 100 Club").
*   **Accessibility:** Offline-first architecture ensuring data is available even without an internet connection.

### 2.3 Target Audience
*   New parents (0-6 months).
*   Parents starting solids (6-12 months).
*   Parents of toddlers dealing with picky eating (12+ months).

---

## 3. Functional Specifications

The application operates in three distinct "Modes" based on the child's age profile.

### 3.1 Mode: Newborn (0-6 Months)
*   **Feed Tracker:** Timer for breastfeeding (left/right side tracking), bottle logging (oz), and pumping sessions.
*   **Diaper Log:** Track wet, dirty, or mixed diapers.
*   **Sleep & Growth:**
    *   Sleep logging (start/stop).
    *   **AI Feature:** "Sleep Sweet Spot" predictor uses historical data to suggest the next nap window.
    *   Growth chart visualization (Weight/Height) with WHO percentile calculation.
*   **Medicine:** Log dosage with AI safety checks against baby's weight.
*   **Health Check:** AI analysis of last 24h logs (wet diapers/feed volume) against medical guidelines.

### 3.2 Mode: Explorer (6-12 Months)
*   **100 Foods Tracker:** A checklist of 100 ingredients categorized by type (Veg, Fruit, Protein, etc.).
*   **Food Logging:** Track reaction (Loved it/Hated it), texture, and allergens.
*   **AI Analysis:**
    *   **Image Identification:** Identify food from a photo.
    *   **Safety Guide:** "How to Serve" modal showing preparation methods for specific ages (blw vs puree).
    *   **Allergen Alert:** Immediate warning if a logged food contains common allergens (nuts, eggs, etc.).
*   **Gamification:** Unlock badges (e.g., "Green Machine" for eating 5 green veggies).

### 3.3 Mode: Toddler (12+ Months)
*   **Plate Builder:** Visual tray to build meals from pantry items or recipes.
*   **Recipe Management:**
    *   **AI Chef:** Generate recipes based on available ingredients (e.g., "I have spinach and yogurt").
    *   **Scan to Import:** Extract recipe text from a photo of a cookbook.
*   **Picky Eater Rescue:**
    *   **Strategies:** AI generates specific psychological strategies (e.g., "Food Chaining") to bridge a "Safe Food" to a "Refused Food".
*   **Balance Dashboard:** Visual breakdown of weekly nutritional intake (Carbs vs Protein vs Veg) with AI suggestions to fill nutrient gaps.

### 3.4 Shared Features
*   **Multi-Profile:** Track multiple children with independent data.
*   **Ask Sage (AI Chat):** A context-aware chatbot for parenting advice with Google Search grounding.
*   **Live Sage:** Real-time voice conversation mode using Gemini Live API.
*   **Data Sync:** Manual JSON export/import for cross-device transfer.

---

## 4. Design and Architecture

### 4.1 Tech Stack
*   **Frontend Framework:** React 19 (Functional Components, Hooks).
*   **Language:** TypeScript (Strict typing for robust data handling).
*   **Build Tool:** Vite.
*   **Styling:** Tailwind CSS (Utility-first, responsive design).
*   **AI Provider:** Google GenAI SDK (`@google/genai`).
*   **Icons:** Lucide React.

### 4.2 Application Architecture
The app follows a **Monolithic Client-Side** architecture. It is designed to be hosted statically but behaves like a native app.

*   **State Management:**
    *   **`useAppLogic` Hook:** Centralized controller for app actions and state.
    *   **`useLocalStorage` Hook:** Custom hook providing persistence layer. All data is stored in the browser's `localStorage` as JSON strings.
*   **Service Layer:**
    *   `geminiService.ts`: Handles all interactions with Google Gemini. Includes a custom **Retry Engine** with exponential backoff to handle `429 Resource Exhausted` errors.
    *   `openFoodFactsService.ts`: Handles barcode lookup for packaged foods.
*   **Routing:**
    *   Manual state-based routing (`currentPage` state) rather than `react-router`. This simplifies the transition logic between modes.

### 4.3 Data Model (Key Types)
*   `UserProfile`: Stores name, DOB, allergies, and app mode.
*   `TriedFoodLog`: Stores food ID, reaction score (1-5), date, and notes.
*   `Recipe`: Stores ingredients, instructions, and meal types.
*   `MealPlan`: Key-value map of `Date -> MealSlot`.

---

## 5. Technical Requirements

### 5.1 Environment Variables
*   `GEMINI_API_KEY`: Required for all AI features. Must be enabled for the project in Google AI Studio.

### 5.2 Browser Capabilities
*   **LocalStorage:** Critical for data persistence.
*   **Camera:** Required for food identification and barcode scanning.
*   **Microphone:** Required for "Live Sage" voice mode.
*   **File API:** Required for importing/exporting backup JSONs.

### 5.3 AI Model Configuration
*   **Text/Reasoning:** `gemini-2.0-flash` (Chosen for speed and stability over preview models).
*   **Vision:** `gemini-2.0-flash` (Multimodal inputs).
*   **Live/Audio:** `gemini-2.5-flash-native-audio-preview` (For low-latency voice interaction).
*   **Grounding:** Google Search tool enabled for the "Research Assistant" to provide up-to-date medical info.

---

## 6. Process of Building

### Phase 1: Foundation & State
1.  **Setup:** Initialize Vite with React/TypeScript template. Configure Tailwind.
2.  **Data Layer:** Implement `useLocalStorage` to create a persistence layer that survives refreshes.
3.  **Types:** Define the core `Food`, `Log`, and `Profile` interfaces to ensure type safety throughout development.

### Phase 2: Core Tracker (Explorer Mode)
1.  **Food Database:** Create a static constant `flatFoodList` and categorization logic.
2.  **Tracker UI:** Build the grid view for foods with status toggles (Tried/Untried).
3.  **Logging:** Implement the `FoodLogModal` to capture reactions and timestamps.

### Phase 3: AI Integration
1.  **Service Setup:** Create `geminiService.ts` and instantiate the `GoogleGenAI` client.
2.  **Features:**
    *   Implement `analyzeFoodWithGemini` to generate safety ratings for custom foods.
    *   Implement `suggestRecipe` for the fridge-to-recipe feature.
3.  **Error Handling:** Implement the retry loop logic to handle API quotas gracefully.

### Phase 4: Expansion (Newborn & Toddler)
1.  **Mode Logic:** Implement `getAppMode` util to switch UI based on birth date.
2.  **Newborn Views:** Build the specialized timers for breastfeeding and sleep.
3.  **Toddler Views:** Build the drag-and-drop style Plate Builder and Recipe system.

### Phase 5: Polish & Hardware Features
1.  **Camera:** Integrate `html5-qrcode` for barcode scanning.
2.  **Live API:** Implement the WebSocket connection for the real-time "Sage" voice assistant.
3.  **Export:** Add the JSON export feature to allow users to save their data externally.

### Phase 6: Refinement
1.  **Design System:** Standardize colors (Teal for Explorer, Rose for Newborn, Indigo for Toddler).
2.  **Performance:** Memoize heavy calculations (like stats aggregation) using `useMemo`.
