/**
 * MongoDB Connection Test
 * 
 * Run this test to verify MongoDB connection and basic operations
 * 
 * Usage: node --loader ts-node/esm app/api/test-mongodb.ts
 * Or create a test endpoint at /api/test-db
 */

import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

export async function GET() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    
    // Test 1: Connect to database
    const db = await getDatabase();
    console.log('✅ Connected to MongoDB database');
    
    // Test 2: List collections
    const collections = await db.listCollections().toArray();
    console.log('✅ Collections found:', collections.map(c => c.name));
    
    // Test 3: Count documents in each collection
    const stats: Record<string, number> = {};
    for (const collection of ['users', 'buildings', 'tickets']) {
      const count = await db.collection(collection).countDocuments();
      stats[collection] = count;
    }
    console.log('✅ Document counts:', stats);
    
    // Test 4: Test query (find one user)
    const sampleUser = await db.collection('users').findOne({});
    console.log('✅ Sample user query:', sampleUser ? 'Success' : 'No users found');
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      database: 'fixitnow',
      collections: collections.map(c => c.name),
      documentCounts: stats,
      hasSampleUser: !!sampleUser,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
