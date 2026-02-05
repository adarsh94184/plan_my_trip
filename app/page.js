import Image from "next/image";
import SearchForm from "./components/SearchForm";
import { ArrowRight, Map, Clock, Wallet } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background Image / Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"
            alt="Travel Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-1000">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
              Journey Smarter with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">TripWise.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10">
               Discover the best routes, compare travel modes by time & cost, and get personalized daily itineraries in seconds.
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200 flex justify-center">
             <SearchForm />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight mb-4">Why use TripWise?</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">We analyze thousands of routes to give you the perfect balance of time, cost, and experience.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={<Clock className="w-8 h-8 text-blue-500" />}
                    title="Time vs. Money"
                    description="Instantly compare flight, train, and bus options to see what's worth your time and budget."
                />
                <FeatureCard 
                    icon={<Map className="w-8 h-8 text-purple-500" />}
                    title="Smart Itineraries"
                    description="Get day-by-day plans tailored to your stay duration and destination highlights."
                />
                <FeatureCard 
                    icon={<Wallet className="w-8 h-8 text-teal-500" />}
                    title="Budget Optimization"
                    description="Find the hidden gems and travel hacks that save you money without compromising comfort."
                />
            </div>
        </div>
      </section>
    </main>
  );
}

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
