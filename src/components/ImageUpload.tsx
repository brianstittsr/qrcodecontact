'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  onImageChange: (imageDataUrl: string) => void;
  defaultImage: string;
  label: string;
  className?: string;
  isCircular?: boolean;
}

export default function ImageUpload({ onImageChange, defaultImage, label, className = '', isCircular = false }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(defaultImage);

  useEffect(() => {
    if (defaultImage !== previewUrl) {
      setPreviewUrl(defaultImage);
    }
  }, [defaultImage]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please upload an image smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      onImageChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative group cursor-pointer" onClick={handleClick}>
        <div className={`aspect-square w-full max-w-[200px] mx-auto overflow-hidden border-2 border-gray-300 hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md ${isCircular ? 'rounded-full' : 'rounded-lg'}`}>
          <Image
            src={previewUrl}
            alt={label}
            width={200}
            height={200}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
            <span className="text-white opacity-0 group-hover:opacity-100 transition-all duration-200 text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded-full">
              Change {label}
            </span>
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
