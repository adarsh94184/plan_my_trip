"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Coffee, Camera, Moon, MapPin } from "lucide-react";

export default function ItineraryTimeline({ days = 3, destination }) {
    const itinerary = Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        activities: [
            { time: "09:00 AM", title: "Breakfast at local cafe", icon: Coffee, type: "food" },
            { time: "11:00 AM", title: `Explore ${destination} City Center`, icon: MapPin, type: "sightseeing" },
            { time: "02:00 PM", title: "Visit famous landmarks", icon: Camera, type: "activity" },
            { time: "08:00 PM", title: "Dinner & Nightlife", icon: Moon, type: "food" },
        ],
    }));

    return (
        <section className="py-8">
            <h2 className="text-2xl font-bold mb-6">Your {days}-Day Itinerary</h2>
            <div className="space-y-8">
                {itinerary.map((day) => (
                    <div key={day.day} className="relative pl-8 border-l-2 border-primary/20">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />

                        <h3 className="text-xl font-bold mb-4 text-foreground">Day {day.day}</h3>

                        <div className="space-y-4">
                            {day.activities.map((act, idx) => {
                                const Icon = act.icon;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="p-2 rounded-lg bg-background shadow-sm text-primary">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground">{act.time}</p>
                                            <p className="font-medium text-foreground">{act.title}</p>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
