'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import ImageUpload from '@/components/ImageUpload';
import { defaultProfileImage, defaultCompanyLogo } from '@/utils/defaultImages';

export default function GenerateQRPage() {
  const { data: session } = useSession();
  const [profileImage, setProfileImage] = useState(defaultProfileImage);
  const [companyLogo, setCompanyLogo] = useState(defaultCompanyLogo);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    website: '',
  });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setQrCode(null); // Clear existing QR code

    try {
      // Validate required fields
      if (!formData.name || !formData.email) {
        throw new Error('Name and email are required');
      }

      // Send data as JSON
      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          profileImage,
          companyLogo
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server did not return JSON');
      }

      const data = await response.json();
      
      if (data.qrCode && typeof data.qrCode === 'string' && data.qrCode.startsWith('data:image/')) {
        setQrCode(data.qrCode);
        // Scroll to QR code section
        const qrSection = document.getElementById('qr-section');
        if (qrSection) {
          qrSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        throw new Error('Invalid QR code data received');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCode) return;

    try {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `qr-contact-card-${formData.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Please sign in to generate QR codes.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Generate QR Contact Card</h1>
      
      <div className="space-y-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="my-8">
            <h2 className="text-xl font-semibold mb-4">Images</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col items-center">
                <ImageUpload
                  label="Profile Photo"
                  defaultImage={defaultProfileImage}
                  onImageChange={setProfileImage}
                  className="bg-gray-50 p-4 rounded-lg"
                  isCircular={true}
                />
                <p className="text-sm text-gray-500 mt-2">Upload a profile picture</p>
              </div>
              <div className="flex flex-col items-center">
                <ImageUpload
                  label="Company Logo"
                  defaultImage={defaultCompanyLogo}
                  onImageChange={setCompanyLogo}
                  className="bg-gray-50 p-4 rounded-lg"
                  isCircular={false}
                />
                <p className="text-sm text-gray-500 mt-2">Upload your company logo</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate QR Code'}
          </button>
        </form>

        {qrCode && (
          <div id="qr-section" className="mt-8 bg-white p-6 rounded-lg shadow-md space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold">Your QR Code</h2>
            <div className="flex flex-col items-center gap-6">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-64 h-64 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download QR Code
                </button>
                <a
                  href={qrCode}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v4.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 7.586V3a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  View Full Size
                </a>
              </div>
            </div>
          </div>
        )}
        {qrCode && (
          <div className="mt-8 flex flex-col items-center">
            <div className="relative w-64 h-64">
              <img
                src={qrCode}
                alt="Generated QR Code"
                className="w-full h-full"
              />
            </div>
            <button
              onClick={handleDownload}
              className="mt-4 w-full sm:w-auto py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download QR Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
