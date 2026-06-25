export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  age?: number | null;
  has_diabetes: boolean;
  has_high_bp: boolean;
  has_low_bp: boolean;
}

export type SugarReadingType = 'Fasting' | 'Before Meal' | 'After Meal' | 'Random';

export interface SugarReading {
  id: string;
  user_id: string;
  sugar_value: number; // between 20 and 600
  reading_type: SugarReadingType;
  notes: string | null;
  reading_time: string; // ISO date-time string
  created_at: string;
}

export interface BPReading {
  id: string;
  user_id: string;
  systolic: number; // 50-250
  diastolic: number; // 30-150
  pulse: number;
  notes: string | null;
  reading_time: string; // ISO date-time string
  created_at: string;
}

export interface WeightReading {
  id: string;
  user_id: string;
  weight_value: number; // between 10 and 500
  notes: string | null;
  reading_time: string; // ISO date-time string
  created_at: string;
}
