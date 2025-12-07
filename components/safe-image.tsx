'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useCallback, useRef } from 'react';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

export function SafeImage({ src, fallbackSrc = '/assets/fallbacks/misty_dark_forest_supernatural.png', alt, ...props }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const hasErrored = useRef(false);
  
  const isExternal = typeof currentSrc === 'string' && currentSrc.startsWith('http');

  const handleError = useCallback(() => {
    if (!hasErrored.current && fallbackSrc) {
      hasErrored.current = true;
      setCurrentSrc(fallbackSrc);
    }
  }, [fallbackSrc]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={handleError}
      unoptimized={isExternal}
    />
  );
}
