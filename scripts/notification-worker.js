/**
 * Real-time Notification Worker
 * 
 * This script runs as a persistent background process.
 * It uses MongoDB Change Streams to listen for database changes in real-time.
 * 
 * Use Case:
 * - Detects new 'urgent' tickets immediately.
 * - Detects status changes (e.g., ticket marked 'completed').
 * - Triggers notifications (Email, SMS, Push) - currently simulates via console logs.
 * 
 * Usage: node scripts/notification-worker.js
 * Note: Requires MongoDB Replica Set (Atlas supports this by default).
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fixitnow';

async function startWorker() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db('fixitnow');
    const ticketsCollection = db.collection('tickets');
    
    console.log('✅ Connected. Watching for ticket changes...');
    console.log('👀 Listening for "urgent" priority tickets or status updates...');

    // Create a Change Stream
    // We watch for 'insert' (new tickets) and 'update' (modifications)
    const changeStream = ticketsCollection.watch([
      {
        $match: {
          $or: [
            { 'operationType': 'insert' },
            { 'operationType': 'update' },
            { 'operationType': 'replace' }
          ]
        }
      }
    ], { fullDocument: 'updateLookup' }); // 'updateLookup' ensures we get the full document even on updates

    // Listen for changes
    changeStream.on('change', async (next) => {
      try {
        const ticket = next.fullDocument;
        
        // 1. New Urgent Ticket Created
        if (next.operationType === 'insert') {
          if (ticket.priority === 'urgent') {
            await sendNotification('URGENT_TICKET_CREATED', ticket);
          } else {
            console.log(`[Info] New ticket created: ${ticket.title} (Priority: ${ticket.priority})`);
          }
        }

        // 2. Ticket Updated to Urgent
        if (next.operationType === 'update') {
          const updatedFields = next.updateDescription.updatedFields;
          
          // Check if priority was changed to urgent
          if (updatedFields.priority === 'urgent') {
            await sendNotification('PRIORITY_ESCALATED', ticket);
          }
          
          // Check if status changed
          if (updatedFields.status) {
            console.log(`[Info] Ticket ${ticket.id} status changed to: ${updatedFields.status}`);
            if (updatedFields.status === 'completed') {
               // Could trigger "Ticket Resolved" email here
            }
          }
        }

      } catch (err) {
        console.error('Error processing change event:', err);
      }
    });

    // Keep the script running
    // Error handling for the stream
    changeStream.on('error', (error) => {
      console.error('Change Stream Error:', error);
      // In production, implement retry logic or restart
    });

  } catch (error) {
    console.error('❌ Worker connection error:', error);
    client.close();
    process.exit(1);
  }
}

/**
 * Mock Notification Service
 * Replace this with actual Email/SMS provider logic (e.g., SendGrid, Twilio)
 */
async function sendNotification(type, ticket) {
  const timestamp = new Date().toISOString();
  console.log('\n=============================================');
  console.log(`🚨 ALERT [${timestamp}]`);
  console.log(`Type: ${type}`);
  console.log(`Ticket ID: ${ticket.id}`);
  console.log(`Title: ${ticket.title}`);
  console.log(`Building: ${ticket.buildingId}`);
  console.log(`Assigned To: ${ticket.assignedToName || 'Unassigned'}`);
  console.log('=============================================\n');
  
  // TODO: Add actual email sending logic here
  // await sendEmail(adminEmail, "Urgent Ticket Alert", ...)
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down worker...');
  process.exit(0);
});

startWorker();
