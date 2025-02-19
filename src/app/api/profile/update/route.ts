import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDriver } from '@/lib/neo4j';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Validate required fields
    if (!data.name || !data.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const driver = getDriver();
    const dbSession = driver.session();

    try {
      // First, check if user exists and get their uniqueId
      const userResult = await dbSession.run(
        `
        MATCH (u:QRCodeUser {email: $email})
        RETURN u.uniqueId as uniqueId
        `,
        { email: session.user.email }
      );

      let uniqueId = userResult.records[0]?.get('uniqueId');

      // If no uniqueId exists, create one
      if (!uniqueId) {
        const result = await dbSession.run(
          `
          CREATE (u:QRCodeUser {email: $email, uniqueId: apoc.create.uuid()})
          RETURN u.uniqueId as uniqueId
          `,
          { email: session.user.email }
        );
        uniqueId = result.records[0]?.get('uniqueId');
      }

      // Update user data
      const result = await dbSession.run(
        `
        MATCH (u:QRCodeUser {uniqueId: $uniqueId})
        SET u.name = $name,
            u.email = $email,
            u.phone = $phone,
            u.company = $company,
            u.title = $title,
            u.website = $website,
            u.profileImage = $profileImage,
            u.companyLogo = $companyLogo
        RETURN u.uniqueId as uniqueId
        `,
        {
          uniqueId,
          ...data
        }
      );

      if (!result.records[0]?.get('uniqueId')) {
        throw new Error('Failed to update profile');
      }

      return NextResponse.json({ uniqueId });
    } finally {
      await dbSession.close();
    }
  } catch (error) {
    console.error('Error in profile update:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
