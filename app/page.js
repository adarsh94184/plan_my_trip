"use client";

import Image from "next/image";
import SearchForm from "./components/SearchForm";
import { ArrowRight, Map, Clock, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import PopularRoutes from "./components/PopularRoutes";

// Dynamic import for Leaflet map to avoid SSR issues
import dynamic from 'next/dynamic';
const LeafletMap = dynamic(() => import('./components/LeafletMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-muted/20 animate-pulse text-white/50">Loading Live Map...</div>
});

// Rotating Background Images
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1035&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529171696861-bac785a44828?q=80&w=1171&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1473625247510-8ceb1760943f?q=80&w=1111&auto=format&fit=crop"
];

import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [mapOrigin, setMapOrigin] = useState(null);
  const [mapDestination, setMapDestination] = useState(null);
  const [bgIndex, setBgIndex] = useState(0);

  // Rotate background images
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000); // Rotate every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLocationChange = (type, data) => {
    if (type === 'origin') setMapOrigin(data);
    if (type === 'destination') setMapDestination(data);
  };

  return (
    <main className="min-h-screen flex flex-col relative bg-[#020617] text-white selection:bg-blue-500/30">

      {/* Full Screen Rotating Background */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={bgIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={BACKGROUND_IMAGES[bgIndex]}
              alt="Travel Background"
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>
        {/* Gradient Overlays for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-[#020617]/60" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col justify-center min-h-screen">

        {/* Header Text */}
        <div className="text-center mb-12 space-y-6 animate-in fade-in slide-in-from-top-10 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase mx-auto backdrop-blur-md">
            ✨ Top Rated Trip Planner
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight drop-shadow-xl">
            Journey Smarter <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">with ease.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Compare routes, costs, and time across all modes of travel. Your perfect itinerary is just one click away.
          </p>
        </div>

        {/* Two-Column Layout: Form + Map Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: Search Form (Spans 7 columns) */}
          <div className="lg:col-span-7 animate-in fade-in slide-in-from-left-10 duration-700 delay-100">
            <SearchForm onLocationChange={handleLocationChange} />
          </div>

          {/* Right: Map Widget (Spans 5 columns) */}
          <div className="lg:col-span-5 h-[500px] lg:h-auto lg:aspect-square animate-in fade-in slide-in-from-right-10 duration-700 delay-200">
            <div className="w-full h-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group hover:border-white/20 transition-all">
              {/* Header for Map Box */}
              <div className="absolute top-4 left-4 z-[500] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-white/90">Live Route Map</span>
              </div>

              <LeafletMap origin={mapOrigin} destination={mapDestination} onLocationSelect={() => { }} />
            </div>
          </div>
        </div>

        {/* Popular Routes Section (Below fold) */}
        <div className="mt-24 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-white/20" />
            <h2 className="text-xl font-semibold text-white/80 tracking-widest uppercase">Trending Destinations</h2>
            <div className="h-px w-12 bg-white/20" />
          </div>
          <PopularRoutes />
        </div>

      </div>
    </main>
  );
}

// Override PopularRoutes to render differently here if needed, or just use grid styling in CSS


function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
