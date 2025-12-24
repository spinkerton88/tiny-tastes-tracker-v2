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

---

## 8. Swift (iOS) Application Porting Guide

This section is dedicated to agents tasked with converting **Tiny Tastes Tracker AI** into a native iOS application.

### 8.1 Architecture Translation
*   **Paradigm:** Transition from **React/Hooks** to **SwiftUI/MVVM**.
*   **State Management:**
    *   `useAppLogic.ts` → Create a main `@Observable class AppState`.
    *   `useAppMode.ts` → Computed properties within `AppState` based on the child's DOB.
*   **Persistence:**
    *   Replace `localStorage` with **SwiftData** (iOS 17+) for structured data (`UserProfile`, `TriedFoodLog`, `Recipe`).
    *   Use `UserDefaults` only for simple flags (e.g., `hasCompletedOnboarding`).

### 8.2 Dependency Mapping
| Web Tech | iOS Native Equivalent | Notes |
| :--- | :--- | :--- |
| React 19 | SwiftUI | Use `NavigationStack` for routing. |
| Tailwind CSS | SwiftUI Modifiers | Create a `Color+Extension.swift` for the Teal/Rose/Indigo themes. |
| @google/genai | `GoogleGenerativeAI` SDK | Add package via SPM: `https://github.com/google/generative-ai-swift` |
| html5-qrcode | VisionKit | Use `DataScannerViewController` for instant, high-performance barcode scanning. |
| Web Audio API | AVFoundation | Use `AVAudioEngine` for the Live Sage feature. |

### 8.3 Data Model Adaptation
*   Convert interfaces in `types.ts` to Swift `structs` or `classes` annotated with `@Model` (if using SwiftData).
*   **Important:** Maintain `Codable` conformance to allow the iOS app to import/export the *same* JSON backup files as the web app.

### 8.4 Critical Implementation Details
1.  **Live Activities:** The "Newborn Mode" timers (breastfeeding) are perfect candidates for **Live Activities** on the Lock Screen/Dynamic Island.
2.  **Charts:** Replace the SVG charts in `GrowthTracker.tsx` and `BalanceDashboard.tsx` with the **Swift Charts** framework.
3.  **Shortcuts:** Expose "Log Diaper" or "Log Feed" as **App Intents** for Siri/Shortcuts integration.

### 8.5 Gemini Integration Steps
1.  **API Key:** Store in `GenerativeAI-Info.plist` (do not check into source control).
2.  **Chat:** Use `GenerativeModel.generateContentStream` for the "Ask Sage" feature to maintain the streaming text effect.
3.  **Vision:** Use `UIImage` converted to JPEG data for the `identifyFoodFromImage` equivalent.

---

## 9. AI Persona & Prompt Engineering

To ensure the "Sage" personality remains consistent across recreations, adhere to these specific system instructions found in `geminiService.ts`.

### 9.1 The "Sage" Persona (Chat)
*   **Role:** Specialized research assistant for parents/caregivers.
*   **Tone:** Clear, empathetic, evidence-based.
*   **Constraint:** Must base answers on high-authority sources (AAP, CDC, WHO).
*   **Output Format:** Must end every response with 3 distinct "FOLLOWUP:" questions to drive engagement.
*   **Grounding:** Uses `tools: [{ googleSearch: {} }]`.

### 9.2 Recipe Generation
*   **Role:** World-class pediatric chef and nutritionist.
*   **Constraint:** Recipes must be appropriate for the specific age provided in months.
*   **Schema:** Returns strict JSON (`title`, `ingredients`, `instructions`).

### 9.3 Safety Analysis
*   **Role:** Pediatric safety expert.
*   **Ratings:** Must classify foods into strictly "Safe", "Use Caution", or "Avoid".
*   **Logic:** "Use Caution" usually applies to round shapes (grapes) or allergens. "Avoid" applies to honey (under 1y) or high sodium.

### 9.4 Sleep Predictor
*   **Input:** Current time, Last Wake Time, and a log summary of last 48h.
*   **Output:** `prediction_status` ("Ready" or "Needs More Data"), `next_sweet_spot_start` (Time string).

---

## 10. Critical Implementation Quirks

These are specific code patterns used in the React implementation that differ from standard documentation.

### 10.1 Icon Rendering (`Icon.tsx`)
The app does **not** import individual icons from `lucide-react`.
*   **Pattern:** It uses a global `window.lucide.createIcons()` call.
*   **Implementation:** The `Icon` component renders a `<span>` with a `data-lucide` attribute, then triggers the global create method in a `useEffect`.
*   **Reason:** Reduces bundle size and allows for dynamic icon name strings stored in the database.

### 10.2 Image Compression (`utils.ts`)
*   **Constraint:** LocalStorage has a 5MB limit.
*   **Solution:** Before saving `messyFaceImage`, the app converts the File to a Canvas, resizes it to a max width of **300px**, and exports as `image/jpeg` with **0.7** quality.

### 10.3 Gemini Live API Audio Format
*   **Input:** 16kHz PCM (via `AudioContext.createScriptProcessor`).
*   **Output:** 24kHz PCM.
*   **Protocol:** WebSocket via `ai.live.connect`.
*   **Voice:** "Zephyr" (Prebuilt).

---

## 11. Gamification Logic & Badges

The gamification logic in `useAppLogic.ts` is specific. To recreate the experience accurately, use these exact thresholds:

| Badge ID | Trigger Condition |
| :--- | :--- |
| `tried_10` | 10 unique foods logged |
| `tried_20` | 20 unique foods logged |
| ... | (Increments by 10 up to 90) |
| `100_club` | 100 unique foods logged |
| `green_machine` | 10 foods from category "Vegetables" that are explicitly Green (defined in `constants.ts`) |
| `fruit_ninja` | 15 unique foods from category "Fruits" |
| `protein_power` | 5 unique foods from categories "Meat" or "Plant Protein" |

**Note:** Badges are checked every time a new food log is saved.
