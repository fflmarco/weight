import React from 'react';
import { 
  User, Heart, Zap, Smile, Star, Flame, Dumbbell, 
  Activity, Compass, Shield, Sparkles, Trophy 
} from 'lucide-react';

interface AvatarIconProps {
  iconName: string;
  className?: string;
  colorClass?: string;
  size?: number;
}

export const AVAILABLE_ICONS = [
  { name: 'User', label: 'Person', icon: User },
  { name: 'Heart', label: 'Heart', icon: Heart },
  { name: 'Zap', label: 'Energy', icon: Zap },
  { name: 'Flame', label: 'Fitness', icon: Flame },
  { name: 'Dumbbell', label: 'Workout', icon: Dumbbell },
  { name: 'Activity', label: 'Health', icon: Activity },
  { name: 'Smile', label: 'Smile', icon: Smile },
  { name: 'Star', label: 'Star', icon: Star },
  { name: 'Trophy', label: 'Champion', icon: Trophy },
  { name: 'Sparkles', label: 'Sparkle', icon: Sparkles },
  { name: 'Shield', label: 'Strength', icon: Shield },
  { name: 'Compass', label: 'Journey', icon: Compass },
];

export const AVAILABLE_COLORS = [
  { name: 'Emerald', bgClass: 'bg-emerald-600', textClass: 'text-white', borderClass: 'border-emerald-600' },
  { name: 'Rose', bgClass: 'bg-rose-500', textClass: 'text-white', borderClass: 'border-rose-500' },
  { name: 'Sky', bgClass: 'bg-sky-500', textClass: 'text-white', borderClass: 'border-sky-500' },
  { name: 'Amber', bgClass: 'bg-amber-500', textClass: 'text-white', borderClass: 'border-amber-500' },
  { name: 'Violet', bgClass: 'bg-violet-600', textClass: 'text-white', borderClass: 'border-violet-600' },
  { name: 'Indigo', bgClass: 'bg-indigo-600', textClass: 'text-white', borderClass: 'border-indigo-600' },
  { name: 'Teal', bgClass: 'bg-teal-600', textClass: 'text-white', borderClass: 'border-teal-600' },
  { name: 'Orange', bgClass: 'bg-orange-500', textClass: 'text-white', borderClass: 'border-orange-500' },
];

export const AvatarIcon: React.FC<AvatarIconProps> = ({ 
  iconName, 
  className = 'w-5 h-5', 
  colorClass = 'bg-emerald-600',
  size 
}) => {
  const matched = AVAILABLE_ICONS.find(i => i.name.toLowerCase() === iconName.toLowerCase()) || AVAILABLE_ICONS[0];
  const IconComponent = matched.icon;

  return (
    <div 
      className={`rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${colorClass} ${className}`}
    >
      <IconComponent size={size ?? 18} />
    </div>
  );
};
