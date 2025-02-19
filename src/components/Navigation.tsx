'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          QR Contact Card
        </Link>
        <div className="space-x-4">
          <Link href="/" className="hover:text-gray-300">
            Home
          </Link>
          {session ? (
            <>
              <Link href="/profile" className="hover:text-gray-300">
                Profile
              </Link>
              {session.user?.role === 'admin' && (
                <Link href="/admin" className="hover:text-gray-300">
                  Admin
                </Link>
              )}
              <Link href="/api/auth/signout" className="hover:text-gray-300">
                Sign Out
              </Link>
            </>
          ) : (
            <Link href="/api/auth/signin" className="hover:text-gray-300">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
