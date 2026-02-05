import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted", className)}
            {...props}
        />
    )
}

function SkeletonCard({ className }) {
    return (
        <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <div className="flex justify-between pt-3 border-t border-border">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
            </div>
        </div>
    )
}

function SkeletonTrainCard() {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-5 w-16 rounded-full mb-3" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-24 mb-4" />
            <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between pt-3 border-t border-border">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
            </div>
            <div className="flex gap-1 mt-3">
                {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} className="h-5 w-5 rounded" />
                ))}
            </div>
        </div>
    )
}

function SkeletonBusCard() {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex justify-between mb-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
            <div className="flex gap-2 mb-4">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-12 rounded" />
                ))}
            </div>
            <div className="flex justify-between pt-3 border-t border-border">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20" />
            </div>
        </div>
    )
}

export { Skeleton, SkeletonCard, SkeletonTrainCard, SkeletonBusCard }
