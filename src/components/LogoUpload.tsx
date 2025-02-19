import { useState } from 'react';
import Image from 'next/image';

interface LogoUploadProps {
  onLogoChange: (logo: string) => void;
}

export default function LogoUpload({ onLogoChange }: LogoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewUrl(base64String);
        onLogoChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Company Logo</label>
      <div className="flex items-center space-x-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {previewUrl && (
          <div className="relative w-16 h-16">
            <Image
              src={previewUrl}
              alt="Company logo preview"
              fill
              className="object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
