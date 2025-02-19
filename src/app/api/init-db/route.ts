import { NextResponse } from 'next/server';
import { initializeDatabase, createUserWithContact } from '@/lib/neo4j';

export async function POST() {
  try {
    console.log('Starting database initialization...');
    // Initialize database schema
    await initializeDatabase();
    console.log('Database schema initialized successfully');

    console.log('Creating admin user...');
    // Create admin user if it doesn't exist
    await createUserWithContact({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123', // In production, use proper password hashing
      role: 'admin',
      name: 'Admin User',
      phone: '+1234567890',
      company: 'QR Contact Card',
      title: 'Administrator',
      website: 'https://example.com'
    });

    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}
