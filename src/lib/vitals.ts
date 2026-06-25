import { Profile, SugarReadingType } from '@/types';

/**
 * Checks if a blood sugar reading is considered "Controlled"
 * based on the user's diabetes status.
 */
export const checkSugarControlled = (
  value: number, 
  type: SugarReadingType, 
  profile: Profile | null
): boolean => {
  const hasDiabetes = profile?.has_diabetes ?? false;

  if (hasDiabetes) {
    // Diabetic Targets (ADA guidelines: Fasting/pre-meal 80-130, post-meal < 180)
    if (type === 'Fasting' || type === 'Before Meal') {
      return value >= 80 && value <= 130;
    } else if (type === 'After Meal') {
      return value >= 80 && value < 180;
    } else { // Random
      return value >= 80 && value < 180;
    }
  } else {
    // Normal Non-Diabetic Targets
    if (type === 'Fasting') {
      return value >= 70 && value < 100;
    } else if (type === 'Before Meal') {
      return value >= 70 && value <= 110;
    } else if (type === 'After Meal') {
      return value >= 70 && value < 140;
    } else { // Random
      return value >= 70 && value <= 140;
    }
  }
};

/**
 * Checks if a blood pressure reading is considered "Controlled"
 * based on the user's high/low BP history.
 */
export const checkBPControlled = (
  systolic: number, 
  diastolic: number, 
  profile: Profile | null
): boolean => {
  const hasHighBP = profile?.has_high_bp ?? false;
  const hasLowBP = profile?.has_low_bp ?? false;

  if (hasHighBP) {
    // Hypertension target (AHA: under 130/80 mmHg is controlled)
    return systolic < 130 && diastolic < 80 && systolic >= 90 && diastolic >= 60;
  }
  
  if (hasLowBP) {
    // Hypotension target (controlled means avoiding low BP: above 90/60 mmHg)
    return systolic >= 90 && diastolic >= 60 && systolic < 140 && diastolic < 90;
  }

  // Normal standard target
  return systolic >= 90 && systolic < 120 && diastolic >= 60 && diastolic < 80;
};
