require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db/database');

const DEMO_PASSWORD = 'password123';

const SEED_ACCOUNTS = [
  {
    name: "Tanvir's Restaurant",
    email: 'tanvir@dhaka.com',
    role: 'RESTAURANT',
    phone: '+8801711000101',
    address: 'Dhanmondi, Dhaka',
    default_pickup_point: 'Back gate',
    closing_cutoff_time: '23:30',
  },
  {
    name: 'Dhanmondi Van Shelter',
    email: 'van@shelter.com',
    role: 'SHELTER',
    phone: '+8801711000201',
    address: 'Road 9/A, Dhanmondi, Dhaka',
    default_pickup_point: 'Main gate',
    closing_cutoff_time: '23:59',
    shelter_profile: {
      has_van: 1,
      max_portions: 200,
      cutoff_time: '23:59',
      reliability_score: 4.9,
      no_show_count: 0,
    },
  },
  {
    name: 'Early Cutoff Kitchen',
    email: 'early@shelter.com',
    role: 'SHELTER',
    phone: '+8801711000202',
    address: 'Satmasjid Road, Dhanmondi, Dhaka',
    default_pickup_point: 'Front gate',
    closing_cutoff_time: '22:00',
    shelter_profile: {
      has_van: 0,
      max_portions: 100,
      cutoff_time: '22:00',
      reliability_score: 4.7,
      no_show_count: 0,
    },
  },
  {
    name: 'Small Rickshaw Shelter',
    email: 'small@shelter.com',
    role: 'SHELTER',
    phone: '+8801711000203',
    address: 'Green Road, Dhanmondi, Dhaka',
    default_pickup_point: 'Side gate',
    closing_cutoff_time: '23:59',
    shelter_profile: {
      has_van: 0,
      max_portions: 50,
      cutoff_time: '23:59',
      reliability_score: 4.5,
      no_show_count: 0,
    },
  },
];

/**
 * Idempotently populates demo restaurant & shelter accounts for Dhanmondi testing.
 * Safe to invoke repeatedly (`node backend/seed.js` or `npm run seed`).
 */
async function seedDatabase() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const runSeed = db.transaction(() => {
    const upsertUser = db.prepare(`
      INSERT INTO users (
        name, email, password_hash, role, phone, address,
        default_pickup_point, closing_cutoff_time
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        password_hash = excluded.password_hash,
        role = excluded.role,
        phone = excluded.phone,
        address = excluded.address,
        default_pickup_point = excluded.default_pickup_point,
        closing_cutoff_time = excluded.closing_cutoff_time
      RETURNING id
    `);

    const upsertShelterProfile = db.prepare(`
      INSERT INTO shelter_profiles (
        user_id, has_van, max_portions, cutoff_time, reliability_score, no_show_count
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        has_van = excluded.has_van,
        max_portions = excluded.max_portions,
        cutoff_time = excluded.cutoff_time,
        reliability_score = excluded.reliability_score,
        no_show_count = excluded.no_show_count,
        updated_at = datetime('now')
    `);

    const results = [];

    for (const account of SEED_ACCOUNTS) {
      const userRow = upsertUser.get(
        account.name,
        account.email,
        passwordHash,
        account.role,
        account.phone,
        account.address,
        account.default_pickup_point,
        account.closing_cutoff_time
      );

      if (account.role === 'SHELTER' && account.shelter_profile) {
        const sp = account.shelter_profile;
        upsertShelterProfile.run(
          userRow.id,
          sp.has_van,
          sp.max_portions,
          sp.cutoff_time,
          sp.reliability_score,
          sp.no_show_count
        );
      }

      results.push({
        id: userRow.id,
        email: account.email,
        role: account.role,
        name: account.name,
      });
    }

    return results;
  });

  return runSeed();
}

if (require.main === module) {
  seedDatabase()
    .then((seeded) => {
      console.log(`Seeded ${seeded.length} demo accounts (password: "${DEMO_PASSWORD}"):`);
      for (const acc of seeded) {
        console.log(`  - [${acc.role}] ${acc.name} (${acc.email}) [id=${acc.id}]`);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to seed database:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase, SEED_ACCOUNTS };
