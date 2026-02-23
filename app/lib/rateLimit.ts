import { getDatabase } from './mongodb';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Rate limit a user action using MongoDB
 * 
 * @param key - Unique identifier (e.g., userId or IP)
 * @param limit - Max number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns RateLimitResult
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const db = await getDatabase();
  const collection = db.collection('rate_limits');
  const now = Date.now();
  const resetAt = now + windowMs;

  // 1. Try to find an existing window for this key
  const window = await collection.findOne({ key });

  if (!window || window.resetAt < now) {
    // No window or window expired -> Create new window
    await collection.updateOne(
      { key },
      {
        $set: {
          key,
          count: 1,
          resetAt,
          createdAt: new Date() // For TTL cleanup
        }
      },
      { upsert: true }
    );

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: resetAt
    };
  }

  // 2. Window exists and is active -> Increment count
  if (window.count >= limit) {
    // Limit exceeded
    return {
      success: false,
      limit,
      remaining: 0,
      reset: window.resetAt
    };
  }

  // Increment
  await collection.updateOne(
    { key },
    { $inc: { count: 1 } }
  );

  return {
    success: true,
    limit,
    remaining: limit - (window.count + 1),
    reset: window.resetAt
  };
}

/**
 * Ensure the rate limits collection supports expiry (TTL)
 * Call this during app initialization or setup
 */
export async function initRateLimitIndex() {
  try {
    const db = await getDatabase();
    // Create TTL index on createdAt to auto-delete old records after 24 hours (cleanup)
    await db.collection('rate_limits').createIndex(
      { "createdAt": 1 },
      { expireAfterSeconds: 86400 } // 24 hours
    );
    // Create index on key for fast lookups
    await db.collection('rate_limits').createIndex({ key: 1 });
  } catch (error) {
    console.error('Failed to create rate limit indexes:', error);
  }
}
