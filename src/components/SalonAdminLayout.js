'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SalonAdminLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // ✅ Check auth using your existing /api/auth/me endpoint
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!response.ok || !data.user) {
        router.push('/login');
        return;
      }

      // Check if user is salon-admin
      if (data.user.role !== 'salon-admin') {
        router.push('/login');
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 overflow-y-auto z-40">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-green-600">💈 Salon Admin</h2>
          {user && (
            <p className="text-sm text-gray-600 mt-2">
              {user.email || user.name}
            </p>
          )}
        </div>
        
        <nav className="px-4 py-4 space-y-1">
          <Link 
            href="/salon-admin" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 hover:text-green-700 font-medium text-gray-700 transition-colors"
          >
            <span className="text-xl">📊</span>
            <span>Dashboard</span>
          </Link>
          
          <Link 
            href="/salon-admin/queue" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 hover:text-green-700 font-medium text-gray-700 transition-colors"
          >
            <span className="text-xl">👥</span>
            <span>Queue Management</span>
          </Link>
          
          <Link 
            href="/salon-admin/services" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 hover:text-green-700 font-medium text-gray-700 transition-colors"
          >
            <span className="text-xl">✂️</span>
            <span>Services</span>
          </Link>
          
          <Link 
            href="/salon-admin/staff" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 hover:text-green-700 font-medium text-gray-700 transition-colors"
          >
            <span className="text-xl">👨‍💼</span>
            <span>Staff</span>
          </Link>
          
          <Link 
            href="/salon-admin/settings" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 hover:text-green-700 font-medium text-gray-700 transition-colors"
          >
            <span className="text-xl">⚙️</span>
            <span>Settings</span>
          </Link>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-red-50 hover:text-red-700 font-medium text-gray-700 transition-colors"
            >
              <span className="text-xl">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
