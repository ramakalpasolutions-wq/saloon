'use client';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  
  // Pages that should NOT have header/footer
  const noLayoutRoutes = [
    '/admin',
    '/login',
    '/register',
    '/dashboard',
    '/user/dashboard'
  ];

  // Check if current page should have layout
  const shouldShowLayout = !noLayoutRoutes.some(route => pathname.startsWith(route));

  if (shouldShowLayout) {
    return (
      <>
        <Header />
        <div className="min-h-screen">
          {children}
        </div>
        <Footer />
      </>
    );
  }

  // For admin/login/dashboard pages, render without header/footer
  return <>{children}</>;
}
