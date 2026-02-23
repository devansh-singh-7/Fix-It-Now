"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageLoading } from "@/components/ui/message-loading";

interface ChatBubbleProps {
    variant?: "sent" | "received"
    layout?: "default" | "ai"
    className?: string
    children: React.ReactNode
}

export function ChatBubble({
    variant = "received",
    className,
    children,
}: ChatBubbleProps) {
    return (
        <div
            className={cn(
                "flex items-end gap-2",
                variant === "sent" ? "flex-row-reverse" : "flex-row",
                className,
            )}
        >
            {children}
        </div>
    )
}

interface ChatBubbleMessageProps {
    variant?: "sent" | "received"
    isLoading?: boolean
    className?: string
    children?: React.ReactNode
}

export function ChatBubbleMessage({
    variant = "received",
    isLoading,
    className,
    children,
}: ChatBubbleMessageProps) {
    return (
        <div
            className={cn(
                "max-w-[80%] px-4 py-3 text-sm leading-relaxed",
                variant === "sent"
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-md shadow-lg shadow-blue-500/20"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-md shadow-md border border-gray-100 dark:border-gray-700",
                className
            )}
        >
            {isLoading ? (
                <div className="flex items-center justify-center py-1">
                    <MessageLoading />
                </div>
            ) : (
                children
            )}
        </div>
    )
}

interface ChatBubbleAvatarProps {
    src?: string
    fallback?: string
    className?: string
}

export function ChatBubbleAvatar({
    src,
    fallback = "AI",
    className,
}: ChatBubbleAvatarProps) {
    const isEmoji = fallback && /\p{Emoji}/u.test(fallback)

    return (
        <Avatar className={cn(
            "h-9 w-9 ring-2 ring-white dark:ring-gray-800 shadow-md",
            className
        )}>
            {src && <AvatarImage src={src} />}
            <AvatarFallback className={cn(
                "text-xs font-semibold",
                isEmoji
                    ? "bg-gradient-to-br from-purple-500 to-pink-500 text-lg"
                    : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
            )}>
                {fallback}
            </AvatarFallback>
        </Avatar>
    )
}
