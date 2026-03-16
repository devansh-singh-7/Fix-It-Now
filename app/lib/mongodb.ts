/**
 * MongoDB Connection
 * 
 * Connects to local MongoDB instance for storing application data.
 * Uses singleton pattern to reuse connection across requests.
 * 
 * Collections:
 * - users: User profiles with role and metadata
 * - tickets: Maintenance tickets
 * - technicians: Technician availability and skills
 * - preventive_maintenance: Scheduled maintenance tasks
 */

import { MongoClient, Db, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add MONGODB_URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 10000,   // 10s to find a server
  connectTimeoutMS: 10000,           // 10s to establish connection
  socketTimeoutMS: 45000,            // 45s for socket operations
  retryWrites: true,
  retryReads: true,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the value across hot reloads
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
    _mongoClientCreatedAt?: number;
  };

  // Recreate client if the previous one is stale (older than 5 minutes)
  const STALE_MS = 5 * 60 * 1000;
  const isStale = globalWithMongo._mongoClientCreatedAt &&
    Date.now() - globalWithMongo._mongoClientCreatedAt > STALE_MS;

  if (!globalWithMongo._mongoClientPromise || isStale) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
    globalWithMongo._mongoClientCreatedAt = Date.now();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Get MongoDB client with connection retry
 */
export async function getMongoClient(): Promise<MongoClient> {
  try {
    return await clientPromise;
  } catch (error) {
    // If the cached promise rejected (e.g. DNS failure), reset and retry once
    console.warn('MongoDB connection failed, retrying...', error instanceof Error ? error.message : error);

    if (process.env.NODE_ENV === 'development') {
      const globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
        _mongoClientCreatedAt?: number;
      };
      const freshClient = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = freshClient.connect();
      globalWithMongo._mongoClientCreatedAt = Date.now();
      clientPromise = globalWithMongo._mongoClientPromise;
    } else {
      const freshClient = new MongoClient(uri, options);
      clientPromise = freshClient.connect();
    }

    return clientPromise;
  }
}

/**
 * Get MongoDB database with retry
 */
export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db('fixitnow');
}

/**
 * Collection names
 */
export const COLLECTIONS = {
  USERS: 'users',
  TICKETS: 'tickets',
  TECHNICIANS: 'technicians',
  PREVENTIVE_MAINTENANCE: 'preventive_maintenance',
  MAINTENANCE_LOGS: 'maintenance_logs',
  DASHBOARD_STATS: 'dashboard_stats',
  NOTIFICATIONS: 'notifications',
} as const;

export default clientPromise;
