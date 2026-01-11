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

import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add MONGODB_URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the value across hot reloads
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Get MongoDB client
 */
export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

/**
 * Get MongoDB database
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
  DASHBOARD_STATS: 'dashboard_stats',
} as const;

export default clientPromise;
