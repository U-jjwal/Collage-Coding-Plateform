const mongoose = require('mongoose');

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        dbName: process.env.DB_NAME || 'college-coding-platform',
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      retries += 1;
      console.error(`❌ MongoDB connection attempt ${retries} failed: ${error.message}`);
      if (retries === maxRetries) {
        console.error('💥 Max retries reached. Exiting process.');
        process.exit(1);
      }
      // Wait before retry (exponential backoff)
      await new Promise((res) => setTimeout(res, 1000 * retries));
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

module.exports = connectDB;
