"use client";

import * as React from "react";
import { ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAutoScroll } from "@/components/hooks/use-auto-scroll";
import { cn } from "@/lib/utils";

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
    smooth?: boolean;
}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
    function ChatMessageList({ className, children, smooth = false, ...props }, ref) {
        const {
            scrollRef,
            isAtBottom,
            scrollToBottom,
            disableAutoScroll,
        } = useAutoScroll({
            smooth,
            content: children,
        });

        return (
            <div className="relative w-full h-full">
                <div
                    className={cn(
                        "flex flex-col w-full h-full p-4 overflow-y-auto",
                        // Custom scrollbar styling
                        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
                        "hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500",
                        // Hide scrollbar on mobile, show on desktop hover
                        "[&::-webkit-scrollbar]:w-1.5",
                        "[&::-webkit-scrollbar-track]:bg-transparent",
                        "[&::-webkit-scrollbar-thumb]:bg-gray-300/50",
                        "[&::-webkit-scrollbar-thumb]:rounded-full",
                        "[&::-webkit-scrollbar-thumb]:hover:bg-gray-400/70",
                        "dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/50",
                        "dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500/70",
                        className
                    )}
                    ref={scrollRef}
                    onWheel={disableAutoScroll}
                    onTouchMove={disableAutoScroll}
                    {...props}
                >
                    <div className="flex flex-col gap-4">{children}</div>
                </div>

                {/* Scroll to bottom button */}
                <AnimatePresence>
                    {!isAtBottom && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-2 left-1/2 -translate-x-1/2"
                        >
                            <Button
                                onClick={scrollToBottom}
                                size="icon"
                                className="h-8 w-8 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                aria-label="Scroll to bottom"
                            >
                                <ArrowDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }
);

ChatMessageList.displayName = "ChatMessageList";

export { ChatMessageList };
