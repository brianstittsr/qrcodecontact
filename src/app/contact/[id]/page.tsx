import { getDriver } from '@/lib/neo4j';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';

interface ContactPageProps {
  params: {
    id: string;
  };
}

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

export default async function ContactPage({ params }: ContactPageProps) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  const driver = getDriver();
  const dbSession = driver.session();

  try {
    const result = await dbSession.run(
      `
      MATCH (u:QRCodeUser {uniqueId: $uniqueId})
      RETURN u, u.email = $userEmail as isOwner
      `,
      { uniqueId: params.id, userEmail }
    );

    if (result.records.length === 0) {
      notFound();
    }

    const user = result.records[0].get('u').properties as Contact;
    const isOwner = result.records[0].get('isOwner');

    // Generate vCard data
    const vCardData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${user.name}`,
      `EMAIL:${user.email}`,
      user.phone ? `TEL:${user.phone}` : '',
      user.company ? `ORG:${user.company}` : '',
      user.title ? `TITLE:${user.title}` : '',
      user.website ? `URL:${user.website}` : '',
      'END:VCARD'
    ].filter(Boolean).join('\n');

    // Encode vCard data for download
    const vCardBlob = Buffer.from(vCardData, 'utf-8').toString('base64');

    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            {/* Profile Header */}
            <div className="text-center mb-6">
              {user.profileImage && (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-gray-200"
                />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              {user.title && (
                <p className="text-gray-600">{user.title}</p>
              )}
            </div>

            {/* Company Info */}
            {(user.company || user.companyLogo) && (
              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex items-center justify-center">
                  {user.companyLogo && (
                    <img
                      src={user.companyLogo}
                      alt={user.company || 'Company logo'}
                      className="h-12 object-contain mr-2"
                    />
                  )}
                  {user.company && (
                    <span className="text-lg text-gray-700">{user.company}</span>
                  )}
                </div>
              </div>
            )}

            {/* Contact Details */}
            <div className="space-y-3 mt-6">
              <a
                href={`mailto:${user.email}`}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Email
              </a>
              {user.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Call
                </a>
              )}
              {user.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Website
                </a>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {isOwner && (
                <Link
                  href="/profile"
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Contact Card
                </Link>
              )}
              <a
                href={`data:text/vcard;base64,${vCardBlob}`}
                download={`${user.name.replace(/\s+/g, '_')}.vcf`}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add to Contacts
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  } finally {
    await dbSession.close();
  }
}
