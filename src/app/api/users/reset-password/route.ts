import { NextResponse } from 'next/server';
import { getDriver } from '@/lib/neo4j';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const driver = getDriver();
    const session = driver.session();

    try {
      const result = await session.run(
        `
        MATCH (u:User {email: $email})
        SET u.password = $newPassword
        RETURN u
        `,
        { email, newPassword }
      );

      if (result.records.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ message: 'Password updated successfully' });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
