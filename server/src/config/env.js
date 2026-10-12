const alwaysRequired = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CLIENT_URL',
];

const smtpRequired = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
];

const validateEnv = () => {
  const missing = alwaysRequired.filter((key) => !process.env[key]);

  // Only require SMTP vars when email sending is enabled
  const skipEmail = process.env.DEV_SKIP_EMAIL_VERIFY === 'true';
  if (!skipEmail) {
    smtpRequired.forEach((key) => {
      if (!process.env[key]) missing.push(key);
    });
  }

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables:\n  ${missing.join('\n  ')}`);
    console.error('Check your .env file against .env.example');
    process.exit(1);
  }

  if (skipEmail) {
    console.warn('⚠️  DEV_SKIP_EMAIL_VERIFY=true — email verification is disabled');
  }

  console.log('✅ Environment variables validated');
};

module.exports = validateEnv;
