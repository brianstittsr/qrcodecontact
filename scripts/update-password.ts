import { hash } from 'bcryptjs';
import neo4j from 'neo4j-driver';

async function updateUserPassword() {
  const uri = 'neo4j+s://de2a40da.databases.neo4j.io:7687';
  
  // Please provide these values when running the script
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Please provide Neo4j username and password as arguments:');
    console.error('yarn dlx tsx scripts/update-password.ts <username> <password>');
    process.exit(1);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  const session = driver.session();

  try {
    // Hash the new password
    const hashedPassword = await hash('admin123', 12);

    // Update the user's password
    const result = await session.run(
      `
      MATCH (u:User {email: $email})
      SET u.password = $hashedPassword
      RETURN u
      `,
      {
        email: 'admin@example.com',
        hashedPassword
      }
    );

    if (result.records.length === 0) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('Password updated successfully');
  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

updateUserPassword();
