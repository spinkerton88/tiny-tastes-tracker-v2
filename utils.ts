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
