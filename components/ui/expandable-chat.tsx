"use client";

import React, { useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ChatPosition = "bottom-right" | "bottom-left";
export type ChatSize = "sm" | "md" | "lg" | "xl" | "full";

const chatConfig = {
    dimensions: {
        sm: "w-80 h-[450px]",
        md: "w-96 h-[500px]",
        lg: "w-[400px] h-[520px]",
        xl: "w-[480px] h-[600px]",
        full: "w-full h-full",
    },
    positions: {
        "bottom-right": "bottom-24 right-5",
        "bottom-left": "bottom-24 left-5",
    },
    buttonPositions: {
        "bottom-right": "bottom-5 right-5",
        "bottom-left": "bottom-5 left-5",
    },
};

interface ExpandableChatProps {
    position?: ChatPosition;
    size?: ChatSize;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

const ExpandableChat: React.FC<ExpandableChatProps> = ({
    className,
    position = "bottom-right",
    size = "md",
    icon,
    children,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleChat = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                        }}
                        className={cn(
                            "fixed z-[100] flex flex-col overflow-hidden",
                            // Glass morphism effect
                            "bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950",
                            "border border-gray-200/80 dark:border-gray-700/80",
                            "rounded-3xl",
                            "shadow-2xl shadow-black/10 dark:shadow-black/30",
                            // Backdrop blur for glass effect
                            "backdrop-blur-xl",
                            chatConfig.positions[position],
                            chatConfig.dimensions[size],
                            className
                        )}
                    >
                        {children}
                        {/* Mobile close button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-3 right-3 h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 md:hidden z-10 rounded-full"
                            onClick={toggleChat}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <div className={cn("fixed z-[100]", chatConfig.buttonPositions[position])}>
                <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                    <Button
                        onClick={toggleChat}
                        className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
                            "shadow-xl",
                            isOpen
                                ? "bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 shadow-gray-500/20"
                                : "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 shadow-blue-500/40"
                        )}
                    >
                        <AnimatePresence mode="wait">
                            {isOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <X className="h-6 w-6 text-white" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="open"
                                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    {icon || <MessageCircle className="h-6 w-6 text-white" />}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>
                </motion.div>

                {/* Pulse animation when closed */}
                {!isOpen && (
                    <>
                        <motion.div
                            className="absolute inset-0 rounded-full bg-blue-500/40 pointer-events-none"
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                repeatType: "loop",
                                ease: "easeOut"
                            }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-full bg-blue-500/30 pointer-events-none"
                            initial={{ scale: 1, opacity: 0.4 }}
                            animate={{ scale: 2.2, opacity: 0 }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                repeatType: "loop",
                                ease: "easeOut",
                                delay: 0.3
                            }}
                        />
                    </>
                )}
            </div>
        </>
    );
};

ExpandableChat.displayName = "ExpandableChat";

interface ChatPartProps {
    className?: string;
    children?: React.ReactNode;
}

const ExpandableChatHeader: React.FC<ChatPartProps> = ({
    className,
    children,
}) => (
    <div
        className={cn(
            "flex items-center justify-between px-5 py-4",
            "border-b border-white/10",
            className
        )}
    >
        {children}
    </div>
);

ExpandableChatHeader.displayName = "ExpandableChatHeader";

const ExpandableChatBody: React.FC<ChatPartProps> = ({
    className,
    children,
}) => (
    <div
        className={cn(
            "flex-1 overflow-hidden",
            "bg-gradient-to-b from-gray-50/50 to-gray-100/50 dark:from-gray-800/30 dark:to-gray-900/50",
            className
        )}
    >
        {children}
    </div>
);

ExpandableChatBody.displayName = "ExpandableChatBody";

const ExpandableChatFooter: React.FC<ChatPartProps> = ({
    className,
    children,
}) => (
    <div
        className={cn(
            "border-t border-gray-200/50 dark:border-gray-700/50",
            "p-4",
            "bg-white/80 dark:bg-gray-900/80",
            "backdrop-blur-sm",
            className
        )}
    >
        {children}
    </div>
);

ExpandableChatFooter.displayName = "ExpandableChatFooter";

export {
    ExpandableChat,
    ExpandableChatHeader,
    ExpandableChatBody,
    ExpandableChatFooter,
};
