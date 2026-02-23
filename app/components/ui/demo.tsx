'use client'

import { SplineScene } from "@/app/components/ui/splite";
import { Card } from "@/app/components/ui/card"
import { Spotlight } from "@/app/components/ui/spotlight-aceternity"
 
export function SplineSceneBasic() {
  return (
    <Card className="w-full h-[500px] bg-linear-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden border-gray-700">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      
      <div className="flex flex-col lg:flex-row h-full">
        {/* Left content */}
        <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-b from-blue-400 via-blue-300 to-blue-500">
            Facility Management
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">
            Reimagined
          </h2>
          <p className="mt-4 text-gray-300 max-w-lg text-lg leading-relaxed">
            Experience the future of maintenance operations with our intelligent 
            platform. Streamline workflows, track assets, and manage your entire 
            facility from one powerful dashboard.
          </p>
          <div className="mt-6 flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Real-time tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">AI-powered insights</span>
            </div>
          </div>
        </div>

        {/* Right content - 3D Scene */}
        <div className="flex-1 relative min-h-[300px] lg:min-h-0">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  )
}
