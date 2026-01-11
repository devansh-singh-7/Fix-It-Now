/**
 * Quick check - Count tickets in MongoDB
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'fixitnow';

(async () => {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    const count = await db.collection('tickets').countDocuments();
    console.log(`\n✅ Total tickets in MongoDB: ${count}\n`);
    
    const latest = await db.collection('tickets').find({}).sort({ createdAt: -1 }).limit(3).toArray();
    console.log('📋 Latest 3 tickets:');
    latest.forEach((t, i) => {
      console.log(`${i + 1}. "${t.title}" - ${t.status} - Created: ${t.createdAt.toLocaleString()}`);
    });
    console.log('');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
})();
