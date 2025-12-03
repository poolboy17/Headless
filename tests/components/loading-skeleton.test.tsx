import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  PostCardSkeleton,
  PostCardSkeletonGrid,
  HeroSkeleton,
  ArticleSkeleton,
} from '@/components/loading-skeleton';

describe('Loading Skeleton Components', () => {
  describe('PostCardSkeleton', () => {
    it('renders without error', () => {
      const { container } = render(<PostCardSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has rounded-3xl corner styling', () => {
      const { container } = render(<PostCardSkeleton />);
      expect(container.firstChild).toHaveClass('rounded-3xl');
    });

    it('has dark mode classes', () => {
      const { container } = render(<PostCardSkeleton />);
      expect(container.firstChild).toHaveClass('dark:bg-neutral-900');
    });

    it('contains multiple skeleton elements', () => {
      const { container } = render(<PostCardSkeleton />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('has image skeleton at top', () => {
      const { container } = render(<PostCardSkeleton />);
      const imageSkeleton = container.querySelector('.aspect-\\[16\\/9\\]');
      expect(imageSkeleton).toBeInTheDocument();
    });
  });

  describe('PostCardSkeletonGrid', () => {
    it('renders default 6 skeletons', () => {
      const { container } = render(<PostCardSkeletonGrid />);
      const cards = container.querySelectorAll('.rounded-3xl');
      expect(cards.length).toBe(6);
    });

    it('renders custom count of skeletons', () => {
      const { container } = render(<PostCardSkeletonGrid count={3} />);
      const cards = container.querySelectorAll('.rounded-3xl');
      expect(cards.length).toBe(3);
    });

    it('has grid layout classes', () => {
      const { container } = render(<PostCardSkeletonGrid />);
      expect(container.firstChild).toHaveClass('grid');
      expect(container.firstChild).toHaveClass('grid-cols-1');
      expect(container.firstChild).toHaveClass('md:grid-cols-2');
      expect(container.firstChild).toHaveClass('lg:grid-cols-3');
    });

    it('renders 1 skeleton when count is 1', () => {
      const { container } = render(<PostCardSkeletonGrid count={1} />);
      const cards = container.querySelectorAll('.rounded-3xl');
      expect(cards.length).toBe(1);
    });

    it('renders 12 skeletons when count is 12', () => {
      const { container } = render(<PostCardSkeletonGrid count={12} />);
      const cards = container.querySelectorAll('.rounded-3xl');
      expect(cards.length).toBe(12);
    });
  });

  describe('HeroSkeleton', () => {
    it('renders without error', () => {
      const { container } = render(<HeroSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders as section element', () => {
      const { container } = render(<HeroSkeleton />);
      expect(container.firstChild?.nodeName).toBe('SECTION');
    });

    it('has glassmorphism backdrop effect', () => {
      const { container } = render(<HeroSkeleton />);
      const glassCard = container.querySelector('.backdrop-blur-xl');
      expect(glassCard).toBeInTheDocument();
    });

    it('has container mx-auto for centering', () => {
      const { container } = render(<HeroSkeleton />);
      expect(container.firstChild).toHaveClass('container');
      expect(container.firstChild).toHaveClass('mx-auto');
    });

    it('contains avatar skeleton circle', () => {
      const { container } = render(<HeroSkeleton />);
      const avatarSkeleton = container.querySelector('.h-10.w-10.rounded-full');
      expect(avatarSkeleton).toBeInTheDocument();
    });

    it('contains hero image skeleton', () => {
      const { container } = render(<HeroSkeleton />);
      const heroImage = container.querySelector('.aspect-\\[16\\/12\\]');
      expect(heroImage).toBeInTheDocument();
    });
  });

  describe('ArticleSkeleton', () => {
    it('renders without error', () => {
      const { container } = render(<ArticleSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has max-w-4xl for article width', () => {
      const { container } = render(<ArticleSkeleton />);
      expect(container.firstChild).toHaveClass('max-w-4xl');
    });

    it('has container with centered layout', () => {
      const { container } = render(<ArticleSkeleton />);
      expect(container.firstChild).toHaveClass('container');
      expect(container.firstChild).toHaveClass('mx-auto');
    });

    it('contains breadcrumb skeleton', () => {
      const { container } = render(<ArticleSkeleton />);
      const breadcrumb = container.querySelector('.w-32.mb-8');
      expect(breadcrumb).toBeInTheDocument();
    });

    it('contains title skeleton lines', () => {
      const { container } = render(<ArticleSkeleton />);
      const titleLines = container.querySelectorAll('.h-12');
      expect(titleLines.length).toBeGreaterThanOrEqual(2);
    });

    it('contains author avatar skeleton', () => {
      const { container } = render(<ArticleSkeleton />);
      const authorAvatar = container.querySelector('.h-12.w-12.rounded-full');
      expect(authorAvatar).toBeInTheDocument();
    });

    it('contains featured image skeleton', () => {
      const { container } = render(<ArticleSkeleton />);
      const featuredImage = container.querySelector('.aspect-\\[16\\/9\\]');
      expect(featuredImage).toBeInTheDocument();
    });

    it('contains article content skeleton lines', () => {
      const { container } = render(<ArticleSkeleton />);
      const contentLines = container.querySelectorAll('.space-y-4 .h-4');
      expect(contentLines.length).toBeGreaterThanOrEqual(3);
    });
  });
});
