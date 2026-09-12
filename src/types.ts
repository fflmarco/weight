export type WeightUnit = 'lbs' | 'kg';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'post-workout';

export interface WeightEntry {
  id: string;
  profileId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  timeOfDay?: TimeOfDay;
  weightLbs: number; // Stored canonically in lbs, converted to display unit
  bodyFatPercentage?: number;
  notes?: string;
  tags?: string[];
  mood?: 'great' | 'good' | 'neutral' | 'struggling';
  createdAt: string;
}

export interface FamilyMemberProfile {
  id: string;
  name: string;
  relationship?: string;
  avatarColor: string; // tailwind color class or hex
  avatarIcon: string; // Lucide icon identifier
  preferredUnit: WeightUnit;
  heightCm?: number; // For BMI calculation
  startingWeightLbs: number;
  dateOfBirth?: string;
  createdAt: string;
}

export interface WeightStats {
  currentWeightLbs: number;
  startingWeightLbs: number;
  totalChangeLbs: number;
  changeVsLastLogLbs: number;
  changePercentage: number;
  weeklyRateLbs: number;
  minWeightLbs: number;
  maxWeightLbs: number;
  bmi: number | null;
  bmiCategory: string | null;
  healthyWeightRangeLbs?: { min: number; max: number };
  entriesCount: number;
  streakDays: number;
  lastWeighedDate: string | null;
}
