export interface WPMedia {
  id: number;
  source_url: string;
  alt_text?: string;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<string, {
      source_url: string;
      width: number;
      height: number;
    }>;
  };
}

export interface WPCategory {
  id: number;
  count: number;
  name: string;
  slug: string;
  description?: string;
  link: string;
}

export interface WPTag {
  id: number;
  count: number;
  name: string;
  slug: string;
  link: string;
}

export interface WPAuthor {
  id: number;
  name: string;
  slug: string;
  description?: string;
  avatar_urls?: Record<string, string>;
  link: string;
}

export interface WPPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string; protected?: boolean };
  excerpt: { rendered: string; protected?: boolean };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    author?: WPAuthor[];
    'wp:featuredmedia'?: WPMedia[];
    'wp:term'?: (WPCategory | WPTag)[][];
  };
}
