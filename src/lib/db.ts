import { supabase, isSupabaseConfigured } from './supabase';
import { SugarReading, BPReading, Profile, SugarReadingType, WeightReading } from '../types';

const getNumberFromMetadata = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getBooleanFromMetadata = (value: unknown): boolean => value === true || value === 'true';

const buildProfile = (
  base: Pick<Profile, 'id' | 'email' | 'created_at'> & Partial<Profile>,
  metadata: Record<string, unknown> = {}
): Profile => {
  // Load local overrides if they exist
  let localOverrides: any = {};
  if (typeof window !== 'undefined') {
    const localData = localStorage.getItem(`sugarcare_profile_override_${base.id}`);
    if (localData) {
      try {
        localOverrides = JSON.parse(localData);
      } catch (e) {
        console.error('Error parsing local overrides', e);
      }
    }
  }

  // Helper to choose the best available value
  const getValue = <T>(dbVal: T | undefined, localVal: T | undefined, metaVal: any, defaultVal: T): T => {
    if (dbVal !== undefined && dbVal !== null) return dbVal;
    if (localVal !== undefined && localVal !== null) return localVal;
    if (metaVal !== undefined && metaVal !== null) {
      if (typeof defaultVal === 'boolean') return getBooleanFromMetadata(metaVal) as unknown as T;
      if (typeof defaultVal === 'number' || defaultVal === null) {
        const num = getNumberFromMetadata(metaVal);
        return (num !== null ? num : defaultVal) as unknown as T;
      }
      return metaVal as unknown as T;
    }
    return defaultVal;
  };

  return {
    id: base.id,
    email: base.email,
    full_name: base.full_name ?? (typeof metadata.full_name === 'string' ? metadata.full_name : null),
    created_at: base.created_at,
    age: getValue(base.age, localOverrides.age, metadata.age, null),
    has_diabetes: getValue(base.has_diabetes, localOverrides.has_diabetes, metadata.has_diabetes, false),
    has_high_bp: getValue(base.has_high_bp, localOverrides.has_high_bp, metadata.has_high_bp, false),
    has_low_bp: getValue(base.has_low_bp, localOverrides.has_low_bp, metadata.has_low_bp, false),
  };
};

// Helper for generating UUIDs in Demo Mode
const generateUUID = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Generates 30 days of realistic medical records for demo purposes
const generateMockData = () => {
  const sugar: SugarReading[] = [];
  const bp: BPReading[] = [];
  const weight: WeightReading[] = [];
  const now = new Date();
  
  const sugarTypes: SugarReadingType[] = ['Fasting', 'Before Meal', 'After Meal', 'Random'];
  const notesTemplates = {
    Fasting: ['Woke up feeling good', 'Slept 8 hours', 'Slightly low sleep quality', 'Routine check'],
    'Before Meal': ['Before lunch', 'Hungry', 'Before dinner', 'Pre-snack check'],
    'After Meal': ['2 hours after pasta', 'After salad and chicken', 'Felt a bit sluggish after dessert', 'Routine post-meal'],
    Random: ['Afternoon check', 'During exercise', 'Before bed', 'Stressed at work']
  };

  let currentWeight = 78.5; // starting weight in kg

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    // Create 1-2 sugar entries per day
    const entriesToday = Math.random() > 0.4 ? 2 : 1;
    for (let j = 0; j < entriesToday; j++) {
      const type = sugarTypes[Math.floor(Math.random() * sugarTypes.length)];
      let val = 100;
      
      if (type === 'Fasting') {
        val = Math.floor(Math.random() * (110 - 75 + 1)) + 75; // 75-110 normal fasting
      } else if (type === 'After Meal') {
        val = Math.floor(Math.random() * (165 - 110 + 1)) + 110; // 110-165 post-meal
      } else {
        val = Math.floor(Math.random() * (140 - 80 + 1)) + 80; // 80-140 random/before-meal
      }

      // Add a couple spikes
      if (i === 15 && type === 'After Meal') val = 210;
      if (i === 5 && type === 'Fasting') val = 62;

      const typeNotes = notesTemplates[type];
      const notes = Math.random() > 0.3 ? typeNotes[Math.floor(Math.random() * typeNotes.length)] : '';
      
      const readingTime = new Date(date);
      readingTime.setHours(type === 'Fasting' ? 7 : type === 'Before Meal' ? 12 : type === 'After Meal' ? 14 : 19);
      readingTime.setMinutes(Math.floor(Math.random() * 60));

      sugar.push({
        id: generateUUID(),
        user_id: 'demo-user',
        sugar_value: val,
        reading_type: type,
        notes: notes || null,
        reading_time: readingTime.toISOString(),
        created_at: readingTime.toISOString()
      });
    }

    // Create 1 BP entry every 1-2 days
    if (Math.random() > 0.3) {
      // Normal BP ~ 120/80
      let sys = Math.floor(Math.random() * (135 - 110 + 1)) + 110;
      let dia = Math.floor(Math.random() * (88 - 70 + 1)) + 70;
      let pulse = Math.floor(Math.random() * (85 - 65 + 1)) + 65;

      // Add occasional high/low reading
      if (i === 22) {
        sys = 145;
        dia = 92;
        pulse = 90;
      }
      if (i === 10) {
        sys = 118;
        dia = 74;
        pulse = 62;
      }

      const bpNotes = sys > 140 || dia > 90 
        ? 'Had double espresso earlier' 
        : Math.random() > 0.7 
          ? 'Post-exercise' 
          : 'Relaxed state';

      const readingTime = new Date(date);
      readingTime.setHours(Math.random() > 0.5 ? 9 : 18);
      readingTime.setMinutes(Math.floor(Math.random() * 60));

      bp.push({
        id: generateUUID(),
        user_id: 'demo-user',
        systolic: sys,
        diastolic: dia,
        pulse,
        notes: bpNotes || null,
        reading_time: readingTime.toISOString(),
        created_at: readingTime.toISOString()
      });
    }

    // Create a weight entry every 1-2 days
    if (Math.random() > 0.4) {
      currentWeight += (Math.random() - 0.5) * 0.4; // fluctuate weight
      currentWeight = Math.round(currentWeight * 10) / 10;

      const readingTime = new Date(date);
      readingTime.setHours(8); // taken in morning
      readingTime.setMinutes(Math.floor(Math.random() * 30));

      weight.push({
        id: generateUUID(),
        user_id: 'demo-user',
        weight_value: currentWeight,
        notes: Math.random() > 0.8 ? 'After morning walk' : null,
        reading_time: readingTime.toISOString(),
        created_at: readingTime.toISOString()
      });
    }
  }

  return { sugar, bp, weight };
};

// Local storage key constants
const STORAGE_KEYS = {
  USER: 'sugarcare_user',
  SUGAR: 'sugarcare_sugar_readings',
  BP: 'sugarcare_bp_readings',
  WEIGHT: 'sugarcare_weight_readings'
};

// Initial state setup for localStorage
const getLocalStorageState = () => {
  if (typeof window === 'undefined') return { user: null, sugar: [], bp: [], weight: [] };

  let userStr = localStorage.getItem(STORAGE_KEYS.USER);
  let sugarStr = localStorage.getItem(STORAGE_KEYS.SUGAR);
  let bpStr = localStorage.getItem(STORAGE_KEYS.BP);
  let weightStr = localStorage.getItem(STORAGE_KEYS.WEIGHT);

  let user: Profile | null = userStr ? JSON.parse(userStr) : null;
  let sugar: SugarReading[] = sugarStr ? JSON.parse(sugarStr) : [];
  let bp: BPReading[] = bpStr ? JSON.parse(bpStr) : [];
  let weight: WeightReading[] = weightStr ? JSON.parse(weightStr) : [];

  // Seed default data if empty (helps in demo)
  if (!user && sugar.length === 0 && bp.length === 0 && weight.length === 0) {
    const mock = generateMockData();
    localStorage.setItem(STORAGE_KEYS.SUGAR, JSON.stringify(mock.sugar));
    localStorage.setItem(STORAGE_KEYS.BP, JSON.stringify(mock.bp));
    localStorage.setItem(STORAGE_KEYS.WEIGHT, JSON.stringify(mock.weight));
    sugar = mock.sugar;
    bp = mock.bp;
    weight = mock.weight;
  }

  return { user, sugar, bp, weight };
};

export const db = {
  isDemoMode: !isSupabaseConfigured,

  // --- AUTHENTICATION ---
  async getCurrentUser(): Promise<Profile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      return profile ? buildProfile(profile, user.user_metadata ?? {}) : null;
    } else {
      const { user } = getLocalStorageState();
      return user;
    }
  },

  async signUp(
    email: string, 
    password: string, 
    fullName: string, 
    age: number | null, 
    hasDiabetes: boolean, 
    hasHighBP: boolean, 
    hasLowBP: boolean
  ): Promise<Profile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            age,
            has_diabetes: hasDiabetes,
            has_high_bp: hasHighBP,
            has_low_bp: hasLowBP
          }
        }
      });
      if (error) throw error;
      if (!data.user) throw new Error('Sign up failed');

      // Wait a moment for trigger or manually upsert profile
      const newProfile: Profile = {
        id: data.user.id,
        email,
        full_name: fullName,
        created_at: new Date().toISOString(),
        age,
        has_diabetes: hasDiabetes,
        has_high_bp: hasHighBP,
        has_low_bp: hasLowBP
      };
      return newProfile;
    } else {
      const newUser: Profile = {
        id: 'demo-user-' + generateUUID().slice(0, 8),
        email,
        full_name: fullName,
        created_at: new Date().toISOString(),
        age,
        has_diabetes: hasDiabetes,
        has_high_bp: hasHighBP,
        has_low_bp: hasLowBP
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      return newUser;
    }
  },

  async signIn(email: string, password: string): Promise<Profile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      if (!data.user) throw new Error('Sign in failed');

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileErr) throw profileErr;
      return buildProfile(profile, data.user.user_metadata ?? {});
    } else {
      // Mock login check
      const newUser: Profile = {
        id: 'demo-user',
        email: email || 'demo@sugarcare.com',
        full_name: email.split('@')[0].toUpperCase() || 'JANE DOE',
        created_at: new Date().toISOString(),
        age: 35,
        has_diabetes: false,
        has_high_bp: false,
        has_low_bp: false
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      return newUser;
    }
  },

  async signInWithGoogle(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : ''
        }
      });
      if (error) throw error;
    } else {
      // Mock Google Login
      const newUser: Profile = {
        id: 'demo-google-user',
        email: 'google.demo@sugarcare.com',
        full_name: 'Google Demo User',
        created_at: new Date().toISOString(),
        age: 35,
        has_diabetes: false,
        has_high_bp: false,
        has_low_bp: false
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    }
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  // --- SUGAR READINGS CRUD ---
  async getSugarReadings(): Promise<SugarReading[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('sugar_readings')
        .select('*')
        .order('reading_time', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } else {
      const { sugar } = getLocalStorageState();
      return sugar.sort((a, b) => new Date(b.reading_time).getTime() - new Date(a.reading_time).getTime());
    }
  },

  async addSugarReading(value: number, type: SugarReadingType, notes: string | null, readingTime: string): Promise<SugarReading> {
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Unauthenticated');

      const { data, error } = await supabase
        .from('sugar_readings')
        .insert({
          user_id: user.id,
          sugar_value: value,
          reading_type: type,
          notes,
          reading_time: readingTime
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { sugar } = getLocalStorageState();
      const newReading: SugarReading = {
        id: generateUUID(),
        user_id: 'demo-user',
        sugar_value: value,
        reading_type: type,
        notes,
        reading_time: readingTime,
        created_at: new Date().toISOString()
      };

      sugar.push(newReading);
      localStorage.setItem(STORAGE_KEYS.SUGAR, JSON.stringify(sugar));
      return newReading;
    }
  },

  async updateSugarReading(id: string, value: number, type: SugarReadingType, notes: string | null, readingTime: string): Promise<SugarReading> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('sugar_readings')
        .update({
          sugar_value: value,
          reading_type: type,
          notes,
          reading_time: readingTime
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { sugar } = getLocalStorageState();
      const index = sugar.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Reading not found');

      sugar[index] = {
        ...sugar[index],
        sugar_value: value,
        reading_type: type,
        notes,
        reading_time: readingTime
      };

      localStorage.setItem(STORAGE_KEYS.SUGAR, JSON.stringify(sugar));
      return sugar[index];
    }
  },

  async deleteSugarReading(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('sugar_readings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } else {
      const { sugar } = getLocalStorageState();
      const filtered = sugar.filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.SUGAR, JSON.stringify(filtered));
    }
  },

  // --- BLOOD PRESSURE CRUD ---
  async getBPReadings(): Promise<BPReading[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('bp_readings')
        .select('*')
        .order('reading_time', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } else {
      const { bp } = getLocalStorageState();
      return bp.sort((a, b) => new Date(b.reading_time).getTime() - new Date(a.reading_time).getTime());
    }
  },

  async addBPReading(systolic: number, diastolic: number, pulse: number, notes: string | null, readingTime: string): Promise<BPReading> {
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Unauthenticated');

      const { data, error } = await supabase
        .from('bp_readings')
        .insert({
          user_id: user.id,
          systolic,
          diastolic,
          pulse,
          notes,
          reading_time: readingTime
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { bp } = getLocalStorageState();
      const newReading: BPReading = {
        id: generateUUID(),
        user_id: 'demo-user',
        systolic,
        diastolic,
        pulse,
        notes,
        reading_time: readingTime,
        created_at: new Date().toISOString()
      };

      bp.push(newReading);
      localStorage.setItem(STORAGE_KEYS.BP, JSON.stringify(bp));
      return newReading;
    }
  },

  async updateBPReading(id: string, systolic: number, diastolic: number, pulse: number, notes: string | null, readingTime: string): Promise<BPReading> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('bp_readings')
        .update({
          systolic,
          diastolic,
          pulse,
          notes,
          reading_time: readingTime
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { bp } = getLocalStorageState();
      const index = bp.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Reading not found');

      bp[index] = {
        ...bp[index],
        systolic,
        diastolic,
        pulse,
        notes,
        reading_time: readingTime
      };

      localStorage.setItem(STORAGE_KEYS.BP, JSON.stringify(bp));
      return bp[index];
    }
  },

  async deleteBPReading(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('bp_readings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } else {
      const { bp } = getLocalStorageState();
      const filtered = bp.filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.BP, JSON.stringify(filtered));
    }
  },

  // --- WEIGHT READINGS CRUD ---
  async getWeightReadings(): Promise<WeightReading[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('weight_readings')
        .select('*')
        .order('reading_time', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } else {
      const { weight } = getLocalStorageState();
      return weight.sort((a, b) => new Date(b.reading_time).getTime() - new Date(a.reading_time).getTime());
    }
  },

  async addWeightReading(value: number, notes: string | null, readingTime: string): Promise<WeightReading> {
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Unauthenticated');

      const { data, error } = await supabase
        .from('weight_readings')
        .insert({
          user_id: user.id,
          weight_value: value,
          notes,
          reading_time: readingTime
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { weight } = getLocalStorageState();
      const newReading: WeightReading = {
        id: generateUUID(),
        user_id: 'demo-user',
        weight_value: value,
        notes,
        reading_time: readingTime,
        created_at: new Date().toISOString()
      };

      weight.push(newReading);
      localStorage.setItem(STORAGE_KEYS.WEIGHT, JSON.stringify(weight));
      return newReading;
    }
  },

  async updateWeightReading(id: string, value: number, notes: string | null, readingTime: string): Promise<WeightReading> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('weight_readings')
        .update({
          weight_value: value,
          notes,
          reading_time: readingTime
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { weight } = getLocalStorageState();
      const index = weight.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Reading not found');

      weight[index] = {
        ...weight[index],
        weight_value: value,
        notes,
        reading_time: readingTime
      };

      localStorage.setItem(STORAGE_KEYS.WEIGHT, JSON.stringify(weight));
      return weight[index];
    }
  },

  async deleteWeightReading(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('weight_readings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } else {
      const { weight } = getLocalStorageState();
      const filtered = weight.filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.WEIGHT, JSON.stringify(filtered));
    }
  },

  async deleteAccount(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.SUGAR);
      localStorage.removeItem(STORAGE_KEYS.BP);
      localStorage.removeItem(STORAGE_KEYS.WEIGHT);
    }
  },

  async updateProfile(
    fullName: string, 
    age: number | null, 
    hasDiabetes: boolean, 
    hasHighBP: boolean, 
    hasLowBP: boolean
  ): Promise<Profile> {
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Unauthenticated');

      // Update auth user metadata first (this always works and keeps user state updated)
      const { data: authUpdate, error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          age,
          has_diabetes: hasDiabetes,
          has_high_bp: hasHighBP,
          has_low_bp: hasLowBP
        }
      });
      if (authError) throw authError;

      try {
        // Try to update all columns in the profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            age,
            has_diabetes: hasDiabetes,
            has_high_bp: hasHighBP,
            has_low_bp: hasLowBP
          })
          .eq('id', user.id)
          .select()
          .single();

        if (profileError) throw profileError;

        // If table update was successful, remove local storage overrides to keep it clean
        localStorage.removeItem(`sugarcare_profile_override_${user.id}`);
        return buildProfile(profile, authUpdate.user?.user_metadata ?? user.user_metadata ?? {});
      } catch (err: any) {
        // Check if error is related to missing database columns
        const isMissingColumns = err.message?.includes('column') || 
                                 err.message?.includes('schema cache') || 
                                 err.code === 'PGRST104' || 
                                 err.message?.includes('does not exist');

        if (isMissingColumns) {
          console.warn('Supabase profiles table is missing new health columns. Falling back to localStorage for these fields.', err);
          
          // Gracefully fallback: only update full_name in the profiles table
          const { data: profile, error: fallbackError } = await supabase
            .from('profiles')
            .update({
              full_name: fullName
            })
            .eq('id', user.id)
            .select()
            .single();

          if (fallbackError) throw fallbackError;

          // Save settings to localStorage as override
          const overrides = {
            age,
            has_diabetes: hasDiabetes,
            has_high_bp: hasHighBP,
            has_low_bp: hasLowBP
          };
          localStorage.setItem(`sugarcare_profile_override_${user.id}`, JSON.stringify(overrides));

          // Return merged profile
          return buildProfile(profile, {
            ...authUpdate.user?.user_metadata,
            ...overrides
          });
        } else {
          // Re-throw other database errors
          throw err;
        }
      }
    } else {
      const { user } = getLocalStorageState();
      if (!user) throw new Error('Unauthenticated');
      
      const updated: Profile = {
        ...user,
        full_name: fullName,
        age,
        has_diabetes: hasDiabetes,
        has_high_bp: hasHighBP,
        has_low_bp: hasLowBP
      };
      
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      return updated;
    }
  }
};
