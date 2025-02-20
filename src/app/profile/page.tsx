import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getDriver } from '@/lib/neo4j';
import ProfileForm from './profile-form';

interface Contact {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
  profileImage?: string;
  companyLogo?: string;
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/api/auth/signin');
  }

  // If no uniqueId, redirect to base profile page
  if (!session?.user?.uniqueId) {
    redirect('/profile');
  }

  const driver = getDriver();
  const dbSession = driver.session();

  try {
    const result = await dbSession.run(
      `
      MATCH (u:QRCodeUser {uniqueId: $uniqueId})
      RETURN u.firstName, u.lastName, u
      `,
      { uniqueId: session.user.uniqueId }
    );

    const userData = result.records[0]?.get('u')?.properties;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile Settings</h1>
              <ProfileForm initialData={userData} isOwner={true} />
            </div>
          </div>
        </div>
      </div>
    );
  } finally {
    await dbSession.close();
  }
}
