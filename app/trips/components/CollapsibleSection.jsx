/**
 * Collapsible Section Component
 * Reusable component for expandable/collapsible content sections
 */

"use client";

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function CollapsibleSection({
    title,
    icon,
    defaultOpen = false,
    onExpand,
    children,
    badge
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const handleToggle = () => {
        const newState = !isOpen;
        setIsOpen(newState);

        // Call onExpand callback when opening
        if (newState && onExpand) {
            onExpand();
        }
    };

    return (
        <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden mb-6">
            {/* Header */}
            <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between p-6 hover:bg-accent/50 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                            {icon}
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-foreground">
                            {title}
                        </h2>
                        {badge && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                                {badge}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isOpen && (
                        <span className="text-sm text-muted-foreground hidden sm:block">
                            Click to expand
                        </span>
                    )}
                    {isOpen ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                </div>
            </button>

            {/* Content */}
            {isOpen && (
                <div className="p-6 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                    {children}
                </div>
            )}
        </div>
    );
}
