'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import vCard from 'vcf';
import imageCompression from 'browser-image-compression';

interface QRCodeGeneratorProps {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  company?: string;
  title?: string;
  profileImage?: string;
}

export default function QRCodeGenerator({
  name,
  email,
  phone,
  website,
  company,
  title,
  profileImage,
}: QRCodeGeneratorProps) {
  const [vCardData, setVCardData] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [useSimpleVersion, setUseSimpleVersion] = useState<boolean>(false);

  const generateSimpleVCard = () => {
    const card = new vCard();
    card.add('n', name);
    card.add('fn', name);
    card.add('email', email);
    if (phone) card.add('tel', phone);
    if (website) card.add('url', website);
    if (company) card.add('org', company);
    if (title) card.add('title', title);
    
    const profileUrl = `${window.location.origin}/contact/${window.location.pathname.split('/')[2]}`;
    card.add('url', profileUrl, { type: 'PROFILE' });
    card.add('note', `View full profile with photo at: ${profileUrl}`);
    
    return card.toString('3.0');
  };

  useEffect(() => {
    const generateQRCode = async () => {
      setError(false);
      
      if (useSimpleVersion) {
        try {
          const simpleVCard = generateSimpleVCard();
          setVCardData(simpleVCard);
          return;
        } catch (err) {
          console.error('Error generating simple vCard:', err);
          setError(true);
          return;
        }
      }

      try {
        // Create vCard
        const card = new vCard();
        card.add('n', name);
        card.add('fn', name);
        card.add('email', email);
        if (phone) card.add('tel', phone);
        if (website) card.add('url', website);
        if (company) card.add('org', company);
        if (title) card.add('title', title);
        
        // Add profile image if available
        if (profileImage) {
          try {
            // Fetch the image
            const response = await fetch(profileImage);
            const blob = await response.blob();
            
            // First compression pass - extreme reduction
            const firstPassOptions = {
              maxSizeMB: 0.003, // 3KB
              maxWidthOrHeight: 50,
              useWebWorker: true,
              fileType: 'image/jpeg',
              initialQuality: 0.2
            };
            
            let compressedBlob = await imageCompression(blob, firstPassOptions);
            console.log('Original size:', (blob.size / 1024).toFixed(2), 'KB');
            console.log('First pass size:', (compressedBlob.size / 1024).toFixed(2), 'KB');

            // If still too large, do a second pass with maximum compression
            if (compressedBlob.size > 4096) { // If larger than 4KB
              const secondPassOptions = {
                maxSizeMB: 0.002, // 2KB
                maxWidthOrHeight: 40,
                useWebWorker: true,
                fileType: 'image/jpeg',
                initialQuality: 0.1
              };
              
              compressedBlob = await imageCompression(compressedBlob, secondPassOptions);
              console.log('Second pass size:', (compressedBlob.size / 1024).toFixed(2), 'KB');
            }

            // Convert to grayscale to further reduce size
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = URL.createObjectURL(compressedBlob);
            });

            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);

            // Convert to grayscale
            const canvasImageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
            if (canvasImageData) {
              const pixelData = canvasImageData.data;
              for (let i = 0; i < pixelData.length; i += 4) {
                const avg = (pixelData[i] + pixelData[i + 1] + pixelData[i + 2]) / 3;
                pixelData[i] = avg;
                pixelData[i + 1] = avg;
                pixelData[i + 2] = avg;
              }
              ctx?.putImageData(canvasImageData, 0, 0);
            }

            // Get final compressed grayscale image with extreme compression
            const finalBlob = await new Promise<Blob>((resolve) => {
              canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.1);
            });

            console.log('Final size:', (finalBlob.size / 1024).toFixed(2), 'KB');
            
            // Convert final compressed grayscale image to base64
            const reader = new FileReader();
            const base64Image = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(finalBlob);
            });

            const base64Data = (base64Image as string).split(',')[1];
            card.add('photo', base64Data, { encoding: 'b', type: 'JPEG' });
            console.log('Added photo to vCard');
          } catch (err) {
            console.error('Error processing image:', err);
            throw err;
          }
        }

        const vCardString = card.toString('3.0');
        console.log('vCard length:', vCardString.length);
        
        // Test if the data is too long by trying to create a QR code
        try {
          const testQR = new QRCodeSVG({ value: vCardString, size: 300 });
          setVCardData(vCardString);
        } catch (err) {
          console.log('Data too long, falling back to simple version');
          setUseSimpleVersion(true);
          const simpleVCard = generateSimpleVCard();
          setVCardData(simpleVCard);
        }
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQRCode();
  }, [name, email, phone, website, company, title, profileImage]);

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold">Scan to Add Contact</h3>
      {error ? (
        <div className="w-[300px] h-[300px] flex items-center justify-center bg-red-50 rounded-lg">
          <p className="text-red-500 text-center px-4">
            Error generating QR code. Please try again.
          </p>
        </div>
      ) : vCardData ? (
        <>
          <div className="p-4 bg-white rounded-lg">
            <QRCodeSVG
              value={vCardData}
              size={300}
              level="M"
              includeMargin={true}
            />
          </div>
          <p className="text-sm text-gray-600">
            {useSimpleVersion ? (
              'Scan to add basic contact info (view full profile for photo)'
            ) : (
              'Scan to add contact with photo'
            )}
          </p>
        </>
      ) : (
        <div className="w-[300px] h-[300px] flex items-center justify-center bg-gray-100 rounded-lg">
          <p className="text-gray-500">Generating QR Code...</p>
        </div>
      )}
    </div>
  );
}
