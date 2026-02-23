export default function Loading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-gray-950/70 border-b border-gray-100 dark:border-gray-800">
        <div className="px-6 py-4 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="w-32 h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="w-24 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </header>

      {/* Hero Skeleton */}
      <main className="relative z-10 px-6 pt-16 pb-24 max-w-7xl mx-auto">
        <section className="text-center max-w-5xl mx-auto mb-20">
          <div className="w-3/4 h-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mx-auto mb-6" />
          <div className="w-1/2 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mx-auto mb-8" />
          <div className="flex gap-4 justify-center">
            <div className="w-40 h-14 bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="w-40 h-14 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          </div>
        </section>

        {/* Features Grid Skeleton */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <div className="w-96 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mx-auto mb-4" />
            <div className="w-64 h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse"
              >
                <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-xl mb-4" />
                <div className="w-3/4 h-6 bg-gray-200 dark:bg-gray-800 rounded mb-3" />
                <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                <div className="w-5/6 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
