/**
 * DekhLaw — Seed Script
 * Run ONCE to create the first admin account.
 *
 * Usage:
 *   node utils/seed.js
 *
 * Set ADMIN_EMAIL and ADMIN_PASSWORD env vars or edit below.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db     = require('../config/db');

async function seed() {
  await db.connect();

  const email    = process.env.ADMIN_EMAIL    || 'admin@dekhlaw.com';
  const password = process.env.ADMIN_PASSWORD || 'DekhLaw@2026!';
  const name     = process.env.ADMIN_NAME     || 'DekhLaw Admin';

  const hash = await bcrypt.hash(password, 12);

  try {
    db.run(
      'INSERT INTO admins (email, password_hash, name) VALUES (?, ?, ?)',
      [email, hash, name]
    );
    console.log(`\n✅ Admin created:`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n⚠️  Change this password immediately after first login!\n`);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      console.log('ℹ️  Admin already exists. Skipping.');
    } else {
      throw err;
    }
  }

  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
