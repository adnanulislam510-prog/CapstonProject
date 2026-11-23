/**
 * =====================================================================
 * File: /backend/seed.js
 * Owner: Member 1 (feat/backend-core)
 * Description: Empty seed script ready for demo data
 * =====================================================================
 */

const db = require('./db/database');

/**
 * Populates initial demo restaurants, shelters, profiles, and batches
 */
async function seed() {
  console.log('--- Seeding Food Rescue Database (Ready for Demo Data) ---');
  // TODO: (Member 1) Add demo restaurants, shelters, shelter_profiles, and food_batches here
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed execution error:', err);
      process.exit(1);
    });
}

module.exports = { seed };
