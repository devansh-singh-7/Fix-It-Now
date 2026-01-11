"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { SplineSceneBasic } from "./components/ui/demo";
import { GradientText } from "@/components/ui/gradient-text";
import { Pricing, fixitupPlans } from "@/components/ui/pricing";

/* -------------------------
   Local FeatureCard component
   ------------------------- */
type FeatureCardProps = {
  title: string;
  description: string;
  icon?: React.ReactNode;
  delay?: number;
  priority?: "low" | "medium" | "high";
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  delay = 0,
  priority = "low",
}) => {
  const reduce = useReducedMotion();

  const badgeColor =
    priority === "high"
      ? "bg-gradient-to-r from-red-500 to-rose-500"
      : priority === "medium"
        ? "bg-gradient-to-r from-amber-500 to-yellow-500"
        : "bg-gradient-to-r from-emerald-500 to-green-500";

  return (
    <motion.article
      role="article"
      aria-label={title}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: reduce ? 0 : 0.35,
        delay: reduce ? 0 : delay,
        ease: [0.215, 0.61, 0.355, 1],
      }}
      whileHover={reduce ? {} : { y: -4 }}
      // FIX: Added h-full and flex-col to ensure cards are equal height
      className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
      style={{ willChange: "transform, opacity" }}
    >
      {/* Subtle gradient background on hover */}
      {/* FIX: Changed bg-linear-to-br to bg-gradient-to-br */}
      <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-blue-50/50 dark:to-blue-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <header className="relative flex items-start gap-5">
        <div className="flex-none w-14 h-14 rounded-xl flex items-center justify-center ring-1 ring-gray-200 dark:ring-gray-800 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 shadow-sm">
          <span className="text-2xl text-gray-700 dark:text-gray-300" aria-hidden>
            {icon}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </header>

      {/* FIX: Added mt-auto to push this section to the bottom of the card */}
      <div className="relative mt-auto pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${badgeColor} ${priority === "high" ? "animate-pulse" : ""
              }`}
          />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {priority} priority
          </span>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
          <svg
            className="w-5 h-5 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </motion.article>
  );
};

/* -------------------------
   Landing Page
   ------------------------- */
const LandingPage: React.FC = () => {
  const reduce = useReducedMotion();

  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userRole, setUserRole] = React.useState<
    "admin" | "technician" | "resident" | null
  >(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      const token = localStorage.getItem("authToken");
      setIsAuthenticated(!!token);

      if (token) {
        const userProfile = localStorage.getItem("userProfile");
        if (userProfile) {
          const profile = JSON.parse(userProfile);
          setUserRole(profile.role || null);
        }
      }
    } catch {
      setIsAuthenticated(false);
      setUserRole(null);
    }
  }, []);

  const heroInitial = reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 };
  const heroAnimate = { opacity: 1, y: 0 };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-x-hidden font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-50/20 via-transparent to-purple-50/20 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-10 dark:opacity-5"
          style={{
            backgroundImage: `linear-gradient(to right, #94a3b8 1px, transparent 1px),
                              linear-gradient(to bottom, #94a3b8 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Floating geometric elements */}
        {!reduce && (
          <>
            <motion.div
              aria-hidden
              animate={{
                y: [0, -100, 0],
                rotate: [0, 180, 360],
                opacity: [0.03, 0.06, 0.03],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/4 right-1/4 w-64 h-64 border border-blue-200/30 dark:border-blue-800/20 rounded-full blur-3xl"
            />
            <motion.div
              aria-hidden
              animate={{
                y: [0, 80, 0],
                rotate: [0, -180, -360],
                opacity: [0.02, 0.05, 0.02],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear",
                delay: 5,
              }}
              className="absolute bottom-1/3 left-1/4 w-48 h-48 border border-purple-200/30 dark:border-purple-800/20 rounded-lg rotate-45 blur-2xl"
            />
          </>
        )}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-gray-950/70 border-b border-gray-100 dark:border-gray-800">
        <div className="px-6 py-4 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3 group"
              aria-label="FixItNow home"
            >
              <div className="relative w-10 h-10">
                <img
                  src="/fixitnow-icon.png"
                  alt="FixItNow Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <span className="text-2xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                FixItNow
              </span>
            </Link>

            <div>
              {!mounted ? (
                <div className="w-24 h-8" />
              ) : isAuthenticated ? (
                userRole === "admin" ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                  >
                    Admin Dashboard
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  >
                    Dashboard
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                )
              ) : (
                <nav className="flex gap-4 items-center">
                  <Link
                    href="/auth/signin"
                    className="hidden sm:block text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300"
                  >
                    Get Started
                  </Link>
                </nav>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 pt-16 pb-24 max-w-7xl mx-auto">
        <motion.section
          initial={heroInitial}
          animate={heroAnimate}
          transition={{ duration: reduce ? 0 : 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
          className="text-center max-w-5xl mx-auto"
        >

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="text-gray-900 dark:text-white">Enterprise </span>
            <GradientText>
              Maintenance
            </GradientText>
            <span className="text-gray-900 dark:text-white"> Management</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-3xl mx-auto">
            Streamline operations, reduce costs, and enhance tenant satisfaction with our intelligent maintenance platform.
          </p>

          {/* Description */}
          <p className="text-lg text-gray-500 dark:text-gray-500 mb-12 max-w-2xl mx-auto">
            From automated ticketing to predictive maintenance, FixItNow provides everything you need to optimize your facility operations.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div
              whileHover={!reduce ? { scale: 1.02 } : {}}
              whileTap={!reduce ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link
                href="/auth/signup"
                aria-label="Start Free Trial"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300"
              >
                Start Free Trial
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </motion.div>

            <motion.div
              whileHover={!reduce ? { scale: 1.02 } : {}}
              whileTap={!reduce ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link
                href="/demo"
                aria-label="Book a Demo"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Book a Demo
              </Link>
            </motion.div>
          </div>

          {/* Stats */}

        </motion.section>

        {/* Features Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          // FIX: Made margins responsive (mt-16 on mobile, mt-32 on desktop)
          className="mt-16 md:mt-32"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive Maintenance Platform
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to streamline operations, from request to
              resolution
            </p>
          </div>

          {/* FIX: Added items-stretch to grid to ensure equal height cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            <FeatureCard
              icon="📱"
              title="Mobile-First Reporting"
              description="Submit maintenance requests instantly from any device with photos, location, and detailed descriptions. Works offline and syncs automatically."
              delay={0}
              priority="high"
            />
            <FeatureCard
              icon="🎯"
              title="Smart Assignment"
              description="AI-powered routing assigns tickets to the right technician based on skills, availability, location, and workload for faster resolution."
              delay={0.1}
              priority="high"
            />
            <FeatureCard
              icon="📊"
              title="Real-Time Analytics"
              description="Track KPIs, response times, completion rates, and costs with comprehensive dashboards."
              delay={0.2}
              priority="medium"
            />
            <FeatureCard
              icon="🔔"
              title="Instant Notifications"
              description="Get real-time updates via email, SMS, and push notifications for ticket status changes, assignments, and escalations."
              delay={0}
              priority="medium"
            />
            <FeatureCard
              icon="🔧"
              title="Technician Tools"
              description="Equip your team with mobile apps, work order management, inventory tracking, and time tracking."
              delay={0.1}
              priority="medium"
            />
            <FeatureCard
              icon="🔮"
              title="Predictive Maintenance"
              description="Prevent costly breakdowns with AI-driven predictions, automated scheduling, and preventive maintenance workflows."
              delay={0.2}
              priority="low"
            />
          </div>
        </motion.div>

        {/* How It Works - Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.6 }}
          className="mt-20 md:mt-32"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Streamlined Workflow
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From request to resolution in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "1",
                title: "Report Issue",
                description:
                  "Residents report maintenance issues through web, mobile app, or phone with photos and detailed descriptions.",
                color: "from-blue-500 to-blue-600",
              },
              {
                step: "2",
                title: "Auto-Assign",
                description:
                  "System intelligently routes tickets to qualified technicians based on skills, location, and availability.",
                color: "from-purple-500 to-purple-600",
              },
              {
                step: "3",
                title: "Track & Resolve",
                description:
                  "Monitor progress in real-time, communicate with technicians, and close tickets with satisfaction ratings.",
                color: "from-emerald-500 to-emerald-600",
              },
            ].map((item, index) => (
              <div key={index} className="relative h-full">
                {/* Connector line for desktop - FIX: Positioned absolute right-0 with correct translation */}
                {index < 2 && (
                  <div className="hidden lg:block absolute top-10 -right-[17px] w-8 h-0.5 bg-gray-300 dark:bg-gray-700 z-0" />
                )}

                <div className="relative group h-full z-10">
                  <div
                    className={`absolute -inset-1 bg-linear-to-r ${item.color} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                  />
                  <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 bg-linear-to-r ${item.color} rounded-xl mb-6 shadow-md`}
                    >
                      <span className="text-2xl font-bold text-white">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Interactive 3D Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.6 }}
          className="mt-20 md:mt-32 w-full relative"
        >
          {/* FIX: Added min-height to ensure the scene has space */}
          <div className="min-h-[400px] w-full rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <SplineSceneBasic />
          </div>
        </motion.section>

        {/* Benefits Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.6 }}
          className="mt-20 md:mt-32 bg-linear-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 rounded-3xl p-8 md:p-12 border border-gray-200 dark:border-gray-800"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Measurable Results
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              See how FixItNow delivers tangible value to your organization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: (
                  <svg
                    className="w-6 h-6 text-emerald-600 dark:text-emerald-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
                title: "60% Faster Response Times",
                description:
                  "Automated routing and mobile alerts get technicians on-site faster than ever",
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
                title: "40% Cost Reduction",
                description:
                  "Optimize technician schedules, prevent emergency repairs, and reduce overtime",
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6 text-purple-600 dark:text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                ),
                title: "85% Tenant Satisfaction",
                description:
                  "Keep residents informed with real-time updates and transparent communication",
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6 text-amber-600 dark:text-amber-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                ),
                title: "24-Hour Deployment",
                description:
                  "No complex setup required - get your team up and running in less than a day",
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex-none w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Pricing Section */}
        <motion.section
          id="pricing"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.6 }}
          className="mt-20 md:mt-32"
        >
          <Pricing
            plans={fixitupPlans}
            title="Choose Your Plan"
            description="Get started with FixItUp and transform your building maintenance.\nPay once, manage all your buildings, technicians, and services."
          />
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.6 }}
          className="mt-20 md:mt-32 text-center"
        >
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-gray-900 to-gray-800 dark:from-gray-900 dark:to-black p-8 md:p-12 text-white shadow-2xl">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2px, transparent 0)`,
                  backgroundSize: "50px 50px",
                }}
              />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">
              Ready to Transform Your Operations?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto relative z-10">
              Join thousands of teams already optimizing their maintenance
              workflow with FixItNow
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
              <motion.div
                whileHover={!reduce ? { scale: 1.02 } : {}}
                whileTap={!reduce ? { scale: 0.98 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:shadow-xl transition-all duration-300"
                >
                  Start Free Trial
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              </motion.div>

              <Link
                href="/contact"
                className="text-white opacity-80 hover:opacity-100 font-medium transition-opacity px-4 py-2"
              >
                Contact Sales →
              </Link>
            </div>

            <p className="mt-8 text-sm opacity-75 relative z-10">
              No credit card required • 14-day free trial • Enterprise-grade
              security
            </p>
          </div>
        </motion.section>

        {/* Trusted By */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24"
        >
          <p className="text-center text-sm text-gray-500 dark:text-gray-500 mb-8 font-medium tracking-wide uppercase">
            Trusted by industry leaders
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {[
              "PropertyCo",
              "FacilityMax",
              "BuildingPro",
              "MaintenanceHub",
              "TechServices",
            ].map((company, index) => (
              <div
                key={index}
                className="text-gray-800 dark:text-gray-200 text-lg font-bold hover:scale-105 transition-transform cursor-default"
              >
                {company}
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9">
                <img
                  src="/fixitnow-icon.png"
                  alt="FixItNow Logo"
                  className="w-9 h-9 object-contain"
                />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                FixItNow
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-gray-600 dark:text-gray-400">
              <a
                href="/privacy"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="/security"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Security
              </a>
              <a
                href="/contact"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contact
              </a>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-500">
              © 2025 FixItNow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;