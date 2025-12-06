'use client';

import Image from 'next/image';

const iconPaths: Record<string, string> = {
  'new-orleans': '/images/city-icons/new_orleans_haunted_cemetery_icon.png',
  'london': '/images/city-icons/london_haunted_victorian_icon.png',
  'edinburgh': '/images/city-icons/edinburgh_haunted_castle_icon.png',
  'savannah': '/images/city-icons/savannah_haunted_mansion_icon.png',
  'salem': '/images/city-icons/salem_witch_trial_icon.png',
  'chicago': '/images/city-icons/chicago_gangster_haunted_icon.png',
  'new-york': '/images/city-icons/new_york_haunted_brownstone_icon.png',
  'boston': '/images/city-icons/boston_colonial_haunted_icon.png',
  'gettysburg': '/images/city-icons/gettysburg_battlefield_haunted_icon.png',
  'st-augustine': '/images/city-icons/st_augustine_spanish_fort_icon.png',
  'charleston': '/images/city-icons/charleston_plantation_haunted_icon.png',
  'dublin': '/images/city-icons/dublin_haunted_celtic_icon.png',
};

interface CityIconProps {
  cityId: string;
  alt: string;
  size?: number;
  className?: string;
}

export function CityIcon({ cityId, alt, size = 56, className }: CityIconProps) {
  const iconPath = iconPaths[cityId];
  
  if (!iconPath) {
    return (
      <div 
        className={`bg-muted flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-muted-foreground">?</span>
      </div>
    );
  }

  return (
    <Image
      src={iconPath}
      alt={alt}
      width={size}
      height={size}
      className={`object-cover ${className}`}
    />
  );
}

export default CityIcon;
