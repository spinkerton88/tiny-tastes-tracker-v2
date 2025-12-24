# Tiny Tastes Tracker AI - Master Project Blueprint

## 1. Executive Summary
**Tiny Tastes Tracker AI** is an intelligent, adaptive web application designed to assist parents through the critical stages of early childhood nutrition and development. It operates as a local-first, offline-capable Progressive Web App (PWA) powered by Google Gemini AI.

**Core Value Proposition:**
*   **Newborns (0-6m):** Precision tracking for sleep, feeding, and growth.
*   **Explorers (6-12m):** Gamified "100 Foods Challenge" with safety and allergen tracking.
*   **Toddlers (12m+):** Meal planning, recipe generation, and "picky eater" psychological strategies.

---

## 2. Architecture Overview

### 2.1 Tech Stack
*   **Core:** React 19, TypeScript, Vite.
*   **Styling:** Tailwind CSS (Utility-first).
*   **AI Engine:** Google GenAI SDK (`@google/genai`) - Models: `gemini-2.0-flash` (Text/Vision), `gemini-2.5-flash-native-audio-preview` (Live Audio).
*   **Data Persistence:** `localStorage` (Client-side only for privacy and offline speed).
*   **Hardware Access:** `html5-qrcode` (Camera/Barcode), Web Audio API.
*   **Icons:** Lucide React.

### 2.2 Directory Structure
The project follows a feature-based organization within `src` (conceptually flattened for this environment).

```text
/
├── index.html              # Entry point, PWA meta tags
├── index.tsx               # React Root
├── App.tsx                 # Main Routing & Layout Orchestrator
├── types.ts                # TypeScript Interfaces (Single Source of Truth)
├── constants.ts            # Static Data (Food Lists, Guidelines, Colors)
├── utils.ts                # Helper Functions (Age calc, Image resize)
├── hooks/
│   ├── useAppLogic.ts      # Global Controller (State Facade)
│   ├── useAppMode.ts       # Mode/Theme Selector Logic
│   └── useLocalStorage.ts  # Persistence Hook
├── services/
│   ├── geminiService.ts    # AI Logic & Retry Engine
│   └── openFoodFactsService.ts # Barcode API Wrapper
├── components/
│   ├── Layout.tsx          # Responsive Shell (Header/Nav)
│   ├── ui/                 # Atomic Components (Icon, EmptyState, Accordion)
│   ├── pages/              # Route Views
│   │   ├── TrackerPage.tsx     # 100 Foods Grid
│   │   ├── RecipesPage.tsx     # Meal Planner & Recipe Box
│   │   ├── NewbornPage.tsx     # Logs for 0-6m
│   │   └── ... (Other Pages)
│   └── modals/             # Action Dialogs
│       ├── FoodLogModal.tsx    # Detailed Logging Form
│       ├── RecipeModal.tsx     # Recipe Editor
│       ├── LiveSageModal.tsx   # AI Voice Assistant Interface
│       └── ... (Other Modals)
```

---

## 3. Data Schema & Persistence

All data is stored in `localStorage` keys prefixed with `tiny-tastes-tracker-`.

### 3.1 Core State Objects
*   **User Profile (`UserProfile`):**
    ```json
    {
      "id": "uuid-string",
      "babyName": "Alex",
      "birthDate": "2023-09-15",
      "gender": "boy",
      "knownAllergies": ["Peanut"],
      "preferredMode": "EXPLORER" // Optional override
    }
    ```
*   **Food Log (`TriedFoodLog`):**
    ```json
    {
      "id": "AVOCADO", // References constants.ts food name
      "date": "2024-03-20",
      "reaction": 5, // 1-7 scale
      "meal": "breakfast",
      "allergyReaction": "none",
      "messyFaceImage": "data:image/jpeg;base64...", // Compressed base64
      "tryCount": 3
    }
    ```
*   **Recipe (`Recipe`):**
    ```json
    {
      "id": "uuid",
      "title": "Spinach Pancakes",
      "ingredients": "Oats, Spinach, Banana, Egg",
      "instructions": "Blend and fry.",
      "tags": ["breakfast", "iron-rich"],
      "mealTypes": ["breakfast"]
    }
    ```

---

## 4. UI/UX Design System

The app uses a **Mode-Adaptive Theme** system controlled by `useAppMode.ts`.

### 4.1 Themes
1.  **Newborn Mode (`bg-rose-500`):**
    *   **Focus:** Sleep, Comfort, Nursing.
    *   **Visuals:** Soft pinks, rounded timers, large high-contrast buttons for tired parents.
2.  **Explorer Mode (`bg-teal-600`):**
    *   **Focus:** Discovery, Nature, Freshness.
    *   **Visuals:** Vibrant teals, food emojis, progress bars, grid layouts.
3.  **Toddler Mode (`bg-indigo-500`):**
    *   **Focus:** Structure, Planning, Learning.
    *   **Visuals:** Deep indigos, plate-building interfaces, weekly calendars.

### 4.2 Key Interactions
*   **Modal-First Workflow:** Almost all data entry (Logging food, adding recipes) happens in Modals to preserve context of the underlying dashboard.
*   **Sticky Actions:** Primary actions (Review Plate, Save Log) are often sticky at the bottom of the viewport on mobile.
*   **Haptic Feedback:** Used in Newborn mode triggers (Start/Stop timer) for tactile confirmation.

---

## 5. Functional Specifications by Feature

### 5.1 The "100 Foods" Tracker (Explorer Mode)
*   **Food Grid:** Renders ~100 predefined items grouped by category (Veg, Fruit, Protein).
*   **State:** Items toggle visual state: "Untried" (Opacity 100%) -> "Tried" (Greyscale + Checkmark overlay).
*   **AI Recognition:** `identifyFoodFromImage` uses Gemini Vision to match a photo to a database item.
*   **Safety Guide:** Clicking the "Chef Hat" icon opens `HowToServeModal`, providing specific cut sizes (strip vs bite-sized) based on age.

### 5.2 The Recipe & Plate Builder (Toddler Mode)
*   **Plate Builder:** A horizontal scrolling "tray" where users select foods.
*   **AI Chef:** `suggestRecipe` takes a list of fridge ingredients and generates a baby-safe recipe using Gemini.
*   **Scanner:** Uses `html5-qrcode` to scan a barcode -> `openFoodFactsService` fetches ingredients -> App adds them to the food log.

### 5.3 Newborn Logs
*   **Nursing Timer:** Two independent timers (Left/Right breast) that can run simultaneously or sequentially.
*   **Sleep Predictor:** `predictSleepWindow` sends last 48h of sleep logs to Gemini to calculate the optimal next wake window.

### 5.4 "Sage" AI Assistant
*   **Chat:** Context-aware text chat (`askResearchAssistant`) grounded with Google Search for medical validity.
*   **Live:** Real-time voice interaction (`LiveSageModal`) using WebSocket-based Gemini Live API for hands-free advice during messy meal times.

---

## 6. Technical Implementation Details

### 6.1 Service Layer: `geminiService.ts`
This file is the critical AI gateway.
*   **Retry Logic:** Must implement exponential backoff (4s, 8s, 16s) to handle `429 Resource Exhausted` errors from the free tier API.
*   **JSON Enforcement:** All generative calls (except Chat) must request `responseMimeType: "application/json"` and provide a strict `responseSchema` to ensure the UI doesn't crash on malformed AI output.

### 6.2 State Management: `useAppLogic.ts`
*   Acts as the Facade pattern.
*   Aggregates all `useLocalStorage` hooks.
*   Exposes `actions` (e.g., `handleLogFeed`, `handleSaveFoodLog`) that encapsulate business logic (e.g., unlocking a badge when food count hits 10).

### 6.3 Performance Considerations
*   **Image Compression:** All user-uploaded photos must be resized (max 300px) client-side before storing in LocalStorage to prevent quota overflow (5MB limit).
*   **Lazy Loading:** Heavy modals (BarcodeScanner) should be lazy-loaded.

---

## 7. Hand-off Checklist for Agents

If you are an AI agent tasked with recreating this:
1.  **Start with `types.ts`:** Define the data shape first. This is the contract for the entire app.
2.  **Build `constants.ts`:** Populate the static food database and color mappings.
3.  **Implement Services:** Set up the `geminiService` with the retry loop immediately; it is essential for stability.
4.  **Create Atomic UI:** Build `Icon`, `Accordion`, and `EmptyState` first.
5.  **Assemble Pages:** Build the logic-heavy pages (`NewbornPage`, `TrackerPage`) component by component.
6.  **Integrate:** Wire everything in `App.tsx` using `useAppLogic`.
