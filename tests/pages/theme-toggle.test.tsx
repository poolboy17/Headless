import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeProvider } from '@/components/theme-provider';

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

describe('Theme Toggle Integration', () => {
  let originalLocalStorage: Storage;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    localStorageMock = {};
    originalLocalStorage = window.localStorage;
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => localStorageMock[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete localStorageMock[key];
        }),
        clear: vi.fn(() => {
          localStorageMock = {};
        }),
      },
      writable: true,
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    document.documentElement.classList.remove('dark', 'light');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark', 'light');
  });

  describe('Theme toggle button rendering', () => {
    it('renders theme toggle button with correct test id', () => {
      render(
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ThemeToggle />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('button-theme-toggle')).toBeInTheDocument();
    });

    it('has accessible name via sr-only text', () => {
      render(
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ThemeToggle />
        </ThemeProvider>
      );
      
      expect(screen.getByText('Toggle theme')).toBeInTheDocument();
      expect(screen.getByText('Toggle theme')).toHaveClass('sr-only');
    });

    it('contains sun and moon icons for theme indication', () => {
      render(
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ThemeToggle />
        </ThemeProvider>
      );
      
      const button = screen.getByTestId('button-theme-toggle');
      const svgs = button.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Theme switching behavior', () => {
    it('clicking toggle changes theme from light to dark', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ThemeToggle />
        </ThemeProvider>
      );
      
      const button = screen.getByTestId('button-theme-toggle');
      await user.click(button);
      
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('clicking toggle twice returns to original theme', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ThemeToggle />
        </ThemeProvider>
      );
      
      const button = screen.getByTestId('button-theme-toggle');
      
      await user.click(button);
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
      
      await user.click(button);
      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true);
      });
    });

    it('starts in dark mode when defaultTheme is dark', async () => {
      render(
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ThemeToggle />
        </ThemeProvider>
      );
      
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('clicking toggle in dark mode switches to light', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ThemeToggle />
        </ThemeProvider>
      );
      
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
      
      const button = screen.getByTestId('button-theme-toggle');
      await user.click(button);
      
      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true);
      });
    });
  });

  describe('System preference integration', () => {
    it('respects system dark preference when set to system', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
          <ThemeToggle />
        </ThemeProvider>
      );
      
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('respects system light preference when set to system', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
          <ThemeToggle />
        </ThemeProvider>
      );
      
      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true);
      });
    });
  });

  describe('Theme persistence via localStorage', () => {
    it('persists theme choice to localStorage when changed', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          storageKey="theme"
          enableSystem={false}
        >
          <ThemeToggle />
        </ThemeProvider>
      );
      
      const button = screen.getByTestId('button-theme-toggle');
      await user.click(button);
      
      await waitFor(() => {
        expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
      });
    });

    it('reads initial theme from localStorage if present', async () => {
      localStorageMock['theme'] = 'dark';
      
      render(
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          storageKey="theme"
          enableSystem={false}
        >
          <ThemeToggle />
        </ThemeProvider>
      );
      
      await waitFor(() => {
        expect(window.localStorage.getItem).toHaveBeenCalledWith('theme');
      });
    });
  });

  describe('Button interaction states', () => {
    it('button is clickable and focusable', () => {
      render(
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ThemeToggle />
        </ThemeProvider>
      );
      
      const button = screen.getByTestId('button-theme-toggle');
      expect(button).not.toBeDisabled();
      expect(button.tagName).toBe('BUTTON');
    });

    it('button can be focused with keyboard', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ThemeToggle />
        </ThemeProvider>
      );
      
      await user.tab();
      
      const button = screen.getByTestId('button-theme-toggle');
      expect(document.activeElement).toBe(button);
    });

    it('button can be activated with keyboard', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ThemeToggle />
        </ThemeProvider>
      );
      
      const button = screen.getByTestId('button-theme-toggle');
      button.focus();
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });
  });
});
