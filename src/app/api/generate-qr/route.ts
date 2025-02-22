import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDriver } from '@/lib/neo4j';

interface VCardData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
  profileImage?: string;
  companyLogo?: string;
}

function generateVCard(data: VCardData) {
  const { name, email, phone, company, title, website, profileImage, companyLogo } = data;
  let vCard = 'BEGIN:VCARD\nVERSION:3.0\n';

  if (name) vCard += `FN:${name}\n`;
  if (email) vCard += `EMAIL:${email}\n`;
  if (phone) vCard += `TEL:${phone}\n`;
  if (company) vCard += `ORG:${company}\n`;
  if (title) vCard += `TITLE:${title}\n`;
  if (website) vCard += `URL:${website}\n`;

  // Add profile photo if provided
  if (profileImage && profileImage !== 'undefined') {
    vCard += `PHOTO;ENCODING=b;TYPE=JPEG:${profileImage.split(',')[1]}\n`;
  }

  // Add company logo if provided
  if (companyLogo && companyLogo !== 'undefined') {
    vCard += `LOGO;ENCODING=b;TYPE=JPEG:${companyLogo.split(',')[1]}\n`;
  }

  vCard += 'END:VCARD';
  return vCard;
}

export async function POST(req: NextRequest) {
  try {
    console.log('Starting QR code generation...');

    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request data
    let data: VCardData;
    try {
      const contentType = req.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error('Invalid content type:', contentType);
        return NextResponse.json(
          { error: 'Invalid content type. Expected application/json' },
          { status: 400 }
        );
      }

      const rawData = await req.json();
      console.log('Received raw data:', rawData);

      // Validate required fields
      if (!rawData.name || !rawData.email) {
        console.error('Missing required fields:', { name: rawData.name, email: rawData.email });
        return NextResponse.json(
          { error: 'Name and email are required' },
          { status: 400 }
        );
      }

      // Validate and process images
      let processedProfileImage = '';
      let processedCompanyLogo = '';

      if (rawData.profileImage && typeof rawData.profileImage === 'string') {
        if (!rawData.profileImage.startsWith('data:image/')) {
          console.error('Invalid profile image format');
          return NextResponse.json(
            { error: 'Invalid profile image format' },
            { status: 400 }
          );
        }
        processedProfileImage = rawData.profileImage;
      }

      if (rawData.companyLogo && typeof rawData.companyLogo === 'string') {
        if (!rawData.companyLogo.startsWith('data:image/')) {
          console.error('Invalid company logo format');
          return NextResponse.json(
            { error: 'Invalid company logo format' },
            { status: 400 }
          );
        }
        processedCompanyLogo = rawData.companyLogo;
      }

      // Type-safe data assignment
      data = {
        name: rawData.name,
        email: rawData.email,
        phone: rawData.phone,
        company: rawData.company,
        title: rawData.title,
        website: rawData.website,
        profileImage: processedProfileImage,
        companyLogo: processedCompanyLogo
      };

      // Update user in Neo4j with image data
      const driver = getDriver();
      const dbSession = driver.session();

      try {
        const result = await dbSession.run(
          `
          MATCH (u:QRCodeUser {email: $email})
          SET u.profileImage = $profileImage,
              u.companyLogo = $companyLogo,
              u.name = $name,
              u.phone = $phone,
              u.company = $company,
              u.title = $title,
              u.website = $website
          RETURN u.uniqueId as uniqueId
          `,
          {
            email: session?.user?.email,
            profileImage: processedProfileImage,
            companyLogo: processedCompanyLogo,
            name: data.name,
            phone: data.phone,
            company: data.company,
            title: data.title,
            website: data.website
          }
        );

        if (!result.records[0]?.get('uniqueId')) {
          throw new Error('Failed to get user uniqueId');
        }
      } finally {
        await dbSession.close();
        await driver.close();
      }
    } catch (error) {
      console.error('Error parsing request data:', error);
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Generate contact URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`;
    const contactUrl = `${baseUrl}/contact/`;
    console.log('Generated contact URL:', contactUrl);

    try {
      // Generate QR code with better options
      const vCard = generateVCard(data);
      const qrPng = qr.imageSync(vCard, {
        type: 'png',
        size: 10,  // Module size (pixels per module)
        margin: 2,  // Margin size in modules
        ec_level: 'Q'  // Error correction level (L:7%, M:15%, Q:25%, H:30%)
      });
      
      if (!qrPng || qrPng.length === 0) {
        throw new Error('QR code generation failed - empty output');
      }

      // Convert to base64
      const qrBase64 = Buffer.from(qrPng).toString('base64');
      const qrDataUrl = `data:image/png;base64,${qrBase64}`;

      console.log('QR code generated successfully');
      
      return new NextResponse(
        JSON.stringify({ qrCode: qrDataUrl }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          },
        }
      );
    } catch (qrError) {
      console.error('Error generating QR code:', qrError);
      return NextResponse.json(
        { error: 'Failed to generate QR code. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in QR code generation endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
