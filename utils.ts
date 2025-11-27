
import { UserProfile, AppMode, AppModeConfig } from "./types";

export const calculateAgeInMonths = (birthDateString?: string): number => {
    if (!birthDateString) return 6; // Default to 6 months if no date is provided
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (today.getDate() < birthDate.getDate()) {
        months--;
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    return Math.max(0, (years * 12) + months);
};

export const resizeImage = (file: File, maxWidth: number = 300): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // Moderate compression
                } else {
                    reject(new Error("Failed to get canvas context"));
                }
            };
            img.src = event.target?.result as string;
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

export const getAppMode = (userProfile: UserProfile | null): AppMode => {
    // 1. Check for Manual Override
    if (userProfile?.preferredMode) {
        return userProfile.preferredMode;
    }

    const birthDate = userProfile?.birthDate;
    // If no birthdate is set, default to EXPLORER so they can use the main app
    if (!birthDate) return 'EXPLORER';
    
    const ageInMonths = calculateAgeInMonths(birthDate);
    
    // 2. Check for Pediatrician Approval (Allows <6m to use Explorer)
    if (ageInMonths < 6 && userProfile?.pediatricianApproved) {
        return 'EXPLORER';
    }
    
    // 3. Default Age-Based Logic
    if (ageInMonths < 6) return 'NEWBORN';
    if (ageInMonths >= 12) return 'TODDLER';
    return 'EXPLORER';
};

export const getModeConfig = (mode: AppMode): AppModeConfig => {
    switch (mode) {
        case 'NEWBORN':
            return {
                themeColor: 'bg-rose-500',
                textColor: 'text-rose-600',
                borderColor: 'border-rose-200',
                navItems: [
                    { id: 'feed', label: 'Log Feed', icon: 'milk' },
                    { id: 'diapers', label: 'Diapers', icon: 'baby' },
                    { id: 'growth', label: 'Growth', icon: 'ruler' },
                    { id: 'profile', label: 'Profile', icon: 'user' }
                ],
                homeTitle: "Newborn Log",
                showFoodTracker: false
            };
        case 'TODDLER':
            return {
                themeColor: 'bg-indigo-500',
                textColor: 'text-indigo-600',
                borderColor: 'border-indigo-200',
                navItems: [
                    { id: 'recipes', label: 'Meal Plan', icon: 'calendar' },
                    { id: 'picky_eater', label: 'Picky Eater', icon: 'frown' },
                    { id: 'balance', label: 'Balance', icon: 'scale' },
                    { id: 'profile', label: 'Profile', icon: 'user' }
                ],
                homeTitle: "Toddler Table",
                showFoodTracker: false
            };
        default: // EXPLORER
            return {
                themeColor: 'bg-teal-600',
                textColor: 'text-teal-600',
                borderColor: 'border-teal-200',
                navItems: [
                    { id: 'tracker', label: 'Tracker', icon: 'grid-3x3' },
                    { id: 'recommendations', label: 'Recs', icon: 'lightbulb' },
                    { id: 'recipes', label: 'Recipes', icon: 'notebook-pen' },
                    { id: 'learn', label: 'Learn', icon: 'book-open' },
                    { id: 'profile', label: 'Profile', icon: 'user' }
                ],
                homeTitle: "Tiny Tastes",
                showFoodTracker: true
            };
    }
};
