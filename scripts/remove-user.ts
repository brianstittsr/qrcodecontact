import neo4j from 'neo4j-driver';

async function removeUser() {
  const uri = 'neo4j+s://de2a40da.databases.neo4j.io:7687';
  
  // Get credentials from command line arguments
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Please provide Neo4j username and password as arguments:');
    console.error('yarn dlx tsx scripts/remove-user.ts <username> <password>');
    process.exit(1);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  const session = driver.session();

  try {
    // First check if the user exists
    const checkResult = await session.run(
      `
      MATCH (u:User {email: $email})
      RETURN u
      `,
      { email: 'admin@example.com' }
    );

    if (checkResult.records.length === 0) {
      console.error('User admin@example.com not found in the database');
      process.exit(1);
    }

    // Remove the user and all their relationships
    const result = await session.run(
      `
      MATCH (u:User {email: $email})
      OPTIONAL MATCH (u)-[r]-()
      DELETE r, u
      `,
      { email: 'admin@example.com' }
    );

    console.log('User admin@example.com has been successfully removed from the database');
  } catch (error) {
    console.error('Error removing user:', error);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

removeUser();
