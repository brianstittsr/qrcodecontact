'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import { defaultProfileImage, defaultCompanyLogo } from '@/utils/defaultImages';

interface ProfileFormProps {
  initialData?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
    website?: string;
    profileImage?: string;
    companyLogo?: string;
    uniqueId?: string;
  };
  isOwner?: boolean;
}

export default function ProfileForm({ initialData, isOwner }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(initialData?.profileImage || defaultProfileImage);
  const [companyLogo, setCompanyLogo] = useState(initialData?.companyLogo || defaultCompanyLogo);
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email: formData.get('email')?.toString() || '',
        phone: formData.get('phone')?.toString() || '',
        company: formData.get('company')?.toString() || '',
        title: formData.get('title')?.toString() || '',
        website: formData.get('website')?.toString() || '',
        profileImage,
        companyLogo,
      };

      const response = await fetch(isOwner ? '/api/profile/update' : '/api/profile/update-other', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const { uniqueId } = await response.json();
      router.refresh();
      router.push(`/profile/${uniqueId}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Required Fields Section */}
      <div className="bg-white rounded-lg">
        <div className="grid grid-cols-1 gap-6">
          <div className="mb-4">
            <label className="block text-gray-700">First Name</label>
            <input 
              type="text" 
              name="firstName" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Last Name</label>
            <input 
              type="text" 
              name="lastName" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              defaultValue={initialData?.email}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              defaultValue={initialData?.phone}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Optional Fields Section */}
      <div className="bg-white rounded-lg">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
              Company (Optional)
            </label>
            <input
              type="text"
              name="company"
              id="company"
              defaultValue={initialData?.company}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Job Title (Optional)
            </label>
            <input
              type="text"
              name="title"
              id="title"
              defaultValue={initialData?.title}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">
              Website (Optional)
            </label>
            <input
              type="url"
              name="website"
              id="website"
              defaultValue={initialData?.website}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="https://"
            />
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="bg-white rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Images</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col items-center">
            <ImageUpload
              label="Profile Photo"
              defaultImage={profileImage}
              onImageChange={setProfileImage}
              className="bg-gray-50 p-4 rounded-lg"
              isCircular={true}
            />
            <p className="text-sm text-gray-500 mt-2">Upload a profile picture</p>
          </div>
          <div className="flex flex-col items-center">
            <ImageUpload
              label="Company Logo"
              defaultImage={companyLogo}
              onImageChange={setCompanyLogo}
              className="bg-gray-50 p-4 rounded-lg"
              isCircular={false}
            />
            <p className="text-sm text-gray-500 mt-2">Upload your company logo</p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
