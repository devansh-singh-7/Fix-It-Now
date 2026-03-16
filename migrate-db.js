const { MongoClient } = require('mongodb');

// Your current Atlas connection (we use the direct connection string to bypass SRV issues)
const ATLAS_URI = 'mongodb://FixItNow:Devansh77@ac-wzre661-shard-00-00.z7ro7g8.mongodb.net:27017,ac-wzre661-shard-00-01.z7ro7g8.mongodb.net:27017,ac-wzre661-shard-00-02.z7ro7g8.mongodb.net:27017/fixitnow?ssl=true&replicaSet=atlas-10bk0l-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

// Your new local MongoDB connection
const LOCAL_URI = 'mongodb://127.0.0.1:27017/fixitnow';

async function migrate() {
  console.log('🔄 Starting MongoDB Migration...');
  console.log('⚠️ IMPORTANT: If this hangs or times out, your internet is blocking Atlas. Please connect to a Mobile Hotspot temporarily.');

  let atlasClient, localClient;

  try {
    atlasClient = new MongoClient(ATLAS_URI, { serverSelectionTimeoutMS: 5000 });
    localClient = new MongoClient(LOCAL_URI, { serverSelectionTimeoutMS: 5000 });

    console.log('Connecting to Atlas...');
    await atlasClient.connect();
    console.log('✅ Connected to Atlas');

    console.log('Connecting to Local MongoDB...');
    await localClient.connect();
    console.log('✅ Connected to Local MongoDB');

    const atlasDb = atlasClient.db('fixitnow');
    const localDb = localClient.db('fixitnow');

    // List all collections in Atlas
    const collections = await atlasDb.listCollections().toArray();
    
    for (const collInfo of collections) {
      const collectionName = collInfo.name;
      console.log(`\n📦 Migrating collection: ${collectionName}...`);

      const atlasColl = atlasDb.collection(collectionName);
      const localColl = localDb.collection(collectionName);

      // Fetch all documents from Atlas
      const docs = await atlasColl.find({}).toArray();
      
      if (docs.length > 0) {
        // Clear local collection first to avoid duplicates if run multiple times
        await localColl.deleteMany({});
        
        // Insert into local
        await localColl.insertMany(docs);
        console.log(`   ✅ Copied ${docs.length} documents.`);
      } else {
        console.log(`   ℹ️ Collection is empty.`);
      }

      // Copy indexes (excluding the default _id index)
      const atlasIndexes = await atlasColl.indexes();
      for (const index of atlasIndexes) {
        if (index.name !== '_id_') {
          await localColl.createIndex(index.key, {
            name: index.name,
            unique: index.unique,
            sparse: index.sparse
          });
          console.log(`   ✅ Copied index: ${index.name}`);
        }
      }
    }

    console.log('\n🎉 Migration completed successfully! No data was lost.');
    console.log('You can now update your .env.local to point to your local database.');

  } catch (error) {
    console.error('\n❌ Migration Failed:', error.message);
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 This happens because your Wi-Fi/ISP is blocking port 27017 to Atlas.');
      console.error('💡 To easily bypass this, connect your laptop to your MOBILE PHONE HOTSPOT, then run this script again.');
    }
  } finally {
    if (atlasClient) await atlasClient.close();
    if (localClient) await localClient.close();
  }
}

migrate();
