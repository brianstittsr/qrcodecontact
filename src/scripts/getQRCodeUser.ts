import neo4j from 'neo4j-driver';
import * as dotenv from 'dotenv';

dotenv.config();

const driver = neo4j.driver(
  'neo4j+s://de2a40da.databases.neo4j.io:7687',
  neo4j.auth.basic(process.env.NEO4J_USERNAME || 'neo4j', process.env.NEO4J_PASSWORD || 'uoxoZqnGJf5ed0GLI0BehuNkiZnOEpH4q9_HsEXJDx8')
);

async function getQRCodeUser() {
  const session = driver.session();
  
  try {
    const result = await session.run('MATCH (u:QRCodeUser) RETURN u LIMIT 1');
    const user = result.records.map(record => record.get('u'));
    return user;
  } catch (error) {
    console.error('Error fetching QRCodeUser:', error);
  } finally {
    await session.close();
  }
}

getQRCodeUser().then(user => {
  console.log('Fetched QRCodeUser:', user);
}).catch(err => {
  console.error('Error:', err);
}).finally(() => {
  driver.close();
});
