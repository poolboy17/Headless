import { cn } from "@/lib/utils";

interface ServerAvatarProps {
  src?: string;
  alt: string;
  fallback: string;
  className?: string;
}

/**
 * Server-compatible avatar component.
 * Shows image if available, otherwise shows fallback text.
 */
export function ServerAvatar({ src, alt, fallback, className }: ServerAvatarProps) {
  return (
    <div className={cn(
      "relative flex shrink-0 overflow-hidden rounded-full",
      "after:content-[''] after:block after:absolute after:inset-0 after:rounded-full after:pointer-events-none after:border after:border-black/10 dark:after:border-white/10",
      className
    )}>
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          className="aspect-square h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-[10px]">
          {fallback}
        </div>
      )}
    </div>
  );
}
