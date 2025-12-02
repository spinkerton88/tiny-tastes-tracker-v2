
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
                    { id: 'feed', label: 'Log', icon: 'clipboard-list' }, // Changed label and icon
                    { id: 'health_check', label: 'Is it Normal?', icon: 'activity' },
                    { id: 'sleep_growth', label: 'Sleep & Growth', icon: 'ruler' },
                    { id: 'learn', label: 'Learn', icon: 'book-open' },
                    { id: 'profile', label: 'Profile', icon: 'user' }
                ],
                homeTitle: "Tiny Tastes",
                showFoodTracker: false
            };
        case 'TODDLER':
            return {
                themeColor: 'bg-indigo-500',
                textColor: 'text-indigo-600',
                borderColor: 'border-indigo-200',
                navItems: [
                    { id: 'recipes', label: 'Meal', icon: 'utensils' },
                    { id: 'picky_eater', label: 'Picky Eater', icon: 'frown' },
                    { id: 'balance', label: 'Balance', icon: 'scale' },
                    { id: 'learn', label: 'Learn', icon: 'book-open' },
                    { id: 'profile', label: 'Profile', icon: 'user' }
                ],
                homeTitle: "Tiny Tastes",
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

// --- Growth Standards (Simplified WHO LMS Data 0-24m) ---
const WHO_GROWTH_DATA = {
    boy: {
        weight: [ // kg
            { m: 0, l: 0.3487, m_val: 3.346, s: 0.146 },
            { m: 1, l: 0.2646, m_val: 4.471, s: 0.134 },
            { m: 2, l: 0.2096, m_val: 5.576, s: 0.125 },
            { m: 3, l: 0.1748, m_val: 6.421, s: 0.119 },
            { m: 4, l: 0.1485, m_val: 7.045, s: 0.116 },
            { m: 6, l: 0.0908, m_val: 7.939, s: 0.114 },
            { m: 9, l: 0.0528, m_val: 8.895, s: 0.113 },
            { m: 12, l: 0.0322, m_val: 9.637, s: 0.113 },
            { m: 18, l: 0.0322, m_val: 10.9, s: 0.113 }, // Approx
            { m: 24, l: 0.0322, m_val: 12.15, s: 0.110 }
        ],
        length: [ // cm
            { m: 0, l: 1, m_val: 49.88, s: 0.038 },
            { m: 1, l: 1, m_val: 54.72, s: 0.036 },
            { m: 2, l: 1, m_val: 58.42, s: 0.035 },
            { m: 3, l: 1, m_val: 61.44, s: 0.034 },
            { m: 6, l: 1, m_val: 67.62, s: 0.034 },
            { m: 12, l: 1, m_val: 75.75, s: 0.034 },
            { m: 24, l: 1, m_val: 87.80, s: 0.035 }
        ]
    },
    girl: {
        weight: [
            { m: 0, l: 0.3957, m_val: 3.232, s: 0.142 },
            { m: 1, l: 0.3236, m_val: 4.187, s: 0.131 },
            { m: 2, l: 0.2725, m_val: 5.128, s: 0.122 },
            { m: 3, l: 0.2319, m_val: 5.835, s: 0.118 },
            { m: 4, l: 0.1970, m_val: 6.422, s: 0.116 },
            { m: 6, l: 0.1268, m_val: 7.297, s: 0.115 },
            { m: 9, l: 0.0820, m_val: 8.205, s: 0.114 },
            { m: 12, l: 0.0450, m_val: 8.913, s: 0.115 },
            { m: 18, l: 0.0450, m_val: 10.2, s: 0.115 }, // Approx
            { m: 24, l: 0.0450, m_val: 11.48, s: 0.114 }
        ],
        length: [
            { m: 0, l: 1, m_val: 49.15, s: 0.038 },
            { m: 1, l: 1, m_val: 53.70, s: 0.036 },
            { m: 2, l: 1, m_val: 57.07, s: 0.035 },
            { m: 3, l: 1, m_val: 59.80, s: 0.034 },
            { m: 6, l: 1, m_val: 65.73, s: 0.035 },
            { m: 12, l: 1, m_val: 74.02, s: 0.035 },
            { m: 24, l: 1, m_val: 86.40, s: 0.036 }
        ]
    }
};

// Basic normal CDF approximation
function normalcdf(X: number){   //HASTINGS.  MAX ERROR = .000001
	var T=1/(1+.2316419*Math.abs(X));
	var D=.3989423*Math.exp(-X*X/2);
	var Prob=D*T*(.3193815+T*(-.3565638+T*(1.781478+T*(-1.821256+T*1.330274))));
	if (X>0) {
		Prob=1-Prob
	}
	return Prob
}

export const calculateGrowthPercentile = (value: number, type: 'weight' | 'height', gender: 'boy' | 'girl', ageMonths: number): number | null => {
    // 1. Find the LMS data points
    const data = WHO_GROWTH_DATA[gender][type === 'weight' ? 'weight' : 'length'];
    
    // Find closest months
    let lower = data[0];
    let upper = data[data.length - 1];
    
    for (let i = 0; i < data.length - 1; i++) {
        if (ageMonths >= data[i].m && ageMonths <= data[i+1].m) {
            lower = data[i];
            upper = data[i+1];
            break;
        }
    }
    
    if (!lower || !upper) return null;

    // 2. Interpolate L, M, S
    const ratio = (ageMonths - lower.m) / Math.max(1, (upper.m - lower.m));
    
    const L = lower.l + (upper.l - lower.l) * ratio;
    const M = lower.m_val + (upper.m_val - lower.m_val) * ratio;
    const S = lower.s + (upper.s - lower.s) * ratio;

    // 3. Calculate Z-score
    // Z = ((value / M)^L - 1) / (L * S)
    if (L === 0) return null; // Avoid division by zero, though WHO L is rarely 0
    const zScore = (Math.pow(value / M, L) - 1) / (L * S);

    // 4. Convert Z-score to Percentile
    const percentile = normalcdf(zScore) * 100;
    
    return Math.round(percentile);
};
