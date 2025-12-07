import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState, NoPostsFound, NoSearchResults, CategoryEmpty } from '@/components/empty-state';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Empty States Integration', () => {
  describe('Base EmptyState component', () => {
    it('renders with default props', () => {
      render(<EmptyState />);
      
      expect(screen.getByText('No posts found')).toBeInTheDocument();
      expect(screen.getByText("We couldn't find any posts matching your criteria.")).toBeInTheDocument();
    });

    it('renders custom title and description', () => {
      render(
        <EmptyState 
          title="Custom Title" 
          description="Custom description text" 
        />
      );
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom description text')).toBeInTheDocument();
    });

    it('renders action button with correct href', () => {
      render(
        <EmptyState 
          actionLabel="Go somewhere" 
          actionHref="/somewhere" 
        />
      );
      
      const link = screen.getByRole('link', { name: 'Go somewhere' });
      expect(link).toHaveAttribute('href', '/somewhere');
    });

    it('renders ghost icon by default', () => {
      const { container } = render(<EmptyState />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders search icon when specified', () => {
      const { container } = render(<EmptyState icon="search" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders file icon when specified', () => {
      const { container } = render(<EmptyState icon="file" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders folder icon when specified', () => {
      const { container } = render(<EmptyState icon="folder" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders action button with default values', () => {
      render(
        <EmptyState />
      );
      
      const link = screen.getByRole('link', { name: 'Go back home' });
      expect(link).toHaveAttribute('href', '/');
    });
  });

  describe('NoPostsFound component', () => {
    it('renders correct title for no posts', () => {
      render(<NoPostsFound />);
      
      expect(screen.getByText('No articles yet')).toBeInTheDocument();
    });

    it('renders appropriate description', () => {
      render(<NoPostsFound />);
      
      expect(screen.getByText(/working on some spooky content/i)).toBeInTheDocument();
    });

    it('includes action to explore categories', () => {
      render(<NoPostsFound />);
      
      const link = screen.getByRole('link', { name: 'Explore categories' });
      expect(link).toHaveAttribute('href', '/');
    });
  });

  describe('NoSearchResults component', () => {
    it('renders without query parameter', () => {
      render(<NoSearchResults />);
      
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText(/Try searching for something else/i)).toBeInTheDocument();
    });

    it('displays search query in description when provided', () => {
      render(<NoSearchResults query="haunted mansion" />);
      
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText(/haunted mansion/i)).toBeInTheDocument();
    });

    it('includes clear search action link', () => {
      render(<NoSearchResults query="test" />);
      
      const link = screen.getByRole('link', { name: 'Clear search' });
      expect(link).toHaveAttribute('href', '/');
    });

    it('handles special characters in query', () => {
      render(<NoSearchResults query="ghost & spirits" />);
      
      expect(screen.getByText(/ghost & spirits/i)).toBeInTheDocument();
    });

    it('handles long query text gracefully', () => {
      const longQuery = 'a'.repeat(100);
      render(<NoSearchResults query={longQuery} />);
      
      expect(screen.getByText(new RegExp(longQuery))).toBeInTheDocument();
    });
  });

  describe('CategoryEmpty component', () => {
    it('renders with specific category name', () => {
      render(<CategoryEmpty categoryName="Ghost Stories" />);
      
      expect(screen.getByText('No posts in Ghost Stories')).toBeInTheDocument();
    });

    it('renders with fallback when no category name', () => {
      render(<CategoryEmpty />);
      
      expect(screen.getByText('No posts in this category')).toBeInTheDocument();
    });

    it('includes browse action link', () => {
      render(<CategoryEmpty categoryName="Investigations" />);
      
      const link = screen.getByRole('link', { name: 'Browse all posts' });
      expect(link).toHaveAttribute('href', '/');
    });

    it('renders appropriate description', () => {
      render(<CategoryEmpty categoryName="Test" />);
      
      expect(screen.getByText(/doesn't have any posts yet/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('empty state has proper heading hierarchy', () => {
      render(<EmptyState title="Test Heading" />);
      
      const heading = screen.getByRole('heading', { name: 'Test Heading' });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3');
    });

    it('action buttons are properly labeled', () => {
      render(<EmptyState actionLabel="Take action" actionHref="/action" />);
      
      const button = screen.getByRole('link', { name: 'Take action' });
      expect(button).toBeInTheDocument();
    });

    it('icons are decorative and not announced', () => {
      const { container } = render(<EmptyState />);
      
      const svg = container.querySelector('svg');
      expect(svg).not.toHaveAttribute('role', 'img');
    });
  });

  describe('Visual layout', () => {
    it('container has centered layout classes', () => {
      const { container } = render(<EmptyState />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('flex');
      expect(wrapper.className).toContain('flex-col');
      expect(wrapper.className).toContain('items-center');
      expect(wrapper.className).toContain('text-center');
    });

    it('icon container has proper styling', () => {
      const { container } = render(<EmptyState />);
      
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });
  });
});
