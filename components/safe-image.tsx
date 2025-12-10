'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useCallback, useRef } from 'react';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
}

const ALLOWED_DOMAINS = [
  'cursedtours.com',
  'www.cursedtours.com',
  'wp.cursedtours.com',
  'cms.cursedtours.com',
  'i0.wp.com',
  'i1.wp.com',
  'i2.wp.com',
  'i3.wp.com',
  's0.wp.com',
  's1.wp.com',
  's2.wp.com',
  'secure.gravatar.com',
  'images.unsplash.com',
  'media.tacdn.com',
];

function isAllowedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`) || hostname.endsWith('.media.tacdn.com')
    );
  } catch {
    return false;
  }
}

export function SafeImage({ src, fallbackSrc = '/assets/fallbacks/misty_dark_forest_supernatural.png', alt, fetchPriority, priority, ...props }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const hasErrored = useRef(false);
  
  const isExternal = typeof currentSrc === 'string' && currentSrc.startsWith('http');
  const shouldOptimize = !isExternal || isAllowedDomain(currentSrc as string);

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
      unoptimized={!shouldOptimize}
      priority={priority}
      fetchPriority={priority ? 'high' : fetchPriority}
    />
  );
}
