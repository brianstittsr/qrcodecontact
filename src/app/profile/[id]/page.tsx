import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getDriver } from '@/lib/neo4j';
import ProfileForm from '../profile-form';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import Link from 'next/link';

interface ProfilePageProps {
  params: {
    id: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/api/auth/signin');
  }

  const driver = getDriver();
  const dbSession = driver.session();

  try {
    const result = await dbSession.run(
      `
      MATCH (u:QRCodeUser {uniqueId: $uniqueId})
      RETURN u.firstName, u.lastName, u, u.email = $userEmail as isOwner
      `,
      { 
        uniqueId: params.id,
        userEmail: session.user.email 
      }
    );

    if (result.records.length === 0) {
      redirect('/profile');
    }

    const userData = result.records[0]?.get('u')?.properties;
    const isOwner = result.records[0]?.get('isOwner');

    if (!isOwner) {
      redirect('/profile');
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-semibold text-gray-900">Profile Settings</h1>
                  <Link
                    href={`/contact/${params.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    View Contact Card
                  </Link>
                </div>
                <ProfileForm initialData={userData} isOwner={isOwner} />
              </div>
            </div>
            <div className="flex justify-center">
              <QRCodeGenerator
                name={userData.name}
                email={userData.email}
                phone={userData.phone}
                website={userData.website}
                company={userData.company}
                title={userData.title}
                profileImage={userData.profileImage}
              />
            </div>
          </div>
        </div>
      </div>
    );
  } finally {
    await dbSession.close();
  }
}
