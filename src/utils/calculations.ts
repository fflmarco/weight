import { WeightEntry, FamilyMemberProfile, WeightStats, WeightUnit } from '../types';

export const LBS_TO_KG = 0.45359237;

export function lbsToKg(lbs: number): number {
  return lbs * LBS_TO_KG;
}

export function kgToLbs(kg: number): number {
  return kg / LBS_TO_KG;
}

export function convertWeight(weightLbs: number, targetUnit: WeightUnit): number {
  if (targetUnit === 'kg') {
    const kg = lbsToKg(weightLbs);
    return Number(kg.toFixed(2));
  }
  return Number(weightLbs.toFixed(1));
}

export function formatWeight(weightLbs: number, unit: WeightUnit): string {
  const value = convertWeight(weightLbs, unit);
  if (unit === 'kg') {
    return `${Number(value.toFixed(2))} ${unit}`;
  }
  return `${value.toFixed(1)} ${unit}`;
}

export function calculateBMI(weightLbs: number, heightCm?: number): { bmi: number; category: string } | null {
  if (!heightCm || heightCm <= 50) return null;
  const weightKg = lbsToKg(weightLbs);
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  // WHO Asian population cut-offs:
  // Underweight: < 18.5
  // Normal weight: 18.5 - 22.9
  // Overweight / At Risk: 23.0 - 24.9
  // Obese: >= 25.0
  let category = 'Normal';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 23.0) category = 'Normal';
  else if (bmi < 25.0) category = 'Overweight';
  else category = 'Obese';

  return { bmi, category };
}

export function getHealthyWeightRangeLbs(heightCm?: number): { min: number; max: number } | undefined {
  if (!heightCm || heightCm <= 50) return undefined;
  const heightM = heightCm / 100;
  // WHO Asian BMI healthy range: 18.5 to 22.9
  const minKg = 18.5 * (heightM * heightM);
  const maxKg = 22.9 * (heightM * heightM);
  return {
    min: Number(kgToLbs(minKg).toFixed(1)),
    max: Number(kgToLbs(maxKg).toFixed(1)),
  };
}

export function calculateStats(profile: FamilyMemberProfile, entries: WeightEntry[]): WeightStats {
  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (sorted.length === 0) {
    const starting = profile.startingWeightLbs;
    const bmiInfo = calculateBMI(starting, profile.heightCm);

    return {
      currentWeightLbs: starting,
      startingWeightLbs: starting,
      totalChangeLbs: 0,
      changeVsLastLogLbs: 0,
      changePercentage: 0,
      weeklyRateLbs: 0,
      minWeightLbs: starting,
      maxWeightLbs: starting,
      bmi: bmiInfo?.bmi ?? null,
      bmiCategory: bmiInfo?.category ?? null,
      healthyWeightRangeLbs: getHealthyWeightRangeLbs(profile.heightCm),
      entriesCount: 0,
      streakDays: 0,
      lastWeighedDate: null,
    };
  }

  const firstEntry = sorted[0];
  const lastEntry = sorted[sorted.length - 1];
  const currentWeightLbs = lastEntry.weightLbs;
  const startingWeightLbs = profile.startingWeightLbs || firstEntry.weightLbs;
  
  const totalChangeLbs = Number((currentWeightLbs - startingWeightLbs).toFixed(1));

  // Change vs the previous log entry
  let changeVsLastLogLbs = 0;
  if (sorted.length >= 2) {
    const prevEntry = sorted[sorted.length - 2];
    changeVsLastLogLbs = Number((lastEntry.weightLbs - prevEntry.weightLbs).toFixed(1));
  } else if (sorted.length === 1) {
    changeVsLastLogLbs = Number((lastEntry.weightLbs - startingWeightLbs).toFixed(1));
  }
  const changePercentage = startingWeightLbs > 0 
    ? Number(((totalChangeLbs / startingWeightLbs) * 100).toFixed(1)) 
    : 0;

  // Weekly rate calculation based on entries within last 30 days (or all entries if fewer)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentEntries = sorted.filter(e => new Date(e.date) >= thirtyDaysAgo);
  
  let weeklyRateLbs = 0;
  if (recentEntries.length >= 2) {
    const oldestRecent = recentEntries[0];
    const newestRecent = recentEntries[recentEntries.length - 1];
    const daysDiff = (new Date(newestRecent.date).getTime() - new Date(oldestRecent.date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff >= 3) {
      const weightDiff = newestRecent.weightLbs - oldestRecent.weightLbs;
      weeklyRateLbs = Number(((weightDiff / daysDiff) * 7).toFixed(2));
    }
  } else if (sorted.length >= 2) {
    const daysDiff = (new Date(lastEntry.date).getTime() - new Date(firstEntry.date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff >= 3) {
      const weightDiff = lastEntry.weightLbs - firstEntry.weightLbs;
      weeklyRateLbs = Number(((weightDiff / daysDiff) * 7).toFixed(2));
    }
  }

  const weights = sorted.map(e => e.weightLbs);
  const minWeightLbs = Math.min(...weights);
  const maxWeightLbs = Math.max(...weights);

  const bmiInfo = calculateBMI(currentWeightLbs, profile.heightCm);

  // Streak calculation (consecutive weeks or consecutive logged days)
  let streakDays = 0;
  const uniqueDates = Array.from(new Set(sorted.map(e => e.date))).sort().reverse();
  if (uniqueDates.length > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      streakDays = 1;
      let checkDate = new Date(uniqueDates[0]);
      for (let i = 1; i < uniqueDates.length; i++) {
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
        const expected = checkDate.toISOString().split('T')[0];
        if (uniqueDates[i] === expected) {
          streakDays++;
        } else {
          break;
        }
      }
    }
  }

  return {
    currentWeightLbs,
    startingWeightLbs,
    totalChangeLbs,
    changeVsLastLogLbs,
    changePercentage,
    weeklyRateLbs,
    minWeightLbs,
    maxWeightLbs,
    bmi: bmiInfo?.bmi ?? null,
    bmiCategory: bmiInfo?.category ?? null,
    healthyWeightRangeLbs: getHealthyWeightRangeLbs(profile.heightCm),
    entriesCount: sorted.length,
    streakDays,
    lastWeighedDate: lastEntry.date,
  };
}

export function computeMovingAverage(entries: { date: string; weight: number }[], windowSize = 7): { date: string; weight: number; movingAvg: number | null }[] {
  return entries.map((entry, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const windowSlice = entries.slice(start, index + 1);
    const sum = windowSlice.reduce((acc, curr) => acc + curr.weight, 0);
    const avg = Number((sum / windowSlice.length).toFixed(1));
    return {
      ...entry,
      movingAvg: windowSlice.length >= 2 ? avg : null,
    };
  });
}
