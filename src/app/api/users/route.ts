import { NextResponse } from 'next/server';
import { createUserWithContact } from '@/lib/neo4j';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, role, name, phone, company, title, website } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createUserWithContact({
      username,
      email,
      password,
      role,
      name,
      phone,
      company,
      title,
      website,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
