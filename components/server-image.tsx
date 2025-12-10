import Image, { ImageProps } from 'next/image';

interface ServerImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
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

/**
 * Server-compatible image component for static/SSR content.
 * Does not handle errors client-side - use SafeImage for interactive components.
 */
export function ServerImage({ src, alt, ...props }: ServerImageProps) {
  const isExternal = typeof src === 'string' && src.startsWith('http');
  const shouldOptimize = !isExternal || isAllowedDomain(src as string);

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      unoptimized={!shouldOptimize}
    />
  );
}
