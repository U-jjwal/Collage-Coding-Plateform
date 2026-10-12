/**
 * seed-admin.js — Run ONCE to create the first admin account.
 * Usage: node seed-admin.js
 *
 * Reads ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME from .env
 * Creates an AuthorizedEmail entry + a verified User account.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const AuthorizedEmail = require('./src/models/AuthorizedEmail');

const {
  MONGODB_URI,
  DB_NAME,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME,
} = process.env;

if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD must be set in .env');
  process.exit(1);
}

const seed = async () => {
  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME || 'college-coding-platform' });
  console.log('✅ Connected to MongoDB');

  const email = ADMIN_EMAIL.toLowerCase().trim();

  // 1. Upsert AuthorizedEmail allowlist entry
  await AuthorizedEmail.findOneAndUpdate(
    { email },
    {
      email,
      role: 'admin',
      fullName: ADMIN_NAME || 'Platform Admin',
      isActive: true,
    },
    { upsert: true, new: true }
  );
  console.log(`✅ AuthorizedEmail entry created/updated for ${email}`);

  // 2. Check if user already exists
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`⚠️  User already exists for ${email}. Skipping user creation.`);
    console.log('   To reset, manually delete the user from MongoDB and re-run.');
    await mongoose.disconnect();
    return;
  }

  // 3. Create admin user (pre-verified)
  const passwordHash = await User.hashPassword(ADMIN_PASSWORD);
  await User.create({
    email,
    passwordHash,
    role: 'admin',
    fullName: ADMIN_NAME || 'Platform Admin',
    isEmailVerified: true,
    isActive: true,
  });

  console.log(`✅ Admin user created: ${email}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('\n🎉 Admin seeded successfully. You can now log in at /login');

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
