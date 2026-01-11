"use client"
import React from "react";
import { motion, MotionProps } from "motion/react";

import { cn } from "@/lib/utils";

interface GradientTextProps
    extends Omit<React.HTMLAttributes<HTMLSpanElement>, keyof MotionProps> {
    className?: string;
    children: React.ReactNode;
}

function GradientText({
    className,
    children,
    ...props
}: GradientTextProps) {
    return (
        <motion.span
            className={cn(
                "relative inline-block bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]",
                className,
            )}
            {...props}
        >
            {children}
        </motion.span>
    );
}

export { GradientText }
