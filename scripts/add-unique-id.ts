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

const neo4jUri = envConfig.NEO4J_URI;
const neo4jUser = envConfig.NEO4J_USER || envConfig.NEO4J_USERNAME;
const neo4jPassword = envConfig.NEO4J_PASSWORD;

async function addUniqueIds() {
  if (!neo4jUri || !neo4jUser || !neo4jPassword) {
    throw new Error('Missing required Neo4j configuration from .env.local');
  }

  console.log('Connecting to Neo4j...');
  const driver = neo4j.driver(
    neo4jUri,
    neo4j.auth.basic(neo4jUser, neo4jPassword)
  );

  const session = driver.session();

  try {
    // Add uniqueId property and constraint
    await session.run(`
      CREATE CONSTRAINT unique_id IF NOT EXISTS
      FOR (u:QRCodeUser)
      REQUIRE u.uniqueId IS UNIQUE
    `);

    // Add uniqueId to users that don't have one
    const result = await session.run(`
      MATCH (u:QRCodeUser)
      WHERE u.uniqueId IS NULL
      SET u.uniqueId = apoc.create.uuid()
      RETURN count(u) as updatedUsers
    `);

    const updatedUsers = result.records[0].get('updatedUsers').toNumber();
    console.log(`Added unique IDs to ${updatedUsers} users`);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

addUniqueIds()
  .then(() => {
    console.log('Successfully added unique IDs');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to add unique IDs:', error);
    process.exit(1);
  });
