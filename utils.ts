
import { UserProfile } from "./types";

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
