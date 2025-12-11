import Link from 'next/link';

export function StaticHero() {
  return (
    <section className="relative">
      {/* Static background image with explicit fetchpriority for LCP */}
      <div className="relative h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden">
        <img
          src="/assets/fallbacks/gothic_castle_midnight_storm.png"
          alt="Gothic castle under midnight storm"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight drop-shadow-2xl [text-shadow:_0_4px_20px_rgb(0_0_0_/_80%)]">
            CURSED TOURS
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-2xl drop-shadow-lg [text-shadow:_0_2px_10px_rgb(0_0_0_/_60%)]">
            Some boundaries aren&apos;t meant to be crossed
          </p>
          <Link 
            href="#explore" 
            className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-full text-white font-medium backdrop-blur-sm transition-all duration-300 hover:scale-105"
          >
            Explore Haunted Destinations
          </Link>
        </div>
      </div>
    </section>
  );
}
