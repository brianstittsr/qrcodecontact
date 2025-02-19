import neo4j from 'neo4j-driver';

async function updateSchema() {
  const uri = 'neo4j+s://de2a40da.databases.neo4j.io:7687';
  
  // Get credentials from command line arguments
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Please provide Neo4j username and password as arguments:');
    console.error('yarn dlx tsx scripts/update-schema.ts <username> <password>');
    process.exit(1);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  const session = driver.session();

  try {
    // Add profileImage and companyLogo fields to User nodes
    const result = await session.run(`
      MATCH (u:User)
      WHERE u.profileImage IS NULL OR u.companyLogo IS NULL
      SET u.profileImage = CASE WHEN u.profileImage IS NULL THEN '' ELSE u.profileImage END,
          u.companyLogo = CASE WHEN u.companyLogo IS NULL THEN '' ELSE u.companyLogo END
      RETURN count(u) as updatedUsers
    `);

    console.log(`Updated ${result.records[0].get('updatedUsers')} users with new image fields`);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

updateSchema();
