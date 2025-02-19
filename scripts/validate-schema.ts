const neo4j = require('neo4j-driver');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function validateSchema() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
  );

  const session = driver.session();

  try {
    // Get current schema
    const result = await session.run(`
      CALL apoc.meta.data()
      YIELD label, property
      WHERE label = 'User'
      RETURN label, collect(property) as properties
    `);

    const currentProperties = result.records[0]?.get('properties') || [];
    console.log('Current User properties:', currentProperties);

    // Define required properties
    const requiredProperties = [
      'name',
      'email',
      'phone',
      'company',
      'title',
      'website',
      'profileImage',
      'companyLogo'
    ];

    // Check which properties are missing
    const missingProperties = requiredProperties.filter(
      prop => !currentProperties.includes(prop)
    );

    if (missingProperties.length > 0) {
      console.log('Adding missing properties:', missingProperties);

      // Create properties with appropriate constraints
      for (const prop of missingProperties) {
        await session.run(`
          MATCH (u:User)
          SET u.${prop} = ''
        `);
      }

      console.log('Schema updated successfully!');
    } else {
      console.log('All required properties exist in the schema!');
    }

    // Verify final schema
    const finalResult = await session.run(`
      CALL apoc.meta.data()
      YIELD label, property
      WHERE label = 'User'
      RETURN label, collect(property) as properties
    `);

    console.log('Updated User properties:', finalResult.records[0]?.get('properties'));

  } catch (error) {
    console.error('Error validating/updating schema:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

validateSchema().catch(console.error);
