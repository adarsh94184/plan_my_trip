"use client";

import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const SUGGESTED_ROUTES = [
    {
        id: "una-dharamshala",
        origin: { name: "Una, Himachal Pradesh", lat: 31.4685, lon: 76.2708 },
        destination: { name: "Dharamshala, Himachal Pradesh", lat: 32.2190, lon: 76.3234 },
        image: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Dharamshala_03_%28Cropped%29.jpg",
        title: "Una to Dharamshala",
        description: "Scenic mountain drive in the Himalayas"
    },
    {
        id: "delhi-nainital",
        origin: { name: "New Delhi, Delhi", lat: 28.6139, lon: 77.2090 },
        destination: { name: "Nainital, Uttarakhand", lat: 29.3919, lon: 79.4542 },
        image: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Nainital_metro.jpg",
        title: "Delhi to Nainital",
        description: "Lake city weekend getaway"
    },
    {
        id: "mumbai-goa",
        origin: { name: "Mumbai, Maharashtra", lat: 19.0760, lon: 72.8777 },
        destination: { name: "Goa", lat: 15.2993, lon: 74.1240 },
        image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800&auto=format&fit=crop",
        title: "Mumbai to Goa",
        description: "Coastal highway adventure"
    },
    {
        id: "bangalore-ooty",
        origin: { name: "Bengaluru, Karnataka", lat: 12.9716, lon: 77.5946 },
        destination: { name: "Ooty, Tamil Nadu", lat: 11.4100, lon: 76.6950 },
        image: "https://hblimg.mmtcdn.com/content/hubble/img/destimg/mmt/destination/m_Ooty_main_tv_destination_img_1_l_764_1269.jpg",
        title: "Bangalore to Ooty",
        description: "Nilgiri hills retreat"
    }
];

export default function PopularRoutes() {
    const router = useRouter();

    const handleRouteSelect = (route) => {
        // Create trip data
        const tripData = {
            origin: route.origin,
            destination: route.destination,
            startDate: new Date().toISOString().split('T')[0], // Today
            endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days later
            timestamp: Date.now()
        };

        // Save to session storage
        sessionStorage.setItem('tripSearch', JSON.stringify(tripData));

        // Navigate
        router.push('/trips');
    };

    return (
        <section className="py-12 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-8 text-center flex items-center justify-center gap-2">
                <MapPin className="text-blue-500" />
                Popular Routes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SUGGESTED_ROUTES.map((route, index) => (
                    <motion.div
                        key={route.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -5 }}
                        onClick={() => handleRouteSelect(route)}
                        className="group cursor-pointer bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                        <div className="relative h-40 overflow-hidden">
                            <img
                                src={route.image}
                                alt={route.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>

                        <div className="p-4">
                            <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors flex items-center gap-2">
                                {route.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">{route.description}</p>

                            <div className="mt-4 flex items-center text-xs font-medium text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                                Plan this trip <ArrowRight className="w-3 h-3 ml-1" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
