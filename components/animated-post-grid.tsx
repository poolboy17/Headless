'use client';

import { useEffect, useRef, useState } from 'react';
import { PostCard } from '@/components/post-card';
import type { WPPost } from '@/lib/wordpress';
import { cn } from '@/lib/utils';

interface AnimatedPostGridProps {
  posts: WPPost[];
  className?: string;
  staggerDelay?: number;
}

export function AnimatedPostGrid({
  posts,
  className,
  staggerDelay = 100,
}: AnimatedPostGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn('grid gap-6 md:grid-cols-2 lg:grid-cols-3', className)}
    >
      {posts.map((post, index) => (
        <div
          key={post.id}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'none' : 'translateY(30px)',
            transition: 'opacity 500ms ease-out, transform 500ms ease-out',
            transitionDelay: `${index * staggerDelay}ms`,
          }}
        >
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
}
