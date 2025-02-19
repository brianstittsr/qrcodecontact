const neo4j = require('neo4j-driver');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Get absolute path to .env.local
const envPath = path.resolve(process.cwd(), '.env.local');

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  throw new Error(`.env.local file not found at ${envPath}`);
}

// Read .env.local file directly
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Force set environment variables
for (const key in envConfig) {
  process.env[key] = envConfig[key];
}

// Get Neo4j credentials directly from parsed config
const neo4jUri = envConfig.NEO4J_URI;
const neo4jUser = envConfig.NEO4J_USER || envConfig.NEO4J_USERNAME;
const neo4jPassword = envConfig.NEO4J_PASSWORD;

console.log('Environment file loaded from:', envPath);
console.log('Neo4j Configuration (credentials masked):', {
  URI: neo4jUri,
  USER: neo4jUser ? '***' : 'undefined',
  PASSWORD: neo4jPassword ? '***' : 'undefined'
});

async function migrateUsers() {
  if (!neo4jUri || !neo4jUser || !neo4jPassword) {
    throw new Error('Missing required Neo4j configuration from .env.local');
  }

  console.log('Attempting to connect to Neo4j...');
  const driver = neo4j.driver(
    neo4jUri,
    neo4j.auth.basic(neo4jUser, neo4jPassword)
  );

  const session = driver.session();

  try {
    // Create new label and copy users
    const result = await session.run(`
      MATCH (u:User)
      WHERE NOT u:QRCodeUser
      WITH u
      CREATE (q:QRCodeUser)
      SET q = u
      SET q.createdAt = CASE WHEN u.createdAt IS NULL THEN datetime() ELSE u.createdAt END,
          q.updatedAt = datetime()
      RETURN count(q) as migratedCount
    `);

    const migratedCount = result.records[0]?.get('migratedCount').toNumber() || 0;
    console.log(`Migrated ${migratedCount} users to QRCodeUser`);

    // Create constraints for the new label
    await session.run(`
      CREATE CONSTRAINT qrcode_users_email_unique IF NOT EXISTS
      FOR (u:QRCodeUser)
      REQUIRE u.email IS UNIQUE
    `);

    console.log('Created email uniqueness constraint for QRCodeUser');

    // Verify migration
    const verifyResult = await session.run(`
      MATCH (q:QRCodeUser)
      RETURN count(q) as totalCount
    `);

    const totalCount = verifyResult.records[0]?.get('totalCount').toNumber() || 0;
    console.log(`Total QRCodeUsers after migration: ${totalCount}`);

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

migrateUsers().catch(console.error);
