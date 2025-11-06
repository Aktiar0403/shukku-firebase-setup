// api/setup.js - One-click Firebase setup for Giash & Rina
import admin from 'firebase-admin';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests for simplicity
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Use GET request to setup database' 
    });
  }

  console.log('🚀 Starting Shukku List Firebase Setup...');

  try {
    // Check environment variable
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error(`
FIREBASE_SERVICE_ACCOUNT environment variable is missing.

Setup Steps:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Copy the entire JSON
4. Add to Vercel: FIREBASE_SERVICE_ACCOUNT = { "type": "service_account", ... }
      `);
    }

    // Initialize Firebase
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    // Check if already initialized
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
    }

    const db = admin.firestore();

    // Demo users - Giash and Rina
    const demoUsers = [
      {
        uid: 'giash_uid',
        email: 'giash@shukku.com',
        name: 'Giash',
        tokens: ['fcm_demo_giash'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        avatar: '👨‍💻'
      },
      {
        uid: 'rina_uid', 
        email: 'rina@shukku.com',
        name: 'Rina',
        tokens: ['fcm_demo_rina'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        avatar: '👩‍💼'
      }
    ];

    // Their shared shopping list
    const demoPairs = [
      {
        pairId: 'giash_rina_home',
        users: ['giash_uid', 'rina_uid'],
        inviteCode: '729463',
        listName: 'Giash & Rina Home',
        items: [
          {
            id: '1',
            name: 'Organic Milk',
            qty: 2,
            done: false,
            addedBy: 'giash_uid',
            category: 'dairy',
            note: 'Get the organic one',
            createdAt: Date.now() - 86400000,
            updatedAt: Date.now() - 86400000
          },
          {
            id: '2', 
            name: 'Whole Wheat Bread',
            qty: 1,
            done: true,
            addedBy: 'rina_uid',
            category: 'bakery',
            createdAt: Date.now() - 43200000,
            updatedAt: Date.now() - 3600000
          },
          {
            id: '3',
            name: 'Fresh Eggs (Dozen)',
            qty: 1,
            done: false,
            addedBy: 'giash_uid',
            category: 'dairy',
            createdAt: Date.now() - 7200000,
            updatedAt: Date.now() - 7200000
          },
          {
            id: '4',
            name: 'Bananas',
            qty: 6,
            done: false,
            addedBy: 'rina_uid',
            category: 'fruits',
            note: 'For morning smoothies',
            createdAt: Date.now() - 3600000,
            updatedAt: Date.now() - 3600000
          },
          {
            id: '5',
            name: 'Coffee Beans',
            qty: 1,
            done: false,
            addedBy: 'giash_uid',
            category: 'beverages',
            note: 'Dark roast preferred',
            createdAt: Date.now() - 1800000,
            updatedAt: Date.now() - 1800000
          },
          {
            id: '6',
            name: 'Amazon Echo Dot',
            qty: 1,
            done: false,
            addedBy: 'rina_uid',
            category: 'electronics',
            link: 'https://www.amazon.com/dp/B08N5WRWNW',
            image: 'https://images-na.ssl-images-amazon.com/images/I/71OZY035QKL._AC_SL1500_.jpg',
            price: '$49.99',
            createdAt: Date.now() - 900000,
            updatedAt: Date.now() - 900000
          }
        ],
        settings: {
          notifications: true,
          autoSort: true
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    console.log('🧹 Cleaning previous demo data...');
    await clearDemoData(db);

    console.log('📝 Creating Giash & Rina users...');
    for (const user of demoUsers) {
      await db.collection('users').doc(user.uid).set(user);
      console.log(`   ✅ ${user.avatar} ${user.name}`);
    }

    console.log('🛍️ Creating shared shopping list...');
    for (const pair of demoPairs) {
      await db.collection('pairs').doc(pair.pairId).set(pair);
      console.log(`   ✅ List: "${pair.listName}"`);
      console.log(`   📋 ${pair.items.length} items added`);
    }

    // Verify setup
    const usersCount = (await db.collection('users').get()).size;
    const pairsCount = (await db.collection('pairs').get()).size;

    console.log('🎉 Setup completed successfully!');

    return res.status(200).json({
      success: true,
      message: 'Shukku List Database Setup Complete!',
      data: {
        project: serviceAccount.project_id,
        users: usersCount,
        pairs: pairsCount,
        demo: {
          couple: 'Giash & Rina',
          inviteCode: '729463',
          users: [
            { name: 'Giash', email: 'giash@shukku.com', uid: 'giash_uid' },
            { name: 'Rina', email: 'rina@shukku.com', uid: 'rina_uid' }
          ],
          items: 6
        },
        nextSteps: [
          'Your main app can now connect to Firebase',
          'Test with the demo UIDs in your app',
          'Real users will be created through signup'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      help: `
Required Setup:
1. Firebase Project: shukku-list
2. Enable Authentication → Email/Password
3. Create Firestore Database
4. Add FIREBASE_SERVICE_ACCOUNT to Vercel
      `
    });
  }
}

async function clearDemoData(db) {
  try {
    const batch = db.batch();
    
    // Delete demo users
    const users = ['giash_uid', 'rina_uid'];
    users.forEach(uid => {
      batch.delete(db.collection('users').doc(uid));
    });
    
    // Delete demo pairs
    const pairs = ['giash_rina_home'];
    pairs.forEach(pairId => {
      batch.delete(db.collection('pairs').doc(pairId));
    });
    
    await batch.commit();
    console.log('   ✅ Cleared previous demo data');
  } catch (error) {
    console.log('   ℹ️ No previous data to clear');
  }
}