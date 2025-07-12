'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="relative place-items-center">
        <h1 className="text-6xl font-bold text-center mb-8">
          Welcome to NEX7
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-300 mb-8">
          Built with Next.js 15, TypeScript, and Tailwind CSS
        </p>
        
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : user ? (
          <div className="text-center">
            <p className="mb-4">Welcome back, {user.name}!</p>
            <div className="flex gap-4 items-center justify-center">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 items-center justify-center">
            <Link
              href="/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}