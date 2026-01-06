'use client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children, requiredRole = 'main-admin' }) {
  const router = useRouter();
  const pathname = usePathname();

  // Mock user - AUTHENTICATION DISABLED FOR DEVELOPMENT
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <h1 className="text-2xl font-bold text-green-600 cursor-pointer hover:text-green-700">
                Green Saloon
              </h1>
            </Link>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {isMainAdmin ? 'Main Admin' : 'Salon Admin'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-green-50 text-green-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
