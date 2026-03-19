/**
 * Creates the default admin user if missing (or promotes existing user by email to admin).
 * Run: npm run seed:admin
 * Configure SEED_ADMIN_* in .env (see .env.example).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');

const mongoUri = (process.env.MONGODB_URI || '').replace(/\/$/, '');
const dbName = process.env.DB_NAME;

const email = (process.env.SEED_ADMIN_EMAIL || 'admin@shopiq.com').toLowerCase().trim();
const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
const name = (process.env.SEED_ADMIN_NAME || 'Super Admin').trim();

async function run() {
  if (!mongoUri || !dbName) {
    console.error('❌ MONGODB_URI and DB_NAME must be set in .env');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('❌ SEED_ADMIN_PASSWORD must be at least 8 characters');
    process.exit(1);
  }
  if (name.length < 3) {
    console.error('❌ SEED_ADMIN_NAME must be at least 3 characters');
    process.exit(1);
  }

  try {
    await mongoose.connect(`${mongoUri}/${dbName}`);
    console.log(`✅ Connected to MongoDB → "${mongoose.connection.name}"`);

    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role === 'admin') {
        console.log(`ℹ️  Admin already exists: ${email}`);
      } else {
        await User.updateOne({ _id: existing._id }, { $set: { role: 'admin' } });
        console.log(`✅ Existing user promoted to admin: ${email}`);
      }
    } else {
      await User.create({
        name,
        email,
        password,
        role: 'admin',
        authProvider: 'local',
        isActive: true,
        isRestricted: false,
      });
      console.log(`✅ Admin user created: ${email}`);
      console.log('   Change SEED_ADMIN_PASSWORD in .env and re-run only after deleting this user if you used defaults.');
    }

    console.log(`   Login email: ${email}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

run();
