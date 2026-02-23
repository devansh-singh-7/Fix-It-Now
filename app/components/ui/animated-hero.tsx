'use client'

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, Wrench } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["Smarter", "Faster", "Efficient", "Reliable", "Intelligent"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full">
      <div className="container mx-auto px-6">
        <div className="flex gap-8 py-20 lg:py-32 items-center justify-center flex-col">
          <div>
            <Button variant="secondary" size="sm" className="gap-4 bg-linear-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-0 text-blue-700 dark:text-blue-300 hover:shadow-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              Trusted by 10,000+ facility teams <MoveRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-4xl tracking-tighter text-center font-bold">
              <span className="text-gray-900 dark:text-white">Enterprise </span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-bold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: -100 }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
              <span className="text-gray-900 dark:text-white"> Management</span>
            </h1>

            <p className="text-xl md:text-2xl leading-relaxed tracking-tight text-gray-600 dark:text-gray-400 max-w-3xl text-center">
              Streamline operations, reduce costs, and enhance tenant satisfaction with our intelligent maintenance platform.
            </p>
            
            <p className="text-lg leading-relaxed text-gray-500 dark:text-gray-500 max-w-2xl text-center">
              From automated ticketing to predictive maintenance, FixItNow provides everything you need to optimize your facility operations.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="gap-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:shadow-xl hover:shadow-blue-500/25">
              <Link href="/auth/signup">
                Start Free Trial <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" className="gap-4" variant="outline">
              <Link href="/demo">
                <Wrench className="w-4 h-4" /> Book a Demo
              </Link>
            </Button>
          </div>
          
          {/* Stats */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl w-full">
            {[
              { value: "10K+", label: "Active Teams" },
              { value: "99.9%", label: "Uptime" },
              { value: "40%", label: "Cost Reduction" },
              { value: "24/7", label: "Support" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { AnimatedHero };
