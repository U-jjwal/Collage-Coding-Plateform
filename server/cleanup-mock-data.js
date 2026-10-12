/**
 * Cleanup script to remove all mock and test data from the database,
 * preserving only the real Platform Admin and real configured accounts.
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function cleanup() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.DB_NAME || 'college-coding-platform',
  });

  const db = mongoose.connection.db;

  // 1. Delete all mock/test questions
  const qResult = await db.collection('questions').deleteMany({
    $or: [
      { title: { $regex: /1791833/ } },
      { title: { $regex: /Sum of Two Numbers/ } },
      { title: { $regex: /Test Question/ } },
      { slug: { $regex: /sum-of-two-numbers/ } },
    ],
  });
  console.log(`🧹 Deleted ${qResult.deletedCount} mock questions.`);

  // 2. Delete all test submissions
  const sResult = await db.collection('submissions').deleteMany({});
  console.log(`🧹 Deleted ${sResult.deletedCount} test submissions.`);

  // 3. Delete mock/test users (users with timestamp pattern or test emails)
  const uResult = await db.collection('users').deleteMany({
    $or: [
      { email: { $regex: /1791833/ } },
      { email: { $regex: /student1_/ } },
      { email: { $regex: /student2_/ } },
      { email: { $regex: /teacher_a_/ } },
      { email: { $regex: /teacher_b_/ } },
      { email: { $regex: /admin_179/ } },
      { email: { $regex: /test_/ } },
      { fullName: { $regex: /Hacker User/ } },
    ],
  });
  console.log(`🧹 Deleted ${uResult.deletedCount} mock user accounts.`);

  // 4. Delete mock authorized emails
  const eResult = await db.collection('authorizedemails').deleteMany({
    $or: [
      { email: { $regex: /1791833/ } },
      { email: { $regex: /student1_/ } },
      { email: { $regex: /student2_/ } },
      { email: { $regex: /teacher_a_/ } },
      { email: { $regex: /teacher_b_/ } },
      { email: { $regex: /admin_179/ } },
      { email: { $regex: /test_/ } },
      { email: { $regex: /unauth_/ } },
    ],
  });
  console.log(`🧹 Deleted ${eResult.deletedCount} mock authorized emails.`);

  // Print remaining clean records
  const remainingUsers = await db.collection('users').find({}, { projection: { email: 1, role: 1, fullName: 1 } }).toArray();
  const remainingEmails = await db.collection('authorizedemails').find({}, { projection: { email: 1, role: 1, fullName: 1 } }).toArray();
  const remainingQuestions = await db.collection('questions').find({}, { projection: { title: 1, status: 1 } }).toArray();
  const remainingSubmissions = await db.collection('submissions').countDocuments();

  console.log('\n✅ Database is now clean:');
  console.log('Remaining Users:', remainingUsers);
  console.log('Remaining Authorized Emails:', remainingEmails);
  console.log('Remaining Questions:', remainingQuestions);
  console.log('Remaining Submissions:', remainingSubmissions);

  await mongoose.connection.close();
  console.log('\nDatabase connection closed. Cleanup complete.');
}

cleanup().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
