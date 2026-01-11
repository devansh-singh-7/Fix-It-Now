"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: "Getting Started",
    question: "How do I create my first ticket?",
    answer: "To create a ticket, navigate to your dashboard and click the 'Create Ticket' button. Fill in the required details including title, description, and category. Once submitted, your request will be sent to the maintenance team."
  },
  {
    category: "Getting Started",
    question: "How do I join a building?",
    answer: "After signing up, you can join a building by entering a building join code provided by your building administrator. Go to Settings or Profile page and enter the code in the 'Join Building' section."
  },
  {
    category: "Account",
    question: "Can I change my role after signing up?",
    answer: "Role changes must be made by a building administrator. Contact your admin if you need your role updated from resident to technician or vice versa."
  },
  {
    category: "Tickets",
    question: "How long does it take for my ticket to be resolved?",
    answer: "Resolution time depends on the priority and complexity of the issue. High-priority and emergency tickets are typically addressed within 24 hours. Normal priority tickets are usually resolved within 3-5 business days."
  },
  {
    category: "Tickets",
    question: "Can I track the status of my ticket?",
    answer: "Yes! You can view all your tickets and their current status on the Tickets page. Each ticket shows its status (open, in-progress, resolved, closed) and any updates from the technicians."
  },
  {
    category: "Tickets",
    question: "How do I cancel or update a ticket?",
    answer: "Currently, you cannot cancel a ticket directly, but you can add comments or contact support to request changes. Future updates will include ticket editing capabilities."
  },
  {
    category: "Technical",
    question: "What file types can I upload?",
    answer: "You can upload images (JPEG, PNG, GIF) and PDF documents. Each file must be under 5MB, and you can upload up to 3 files per ticket."
  },
  {
    category: "Technical",
    question: "Why can't I create tickets?",
    answer: "You must be assigned to a building before creating tickets. Join a building using a building code from your administrator, or contact support for assistance."
  },
  {
    category: "Billing",
    question: "Is FixItNow free to use?",
    answer: "FixItNow offers both free and premium plans. The free plan includes basic ticket management features. Premium plans offer advanced analytics, priority support, and additional features for buildings."
  },
  {
    category: "Security",
    question: "How is my data protected?",
    answer: "We use industry-standard encryption for all data transmission and storage. Your personal information is never shared with third parties without your consent."
  }
];

const categories = Array.from(new Set(faqs.map(faq => faq.category)));

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "bot"; message: string }>>([
    { role: "bot", message: "Hi! I'm your FixItNow assistant. Ask me anything about tickets, your account, or how to use our platform!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [botState, setBotState] = useState<"idle" | "thinking" | "talking">("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Greetings
    if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      return "Hello! How can I assist you today? Feel free to ask about tickets, your account, or any feature of FixItNow.";
    }

    // Check for specific FAQ matches
    const matchedFAQ = faqs.find(faq => {
      const questionWords = faq.question.toLowerCase().split(' ').slice(0, 4);
      return questionWords.some(word => lowerMessage.includes(word)) ||
             lowerMessage.includes(faq.category.toLowerCase());
    });

    if (matchedFAQ) {
      return `${matchedFAQ.answer}\n\nYou can also check the "${matchedFAQ.category}" section in the FAQ below for more information.`;
    }

    // Specific keywords with better matching
    if (lowerMessage.includes("ticket") && (lowerMessage.includes("create") || lowerMessage.includes("make") || lowerMessage.includes("new"))) {
      return "To create a ticket:\n1. Go to your Dashboard\n2. Click 'Create Ticket'\n3. Fill in the details (title, description, category)\n4. Submit\n\nYour ticket will be sent to the maintenance team immediately!";
    }

    if (lowerMessage.includes("ticket") && lowerMessage.includes("status")) {
      return "You can track your ticket status on the Tickets page. Each ticket shows its current status (open, in-progress, resolved, closed) and any updates from technicians.";
    }

    if (lowerMessage.includes("join") && lowerMessage.includes("building")) {
      return "To join a building:\n1. Get a join code from your building administrator\n2. Go to Settings > Profile\n3. Enter the code in 'Join Building'\n4. Click 'Join'\n\nYou'll then be able to create tickets for that building!";
    }

    if (lowerMessage.includes("help") || lowerMessage.includes("support")) {
      return "I'm here to help! You can:\n• Browse our FAQ section below\n• Email us at support@fixitnow.com\n• Call our support line: 1-800-FIX-NOW\n• Or ask me more specific questions!";
    }

    if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("pricing") || lowerMessage.includes("free")) {
      return "FixItNow offers:\n• Free Plan: Basic ticket management\n• Premium Plan ($9.99/month): Advanced analytics, priority support, unlimited file uploads\n• Enterprise Plan (Custom): For large buildings with advanced needs\n\nWould you like to know more about a specific plan?";
    }

    if (lowerMessage.includes("thank")) {
      return "You're very welcome! 😊 Let me know if you need anything else. I'm here to help!";
    }

    if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye")) {
      return "Goodbye! Feel free to come back anytime you need help. Have a great day! ✨";
    }

    if (lowerMessage.includes("upload") || lowerMessage.includes("file")) {
      return "You can upload:\n• Images: JPEG, PNG, GIF (under 5MB each)\n• Documents: PDF (under 5MB)\n• Maximum 3 files per ticket\n\nMake sure files are clear and relevant to your issue!";
    }

    // Default response
    return "I'm not sure about that specific question, but I'd be happy to help! Could you:\n• Rephrase your question\n• Check the FAQ section below\n• Or email support@fixitnow.com for detailed assistance\n\nWhat else can I help you with?";
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || isTyping) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", message: userMessage }]);
    setChatInput("");
    setIsTyping(true);
    setBotState("thinking");

    // Simulate thinking delay with variable timing
    const thinkingTime = Math.min(Math.max(userMessage.length * 20, 800), 2000);
    
    setTimeout(() => {
      const botResponse = getBotResponse(userMessage);
      setBotState("talking");
      setChatMessages(prev => [...prev, { role: "bot", message: botResponse }]);
      setIsTyping(false);
      
      // Return to idle after talking animation completes
      setTimeout(() => {
        setBotState("idle");
      }, 1500);
    }, thinkingTime);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setChatInput(question);
    // Auto-send after a brief delay
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-blue-50/20 via-transparent to-purple-50/20 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10" />
        <div 
          className="absolute inset-0 opacity-10 dark:opacity-5"
          style={{
            backgroundImage: `linear-gradient(to right, #94a3b8 1px, transparent 1px),
                             linear-gradient(to bottom, #94a3b8 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Help & Support
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Find answers to your questions or get in touch with our support team
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pl-14 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
              />
              <svg
                className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid md:grid-cols-3 gap-4 mb-12"
            >
              <Link href="/dashboard" className="group p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-lg hover:shadow-xl">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Dashboard</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Go to your dashboard</p>
              </Link>

              <Link href="/tickets" className="group p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-green-500 dark:hover:border-green-500 transition-all shadow-lg hover:shadow-xl">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">My Tickets</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">View all your tickets</p>
              </Link>

              <Link href="/settings" className="group p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-purple-500 dark:hover:border-purple-500 transition-all shadow-lg hover:shadow-xl">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Settings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account</p>
              </Link>
            </motion.div>

            {/* Category Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8"
            >
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedCategory("All")}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    selectedCategory === "All"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:border-blue-500"
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                      selectedCategory === category
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:border-blue-500"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Frequently Asked Questions
              </h2>

              {filteredFAQs.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400">No results found. Try a different search or category.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFAQs.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <button
                        onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex-1">
                          <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full mb-2">
                            {faq.category}
                          </span>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform ${openFAQ === index ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {openFAQ === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                              <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Contact Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-12 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white"
            >
              <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
              <p className="mb-6 opacity-90">
                Can&apos;t find what you&apos;re looking for? Our support team is here to help you 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg">
                  Chat with Support
                </button>
                <a
                  href="mailto:support@fixitnow.com"
                  className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-colors text-center"
                >
                  Email Us
                </a>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Chatbot */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="sticky top-8"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg flex flex-col h-[600px]">
                {/* Chatbot Header */}
                <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <motion.div
                          animate={{
                            rotate: botState === "thinking" ? [0, 5, -5, 0] : 0,
                            scale: botState === "talking" ? [1, 1.05, 1] : 1
                          }}
                          transition={{
                            duration: botState === "thinking" ? 1 : 0.3,
                            repeat: botState === "thinking" ? Infinity : 0
                          }}
                          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                        >
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </motion.div>
                        {/* Status Indicator */}
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "loop"
                          }}
                          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            botState === "thinking" ? "bg-yellow-400" : 
                            botState === "talking" ? "bg-green-400" : 
                            "bg-blue-400"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">AI Assistant</h3>
                        <motion.p
                          key={botState}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-white/80"
                        >
                          {botState === "thinking" ? "Thinking..." : 
                           botState === "talking" ? "Responding..." : 
                           "Online • Ready to help"}
                        </motion.p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setChatMessages([chatMessages[0]])}
                      className="text-white/80 hover:text-white p-1"
                      title="Clear chat"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {/* Quick Questions */}
                <div className="px-4 pt-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {["How to create ticket?", "Join building?", "File uploads?"].map((q, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleQuickQuestion(q)}
                        className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Chat Messages */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950"
                >
                  {chatMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 ${
                          msg.role === "user"
                            ? "bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line leading-relaxed">{msg.message}</p>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <motion.div
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                            className="w-2 h-2 bg-indigo-500 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                            className="w-2 h-2 bg-purple-500 rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your question..."
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={isTyping}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || isTyping}
                      className="px-4 py-2 bg-linear-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                    >
                      {isTyping ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </motion.div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </motion.button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Ask about tickets, account, or features
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Support Stats</h3>
                <div className="space-y-3">
                  {[
                    { label: "Avg Response Time", value: "2 mins", color: "text-gray-900 dark:text-white" },
                    { label: "Satisfaction Rate", value: "98%", color: "text-green-600 dark:text-green-400" },
                    { label: "Tickets Resolved", value: "10K+", color: "text-gray-900 dark:text-white" },
                    { label: "Active Users", value: "5K+", color: "text-blue-600 dark:text-blue-400" }
                  ].map((stat, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
                      <span className={`font-semibold ${stat.color}`}>{stat.value}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}