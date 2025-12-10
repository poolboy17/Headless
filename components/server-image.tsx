import Image, { ImageProps } from 'next/image';

interface ServerImageProps extends Omit<ImageProps, 'onError'> {
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

// Tiny dark placeholder for hero images (4x2 pixels, very dark)
const DARK_BLUR_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAIAAADwyuo0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAI0lEQVQImWNgYGBgYGD4z8DAwMDAwPCfgYGBgYHh////DAwMADI4BAXVnFuAAAAAAElFTkSuQmCC';

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

/**
 * Server-compatible image component for static/SSR content.
 * Supports blur placeholder for instant visual feedback.
 * Does not handle errors client-side - use SafeImage for interactive components.
 */
export function ServerImage({ 
  src, 
  alt, 
  priority,
  fetchPriority,
  placeholder,
  blurDataURL,
  ...props 
}: ServerImageProps) {
  const isExternal = typeof src === 'string' && src.startsWith('http');
  const shouldOptimize = !isExternal || isAllowedDomain(src as string);

  // Use blur placeholder for priority images to eliminate flash
  const usePlaceholder = priority && !placeholder;
  
  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      priority={priority}
      fetchPriority={priority ? 'high' : fetchPriority}
      unoptimized={!shouldOptimize}
      placeholder={usePlaceholder ? 'blur' : placeholder}
      blurDataURL={usePlaceholder ? DARK_BLUR_PLACEHOLDER : blurDataURL}
    />
  );
}
