"use client"

import { useState, useEffect, useRef, FormEvent } from "react"
import { Bot, Paperclip, Mic, MicOff, CornerDownLeft, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
    ChatBubble,
    ChatBubbleAvatar,
    ChatBubbleMessage,
} from "@/components/ui/chat-bubble"
import { ChatInput } from "@/components/ui/chat-input"
import {
    ExpandableChat,
    ExpandableChatHeader,
    ExpandableChatBody,
    ExpandableChatFooter,
} from "@/components/ui/expandable-chat"
import { ChatMessageList } from "@/components/ui/chat-message-list"

interface Message {
    id: number
    content: string
    sender: "ai" | "user"
}

// Comprehensive knowledge base for FixItNow
const knowledgeBase = {
    // Ticket Management
    tickets: {
        create: "To create a new ticket:\n1. Go to your Dashboard\n2. Click 'New Ticket' button\n3. Fill in the title and description\n4. Select category (Plumbing, Electrical, HVAC, Cleaning, Other)\n5. Set priority (Low, Medium, High, Urgent)\n6. Add your location/unit number\n7. Optionally add photos\n8. Submit!\n\nYour building admin will be notified automatically.",
        categories: "FixItNow supports these ticket categories:\n• 🔧 Plumbing - Leaks, clogs, water issues\n• ⚡ Electrical - Power, lighting, outlets\n• ❄️ HVAC - Heating, cooling, ventilation\n• 🧹 Cleaning - General cleaning requests\n• 📦 Other - Everything else",
        priority: "Ticket priority levels:\n• 🟢 Low - Non-urgent, can wait a few days\n• 🟡 Medium - Should be addressed within 24-48 hours\n• 🟠 High - Needs attention today\n• 🔴 Urgent - Emergency, needs immediate action\n\nTechnicians see urgent tickets first!",
        status: "Ticket status flow:\n1. Open - Just created\n2. Assigned - Admin assigned to technician\n3. Accepted - Technician accepted the job\n4. In Progress - Work is being done\n5. Completed - Issue resolved\n\nYou'll get notified at each status change!",
        view: "To view your tickets:\n1. Go to Dashboard\n2. See all your tickets in the list\n3. Use filters to show Open, In Progress, or Resolved\n4. Click any ticket to see details and timeline\n\nAdmins can see all building tickets, residents see only their own.",
        images: "You can attach up to 5 images per ticket! This helps technicians understand the issue before arriving. Just click the camera icon when creating a ticket.",
        comments: "You can add comments to any ticket! Use the comment section to:\n• Ask questions\n• Provide updates\n• Share additional info\n• Communicate with technicians",
    },

    // User Roles
    roles: {
        admin: "Building Admin powers:\n• View all tickets in your building\n• Assign technicians to tickets\n• Manage building settings\n• Create announcements\n• View analytics & reports\n• Add/remove technicians\n• Generate building join codes",
        technician: "Technician features:\n• See tickets assigned to you\n• Accept or decline jobs\n• Update ticket status\n• Add comments & progress updates\n• Mark tickets as completed\n• View your performance stats",
        resident: "Resident features:\n• Create maintenance tickets\n• Track your ticket status\n• Add comments to your tickets\n• View building announcements\n• Update your profile",
        change: "To change your role, please contact your building administrator. They can update your role in the building settings.",
    },

    // Buildings
    buildings: {
        join: "To join a building:\n1. Get the join code from your building admin\n2. Code format: ABC-123-XYZ\n3. Go to Profile > Settings\n4. Enter the join code\n5. You're in!\n\nOr enter the code during signup.",
        create: "Admins can create a building:\n1. Go to Buildings section\n2. Click 'Create New Building'\n3. Enter building name and address\n4. A unique join code is auto-generated\n5. Share the code with residents!",
        code: "The building join code is in format ABC-123-XYZ. Find it in:\n• Buildings page (if you're admin)\n• Ask your building administrator\n\nEach building has a unique code!",
        manage: "Building management (Admin only):\n• Edit building name/address\n• View all residents\n• Manage technicians\n• Create announcements\n• View building statistics",
    },

    // Subscription & Pricing
    subscription: {
        plans: "FixItNow Subscription Plans:\n\n🥉 Basic (Tier 3) - $29/month\n• 1 building\n• Up to 50 tickets/month\n• Email support\n\n🥈 Pro (Tier 2) - $79/month\n• Up to 5 buildings\n• Unlimited tickets\n• AI Chatbot support\n• Analytics dashboard\n• Priority support\n\n🥇 Enterprise (Tier 1) - $199/month\n• Unlimited buildings\n• All Pro features\n• Dedicated account manager\n• Custom integrations\n• SLA guarantee",
        upgrade: "To upgrade your plan:\n1. Go to the Pricing page\n2. Select your desired plan\n3. Choose monthly or yearly billing\n4. Complete the payment\n\nYearly plans save up to 17%!",
        chatbot: "The AI Chatbot is available for Pro and Enterprise subscribers!\n\nIf you're on Basic plan, upgrade to Pro to get 24/7 AI support.",
        billing: "Billing options:\n• Monthly: Pay each month\n• Yearly: Save ~17% with annual billing\n\nView your subscription in Profile page.",
    },

    // Announcements
    announcements: {
        view: "Announcements appear on your dashboard:\n• 🔔 System announcements - From FixItNow team\n• 🏢 Building announcements - From your building admin\n\nDifferent colors indicate priority:\n• Blue = Info\n• Yellow = Warning\n• Red = Urgent",
        create: "Admins can create announcements:\n1. Go to Dashboard\n2. Click 'Create Announcement'\n3. Select type (System/Building)\n4. Set priority level\n5. Add title and message\n6. Set expiration date (optional)\n7. Publish!",
        types: "Announcement types:\n• System - Visible to all users (Platform-wide)\n• Building - Only visible to your building members",
    },

    // Technicians
    technicians: {
        assign: "To assign a technician (Admin only):\n1. Open the ticket details\n2. Click 'Assign Technician'\n3. Select from available technicians\n4. They'll be notified automatically!",
        manage: "Managing technicians (Admin):\n1. Go to Technicians page\n2. View all technicians in your building\n3. See their stats (completed tickets, rating)\n4. Add or remove technicians",
        become: "To become a technician:\n1. Sign up with role 'Technician'\n2. Enter your building's join code\n3. Wait for admin approval\n4. Once approved, you can accept jobs!",
    },

    // Account & Profile
    account: {
        profile: "Your profile shows:\n• Name and email\n• Role (Admin/Technician/Resident)\n• Building affiliation\n• Subscription plan & tier\n• AI support access status",
        settings: "In Settings you can:\n• Update display name\n• Change password\n• Join a new building\n• View notification preferences",
        password: "To change your password:\n1. Go to Settings\n2. Click 'Change Password'\n3. Enter current password\n4. Enter new password twice\n5. Save changes",
        logout: "To log out:\n1. Click your profile icon in the navbar\n2. Select 'Sign Out'\n\nYou'll be redirected to the login page.",
    },

    // Analytics & Reports
    analytics: {
        view: "Analytics Dashboard (Pro/Enterprise):\n• Ticket resolution times\n• Tickets by category\n• Monthly trends\n• Technician performance\n• Building statistics",
        reports: "Available reports:\n• Open vs Resolved tickets\n• Average response time\n• Tickets by priority\n• Technician workload\n• Monthly/Weekly summaries",
    },

    // General Help
    general: {
        contact: "Need more help?\n• Email: support@fixitnow.com\n• Pro/Enterprise: Use this AI chatbot!\n• Check our Help page for FAQs\n• Building issues? Contact your admin",
        about: "FixItNow is a Smart Maintenance Request System that connects residents with building management and technicians. Features include:\n• Easy ticket creation\n• Real-time status tracking\n• AI-powered categorization\n• Mobile-friendly design\n• Analytics & insights",
        mobile: "FixItNow works great on mobile!\n• Responsive design\n• Take photos directly\n• Get notifications\n• Manage tickets on-the-go",
    },
}

// Smart response matching
function getAIResponse(userMessage: string): string {
    const msg = userMessage.toLowerCase().trim()

    // Greetings
    if (/^(hi|hello|hey|howdy|hola|greetings)/i.test(msg)) {
        return "Hello! 👋 I'm your FixItNow AI assistant. How can I help you today?\n\nI can help with:\n• Creating & managing tickets\n• Building management\n• Subscription questions\n• Technician info\n• And much more!\n\nJust ask away!"
    }

    // Thanks
    if (/^(thanks|thank you|thx|ty|appreciated)/i.test(msg)) {
        return "You're welcome! 😊 Is there anything else I can help you with?"
    }

    // Goodbye
    if (/^(bye|goodbye|see you|cya|later)/i.test(msg)) {
        return "Goodbye! 👋 Have a great day! If you need help later, I'll be right here."
    }

    // TICKETS
    if (/(create|new|submit|make|file|report).*(ticket|issue|request|problem|complaint)/i.test(msg)) {
        return knowledgeBase.tickets.create
    }
    if (/(ticket|issue).*(category|categories|type|types)/i.test(msg) || /what.*(category|categories)/i.test(msg)) {
        return knowledgeBase.tickets.categories
    }
    if (/(ticket|issue).*(priority|priorities|urgent)/i.test(msg) || /what.*(priority|priorit)/i.test(msg)) {
        return knowledgeBase.tickets.priority
    }
    if (/(ticket|issue).*(status|state|progress|stage)/i.test(msg) || /track.*(ticket|issue)/i.test(msg)) {
        return knowledgeBase.tickets.status
    }
    if (/(view|see|find|check|list|where).*(ticket|issue)/i.test(msg) || /my tickets/i.test(msg)) {
        return knowledgeBase.tickets.view
    }
    if (/(image|photo|picture|attach|upload)/i.test(msg)) {
        return knowledgeBase.tickets.images
    }
    if (/(comment|message|reply|communicate)/i.test(msg)) {
        return knowledgeBase.tickets.comments
    }
    if (/ticket|issue|request|maintenance/i.test(msg)) {
        return "I can help with tickets! Try asking about:\n• How to create a ticket\n• Ticket categories\n• Ticket priority levels\n• Ticket status tracking\n• Viewing your tickets"
    }

    // ROLES
    if (/(admin|administrator).*(do|can|power|feature|role)/i.test(msg) || /what.*(admin|administrator)/i.test(msg)) {
        return knowledgeBase.roles.admin
    }
    if (/(technician).*(do|can|power|feature|role)/i.test(msg) || /what.*(technician)/i.test(msg)) {
        return knowledgeBase.roles.technician
    }
    if (/(resident|user).*(do|can|power|feature|role)/i.test(msg) || /what.*(resident)/i.test(msg)) {
        return knowledgeBase.roles.resident
    }
    if (/(change|switch|update).*(role)/i.test(msg)) {
        return knowledgeBase.roles.change
    }
    if (/role|permission/i.test(msg)) {
        return "There are 3 roles in FixItNow:\n• 👑 Admin - Building managers\n• 🔧 Technician - Maintenance workers\n• 🏠 Resident - Building occupants\n\nAsk me about any specific role for details!"
    }

    // BUILDINGS
    if (/(join|enter|connect).*(building|property)/i.test(msg) || /join code/i.test(msg)) {
        return knowledgeBase.buildings.join
    }
    if (/(create|new|add|setup).*(building)/i.test(msg)) {
        return knowledgeBase.buildings.create
    }
    if (/(building|join).*(code)/i.test(msg) || /where.*(code)/i.test(msg)) {
        return knowledgeBase.buildings.code
    }
    if (/(manage|edit|update).*(building)/i.test(msg)) {
        return knowledgeBase.buildings.manage
    }
    if (/building/i.test(msg)) {
        return "I can help with buildings! Ask about:\n• Joining a building\n• Creating a building (Admin)\n• Building join codes\n• Managing building settings"
    }

    // SUBSCRIPTION & PRICING
    if (/(plan|pricing|price|cost|subscription).*(what|which|show|list)/i.test(msg) || /plans/i.test(msg) || /pricing/i.test(msg)) {
        return knowledgeBase.subscription.plans
    }
    if (/(upgrade|change).*(plan|subscription)/i.test(msg)) {
        return knowledgeBase.subscription.upgrade
    }
    if (/(chatbot|ai|assistant).*(access|available|get)/i.test(msg)) {
        return knowledgeBase.subscription.chatbot
    }
    if (/(billing|payment|pay)/i.test(msg)) {
        return knowledgeBase.subscription.billing
    }
    if (/subscription|tier/i.test(msg)) {
        return knowledgeBase.subscription.plans
    }

    // ANNOUNCEMENTS
    if (/(view|see|find|where).*(announcement)/i.test(msg) || /announcement/i.test(msg)) {
        return knowledgeBase.announcements.view
    }
    if (/(create|make|post|new).*(announcement)/i.test(msg)) {
        return knowledgeBase.announcements.create
    }

    // TECHNICIANS
    if (/(assign|add).*(technician)/i.test(msg)) {
        return knowledgeBase.technicians.assign
    }
    if (/(manage|view|list).*(technician)/i.test(msg)) {
        return knowledgeBase.technicians.manage
    }
    if (/(become|apply|register).*(technician)/i.test(msg)) {
        return knowledgeBase.technicians.become
    }
    if (/technician/i.test(msg)) {
        return "I can help with technicians! Ask about:\n• Assigning technicians to tickets\n• Managing technicians (Admin)\n• How to become a technician"
    }

    // ACCOUNT & PROFILE
    if (/(profile|my account)/i.test(msg)) {
        return knowledgeBase.account.profile
    }
    if (/setting/i.test(msg)) {
        return knowledgeBase.account.settings
    }
    if (/(password|change password|reset password)/i.test(msg)) {
        return knowledgeBase.account.password
    }
    if (/(logout|log out|sign out)/i.test(msg)) {
        return knowledgeBase.account.logout
    }

    // ANALYTICS
    if (/(analytics|statistics|stats|data)/i.test(msg)) {
        return knowledgeBase.analytics.view
    }
    if (/(report|reports)/i.test(msg)) {
        return knowledgeBase.analytics.reports
    }

    // GENERAL
    if (/(contact|email|phone|support|help me)/i.test(msg)) {
        return knowledgeBase.general.contact
    }
    if (/(what is|about|explain).*(fixitnow|this app|this system)/i.test(msg)) {
        return knowledgeBase.general.about
    }
    if (/(mobile|phone|app)/i.test(msg)) {
        return knowledgeBase.general.mobile
    }

    // HELP
    if (/^help$|^help me$|what can you do|how can you help/i.test(msg)) {
        return "I'm your FixItNow AI assistant! I can help with:\n\n🎫 **Tickets**\n• Creating tickets\n• Categories & priorities\n• Status tracking\n\n🏢 **Buildings**\n• Joining buildings\n• Building codes\n\n👤 **Accounts**\n• Roles & permissions\n• Profile settings\n\n💳 **Subscriptions**\n• Plans & pricing\n• Upgrades\n\n📊 **Analytics** (Pro/Enterprise)\n• Reports & stats\n\nJust ask me anything!"
    }

    // Default fallback
    return "I'm not sure about that specific question, but I'm here to help! Try asking about:\n\n• Creating or managing tickets\n• Building management & join codes\n• User roles (Admin, Technician, Resident)\n• Subscription plans & pricing\n• Profile & settings\n\nOr type 'help' for a full list of topics!"
}

export function SupportChatBot() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            content: "Hello! 👋 I'm your FixItNow AI assistant. How can I help you today?\n\nTip: Ask me about tickets, buildings, roles, or subscriptions!",
            sender: "ai",
        },
    ])

    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [speechSupported] = useState(() => {
        if (typeof window !== 'undefined') {
            return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
        }
        return false
    })
    const recognitionRef = useRef<SpeechRecognition | null>(null)
    const autoSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastTranscriptRef = useRef<string>('')

    // Get user's first initial from localStorage
    const [userInitial] = useState(() => {
        if (typeof window !== 'undefined') {
            const userProfile = localStorage.getItem('userProfile')
            if (userProfile) {
                try {
                    const profile = JSON.parse(userProfile)
                    const name = profile.displayName || profile.name || profile.email || ""
                    if (name) {
                        return name.charAt(0).toUpperCase()
                    }
                } catch {
                    // Ignore parse errors
                }
            }
        }
        return "U"
    })

    // Auto-submit function for voice input
    const autoSubmitVoiceInput = (transcript: string) => {
        if (transcript.trim()) {
            // Stop recording first
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
            setIsRecording(false)

            // Submit the message
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    content: transcript.trim(),
                    sender: "user",
                },
            ])
            setInput("")
            setIsLoading(true)

            // Get AI response
            setTimeout(() => {
                const aiResponse = getAIResponse(transcript.trim())
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now() + 1,
                        content: aiResponse,
                        sender: "ai",
                    },
                ])
                setIsLoading(false)
            }, 600)
        }
    }

    // Setup speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Check for speech recognition support
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition()
                recognition.continuous = true  // Keep listening
                recognition.interimResults = true
                recognition.lang = 'en-US'

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    const transcript = Array.from(event.results)
                        .map(result => result[0].transcript)
                        .join('')
                    setInput(transcript)
                    lastTranscriptRef.current = transcript

                    // Clear existing timeout
                    if (autoSubmitTimeoutRef.current) {
                        clearTimeout(autoSubmitTimeoutRef.current)
                    }

                    // Check if result is final
                    const lastResult = event.results[event.results.length - 1]
                    if (lastResult.isFinal) {
                        // Auto-submit after 3 seconds of silence
                        autoSubmitTimeoutRef.current = setTimeout(() => {
                            autoSubmitVoiceInput(transcript)
                        }, 3000)
                    }
                }

                recognition.onend = () => {
                    // Clear timeout on end
                    if (autoSubmitTimeoutRef.current) {
                        clearTimeout(autoSubmitTimeoutRef.current)
                    }
                    setIsRecording(false)
                }

                recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                    console.error('Speech recognition error:', event.error)
                    if (autoSubmitTimeoutRef.current) {
                        clearTimeout(autoSubmitTimeoutRef.current)
                    }
                    setIsRecording(false)
                }

                recognitionRef.current = recognition
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort()
            }
            if (autoSubmitTimeoutRef.current) {
                clearTimeout(autoSubmitTimeoutRef.current)
            }
        }
    }, [])

    // userInitial is now initialized lazily in useState, no useEffect needed

    const toggleRecording = () => {
        if (!recognitionRef.current) return

        if (isRecording) {
            recognitionRef.current.stop()
            setIsRecording(false)
        } else {
            setInput('')
            recognitionRef.current.start()
            setIsRecording(true)
        }
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMessage = input.trim()

        setMessages((prev) => [
            ...prev,
            {
                id: Date.now(),
                content: userMessage,
                sender: "user",
            },
        ])
        setInput("")
        setIsLoading(true)

        // Simulate AI response delay (shorter for better UX)
        setTimeout(() => {
            const aiResponse = getAIResponse(userMessage)
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    content: aiResponse,
                    sender: "ai",
                },
            ])
            setIsLoading(false)
        }, 600)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e as unknown as FormEvent)
        }
    }

    return (
        <ExpandableChat
            size="lg"
            position="bottom-right"
            icon={<Bot className="h-6 w-6" />}
        >
            {/* Header */}
            <ExpandableChatHeader className="flex-col text-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 justify-center"
                >
                    <motion.div
                        animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                    >
                        <Sparkles className="h-5 w-5 text-yellow-300" />
                    </motion.div>
                    <h1 className="text-lg font-bold tracking-tight">FixItNow Support</h1>
                </motion.div>
                <p className="text-xs text-blue-200/80 mt-0.5 font-medium">
                    AI-Powered Assistant
                </p>
            </ExpandableChatHeader>

            {/* Chat Body */}
            <ExpandableChatBody>
                <ChatMessageList>
                    <AnimatePresence mode="popLayout">
                        {messages.map((message, index) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, x: message.sender === "user" ? 20 : -20, y: 10 }}
                                animate={{ opacity: 1, x: 0, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30,
                                    delay: index === messages.length - 1 ? 0.1 : 0
                                }}
                            >
                                <ChatBubble
                                    variant={message.sender === "user" ? "sent" : "received"}
                                >
                                    <ChatBubbleAvatar
                                        className="h-8 w-8 shrink-0"
                                        fallback={message.sender === "user" ? userInitial : "🤖"}
                                    />
                                    <ChatBubbleMessage
                                        variant={message.sender === "user" ? "sent" : "received"}
                                    >
                                        <div className="whitespace-pre-line">{message.content}</div>
                                    </ChatBubbleMessage>
                                </ChatBubble>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Loading indicator */}
                    <AnimatePresence>
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <ChatBubble variant="received">
                                    <ChatBubbleAvatar
                                        className="h-8 w-8 shrink-0"
                                        fallback="🤖"
                                    />
                                    <ChatBubbleMessage isLoading />
                                </ChatBubble>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </ChatMessageList>
            </ExpandableChatBody>

            {/* Footer */}
            <ExpandableChatFooter>
                <form
                    onSubmit={handleSubmit}
                    className="relative rounded-2xl border border-gray-200/80 dark:border-gray-600/50 bg-white dark:bg-gray-800/90 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-400 transition-all duration-200 overflow-hidden"
                >
                    <ChatInput
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your question..."
                        className="min-h-11 resize-none rounded-2xl bg-transparent border-0 p-3 pr-28 shadow-none focus-visible:ring-0 text-sm placeholder:text-gray-400"
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            className="h-7 w-7 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={toggleRecording}
                            disabled={!speechSupported}
                            className={`h-7 w-7 transition-all duration-200 ${isRecording
                                ? 'text-red-500 bg-red-100 dark:bg-red-900/30 animate-pulse'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                } ${!speechSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={speechSupported ? (isRecording ? 'Stop recording' : 'Start voice input') : 'Voice input not supported'}
                        >
                            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                type="submit"
                                size="sm"
                                className="h-7 px-3 gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg text-xs"
                                disabled={isLoading || !input.trim()}
                            >
                                Send
                                <CornerDownLeft className="h-3 w-3" />
                            </Button>
                        </motion.div>
                    </div>
                </form>
            </ExpandableChatFooter>
        </ExpandableChat>
    )
}
