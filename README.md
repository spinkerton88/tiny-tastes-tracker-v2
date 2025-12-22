
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Tiny Tastes Tracker AI

The intelligent, AI-powered baby food tracker. Features smart recipe suggestions, instant image-to-recipe import, nutritional substitute analysis, and doctor-ready progress reports.

## Setup & Configuration

This app requires keys for **Google Gemini AI** and **Firebase**.

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment Variables:**
    Create a file named `.env.local` in the root directory and add the following keys:

    ```env
    # Google Gemini API Key (Required for AI features)
    GEMINI_API_KEY=your_gemini_api_key

    # Firebase Configuration (Required for Login/Sync)
    # Get these from Firebase Console > Project Settings > General > Your apps
    VITE_FIREBASE_API_KEY=your_firebase_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

3.  **Run the app:**
    ```bash
    npm run dev
    ```

## Features

*   **AI-Powered Tracker:** Log foods and get immediate nutritional feedback.
*   **Cross-Device Sync:** Sign in with Google to sync data across devices.
*   **Offline Support:** Works offline and syncs when connection is restored.
*   **Growth Tracking:** Monitor weight and height percentiles.
*   **Recipes:** Generate baby-safe recipes based on ingredients you have.
