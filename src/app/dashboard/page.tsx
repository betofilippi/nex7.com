'use client';

import Image from 'next/image';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardPage() {
  const { user, loading } = useRequireAuth();
  const { logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Welcome to your dashboard!</h2>
              
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Name:</span> {user?.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {user?.email}
                </div>
                {user?.picture && (
                  <div>
                    <span className="font-medium">Profile Picture:</span>
                    <Image 
                      src={user.picture} 
                      alt="Profile" 
                      width={80}
                      height={80}
                      className="mt-2 h-20 w-20 rounded-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}