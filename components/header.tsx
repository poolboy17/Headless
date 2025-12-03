'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { WPCategory } from '@/lib/wordpress';

interface HeaderProps {
  categories: WPCategory[];
}

export function Header({ categories }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/70 dark:border-transparent bg-white dark:bg-neutral-900">
      <div className="px-4 xl:container">
        <div className="flex h-16 sm:h-20 justify-between">
          <div className="flex flex-1 items-center lg:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <nav className="flex flex-col p-6">
                  <Link 
                    href="/" 
                    className="mb-8"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="block text-2xl font-bold text-primary tracking-tight">CURSED TOURS</span>
                    <span className="block text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">Some boundaries aren&apos;t meant to be crossed</span>
                  </Link>
                  
                  <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant={isActive('/') ? 'secondary' : 'ghost'}
                      className="w-full justify-start text-base mb-1"
                      data-testid="mobile-nav-home"
                    >
                      Home
                    </Button>
                  </Link>
                  
                  <div className="my-4 border-t border-border" />
                  <p className="px-4 py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Categories
                  </p>
                  
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant={isActive(`/category/${category.slug}`) ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-base"
                        data-testid={`mobile-nav-category-${category.slug}`}
                      >
                        {category.name}
                        <span className="ml-auto text-sm text-muted-foreground">
                          {category.count}
                        </span>
                      </Button>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden items-center gap-x-3 sm:gap-x-8 lg:flex">
            <Link href="/" className="flex flex-col shrink-0" data-testid="link-home">
              <span className="font-bold text-xl text-primary tracking-tight">CURSED TOURS</span>
              <span className="text-[9px] text-muted-foreground tracking-widest uppercase -mt-0.5">Some boundaries aren&apos;t meant to be crossed</span>
            </Link>

            <div className="hidden h-8 border-s border-neutral-200 dark:border-neutral-700 md:block" />

            <form onSubmit={handleSearch} className="hidden w-64 max-w-xs sm:block xl:w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-full h-10"
                  data-testid="input-search"
                />
              </div>
            </form>
          </div>

          <Link 
            href="/" 
            className="flex flex-col items-center justify-center lg:hidden" 
            data-testid="link-home-mobile"
          >
            <span className="font-bold text-lg text-primary tracking-tight">CURSED TOURS</span>
            <span className="text-[8px] text-muted-foreground tracking-widest uppercase -mt-0.5">Some boundaries aren&apos;t meant to be crossed</span>
          </Link>

          <div className="flex flex-1 justify-end items-center gap-1">
            <nav className="hidden lg:flex items-center">
              <Link href="/">
                <Button
                  variant={isActive('/') ? 'secondary' : 'ghost'}
                  className="text-sm"
                  data-testid="nav-home"
                >
                  Home
                </Button>
              </Link>
              {categories.slice(0, 4).map((category) => (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <Button
                    variant={isActive(`/category/${category.slug}`) ? 'secondary' : 'ghost'}
                    className="text-sm"
                    data-testid={`nav-category-${category.slug}`}
                  >
                    {category.name}
                  </Button>
                </Link>
              ))}
            </nav>

            <div className="mx-2 hidden h-8 self-center border-l border-neutral-200 dark:border-neutral-700 md:block" />

            <ThemeToggle />

            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden"
              onClick={() => {
                const query = prompt('Search articles...');
                if (query) {
                  router.push(`/search?q=${encodeURIComponent(query)}`);
                }
              }}
              data-testid="button-search-mobile"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
