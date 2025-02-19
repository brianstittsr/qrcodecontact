import neo4j, { Driver } from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI!;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || process.env.NEO4J_USER;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD!;

if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
  console.error('Neo4j Configuration:', {
    URI: NEO4J_URI ? '***' : 'undefined',
    USERNAME: NEO4J_USERNAME ? '***' : 'undefined',
    PASSWORD: NEO4J_PASSWORD ? '***' : 'undefined',
  });
  throw new Error('Neo4j environment variables are not set. Please check your .env.local file.');
}

let driverInstance: Driver | null = null;

export function getDriver(): Driver {
  if (!driverInstance) {
    driverInstance = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
    );
  }
  return driverInstance;
}

export async function initializeDatabase() {
  const driver = getDriver();
  const session = driver.session();
  try {
    // Create constraints for QRCodeUser
    await session.run(`
      CREATE CONSTRAINT qrcode_user_id IF NOT EXISTS
      FOR (u:QRCodeUser)
      REQUIRE u.id IS UNIQUE
    `);

    await session.run(`
      CREATE CONSTRAINT qrcode_user_username IF NOT EXISTS
      FOR (u:QRCodeUser)
      REQUIRE u.username IS UNIQUE
    `);

    await session.run(`
      CREATE CONSTRAINT qrcode_user_email IF NOT EXISTS
      FOR (u:QRCodeUser)
      REQUIRE u.email IS UNIQUE
    `);

    await session.run(`
      CREATE CONSTRAINT contact_id IF NOT EXISTS
      FOR (c:Contact)
      REQUIRE c.id IS UNIQUE
    `);

    // Create indexes
    await session.run(`
      CREATE INDEX contact_email IF NOT EXISTS
      FOR (c:Contact)
      ON (c.email)
    `);

  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await session.close();
  }
}

export async function createUserWithContact(userData: {
  username: string;
  email: string;
  password: string;
  role?: string;
  name?: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
}) {
  const driver = getDriver();
  const session = driver.session();
  try {
    // First check if user exists
    const existingUser = await session.run(`
      MATCH (u:QRCodeUser {email: $email})
      RETURN u
    `, { email: userData.email });

    if (existingUser.records.length > 0) {
      console.log(`User with email ${userData.email} already exists`);
      return existingUser.records[0].get('u').properties;
    }

    const result = await session.run(`
      CREATE (u:QRCodeUser {
        id: randomUUID(),
        username: $username,
        email: $email,
        password: $password,
        role: $role,
        createdAt: datetime()
      })
      CREATE (c:Contact {
        id: randomUUID(),
        name: $name,
        email: $email,
        phone: $phone,
        company: $company,
        title: $title,
        website: $website,
        createdAt: datetime()
      })
      CREATE (u)-[:HAS_CONTACT]->(c)
      RETURN u, c
    `, {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'user',
      name: userData.name || userData.username,
      phone: userData.phone || '',
      company: userData.company || '',
      title: userData.title || '',
      website: userData.website || ''
    });

    const user = result.records[0].get('u').properties;
    const contact = result.records[0].get('c').properties;
    return { user, contact };
  } finally {
    await session.close();
  }
}

export async function getUserContact(userId: string) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (u:QRCodeUser {id: $userId})-[:HAS_CONTACT]->(c:Contact)
      RETURN c
    `, { userId });

    return result.records[0]?.get('c').properties;
  } finally {
    await session.close();
  }
}

export async function updateUserContact(userId: string, contactData: {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
}) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (u:QRCodeUser {id: $userId})-[:HAS_CONTACT]->(c:Contact)
      SET c += $contactData
      RETURN c
    `, {
      userId,
      contactData: {
        ...contactData,
        updatedAt: neo4j.types.DateTime.fromStandardDate(new Date())
      }
    });

    return result.records[0]?.get('c').properties;
  } finally {
    await session.close();
  }
}


