'use client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function AdminLayout({ children, requiredRole = 'main-admin' }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = {
    name: 'Main Administrator',
    email: 'admin@greensaloon.com',
    role: requiredRole
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    router.push('/login');
  };

  const isMainAdmin = requiredRole === 'main-admin';

  const mainAdminNav = [
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'All Salons', path: '/admin/salons', icon: '🏪' },
    { name: 'Pending Salons', path: '/admin/salons/pending', icon: '⏳' },
    { name: 'Users', path: '/admin/users', icon: '👥' },
    { name: 'Site Settings', path: '/admin/settings', icon: '⚙️' },
  ];

  const salonAdminNav = [
    { name: 'Dashboard', path: '/salon-admin', icon: '📊' },
    { name: 'Bookings', path: '/salon-admin/bookings', icon: '📅' },
    { name: 'Pending Bookings', path: '/salon-admin/bookings/pending', icon: '⏳' },
    { name: 'Staff', path: '/salon-admin/staff', icon: '👨‍💼' },
    { name: 'Services', path: '/salon-admin/services', icon: '✂️' },
    { name: 'Profile', path: '/salon-admin/profile', icon: '⚙️' },
  ];

  const navItems = isMainAdmin ? mainAdminNav : salonAdminNav;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link href="/">
              <h1 className="text-lg sm:text-2xl font-bold text-green-600 cursor-pointer hover:text-green-700">
                Green Saloon
              </h1>
            </Link>
            <span className="hidden xs:inline-block px-2 py-0.5 sm:px-3 sm:py-1 bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium rounded-full">
              {isMainAdmin ? 'Main Admin' : 'Salon Admin'}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-none">{user.name}</p>
              <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-none">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-xs sm:text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-0 sm:px-4 py-0 sm:py-6">
        <div className="flex gap-0 sm:gap-6">
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            fixed lg:static inset-y-0 left-0 z-40
            w-64 flex-shrink-0 bg-white lg:bg-transparent
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            lg:block
          `}>
            <nav className="bg-white rounded-none lg:rounded-lg shadow-sm p-4 sticky top-16 sm:top-24 h-[calc(100vh-4rem)] sm:h-auto overflow-y-auto">
              {/* Mobile Header */}
              <div className="lg:hidden flex items-center justify-between mb-4 pb-4 border-b">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  {isMainAdmin ? 'Main Admin' : 'Salon Admin'}
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm sm:text-base ${
                          isActive
                            ? 'bg-green-50 text-green-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg sm:text-xl">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
