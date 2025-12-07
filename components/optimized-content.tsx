'use client';

import { useMemo } from 'react';
import Image from 'next/image';

interface ImageData {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  caption?: string;
}

interface ContentSegment {
  type: 'html' | 'image';
  content?: string;
  imageData?: ImageData;
}

function parseImageAttributes(imgTag: string): ImageData | null {
  const srcMatch = imgTag.match(/src=["']([^"']+)["']/);
  if (!srcMatch) return null;

  const src = srcMatch[1];
  const altMatch = imgTag.match(/alt=["']([^"']*)["']/);
  const widthMatch = imgTag.match(/width=["']?(\d+)["']?/);
  const heightMatch = imgTag.match(/height=["']?(\d+)["']?/);
  const classMatch = imgTag.match(/class=["']([^"']*)["']/);

  return {
    src,
    alt: altMatch?.[1] || '',
    width: widthMatch ? parseInt(widthMatch[1], 10) : undefined,
    height: heightMatch ? parseInt(heightMatch[1], 10) : undefined,
    className: classMatch?.[1] || '',
  };
}

function parseFigure(figureTag: string): { imageData: ImageData; caption?: string } | null {
  const imgMatch = figureTag.match(/<img[^>]+>/);
  if (!imgMatch) return null;

  const imageData = parseImageAttributes(imgMatch[0]);
  if (!imageData) return null;

  const captionMatch = figureTag.match(/<figcaption[^>]*>(.*?)<\/figcaption>/s);
  if (captionMatch) {
    imageData.caption = captionMatch[1].replace(/<[^>]*>/g, '').trim();
  }

  return { imageData, caption: imageData.caption };
}

function parseContent(html: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  
  const figurePattern = /<figure[^>]*>[\s\S]*?<\/figure>/gi;
  const imgPattern = /<img[^>]+>/gi;
  
  let lastIndex = 0;
  let combinedPattern = new RegExp(`(${figurePattern.source})|(${imgPattern.source})`, 'gi');
  let match;

  while ((match = combinedPattern.exec(html)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'html',
        content: html.slice(lastIndex, match.index),
      });
    }

    const matchedContent = match[0];
    
    if (matchedContent.startsWith('<figure')) {
      const figureData = parseFigure(matchedContent);
      if (figureData) {
        segments.push({
          type: 'image',
          imageData: figureData.imageData,
        });
      } else {
        segments.push({
          type: 'html',
          content: matchedContent,
        });
      }
    } else {
      const imageData = parseImageAttributes(matchedContent);
      if (imageData) {
        segments.push({
          type: 'image',
          imageData,
        });
      } else {
        segments.push({
          type: 'html',
          content: matchedContent,
        });
      }
    }

    lastIndex = match.index + matchedContent.length;
  }

  if (lastIndex < html.length) {
    segments.push({
      type: 'html',
      content: html.slice(lastIndex),
    });
  }

  return segments;
}

function OptimizedImage({ data }: { data: ImageData }) {
  const isExternal = data.src.startsWith('http://') || data.src.startsWith('https://');
  const isLocal = data.src.startsWith('/');
  
  if (!isExternal && !isLocal) {
    return (
      <img 
        src={data.src} 
        alt={data.alt} 
        className={data.className}
        loading="lazy"
      />
    );
  }

  const hasKnownDimensions = data.width && data.height && data.width > 0 && data.height > 0;

  if (hasKnownDimensions) {
    return (
      <figure className="my-6">
        <div className="relative overflow-hidden rounded-xl">
          <Image
            src={data.src}
            alt={data.alt}
            width={data.width}
            height={data.height}
            className={`w-full h-auto ${data.className || ''}`}
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 720px"
            quality={80}
          />
        </div>
        {data.caption && (
          <figcaption className="text-sm text-muted-foreground mt-2 text-center italic">
            {data.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className="my-6">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
        <Image
          src={data.src}
          alt={data.alt}
          fill
          className={`object-cover ${data.className || ''}`}
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 720px"
          quality={80}
        />
      </div>
      {data.caption && (
        <figcaption className="text-sm text-muted-foreground mt-2 text-center italic">
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
}

interface OptimizedContentProps {
  html: string;
  className?: string;
}

export function OptimizedContent({ html, className = '' }: OptimizedContentProps) {
  const segments = useMemo(() => parseContent(html), [html]);

  return (
    <div className={className} suppressHydrationWarning>
      {segments.map((segment, index) => {
        if (segment.type === 'image' && segment.imageData) {
          return <OptimizedImage key={`img-${index}`} data={segment.imageData} />;
        }
        
        return (
          <div
            key={`html-${index}`}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: segment.content || '' }}
          />
        );
      })}
    </div>
  );
}
