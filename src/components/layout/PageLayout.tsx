
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageLayout({ children, className = '' }: PageLayoutProps) {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
    
    // Add page loaded class for animations
    const timer = setTimeout(() => {
      document.body.classList.add('page-loaded');
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.body.classList.remove('page-loaded');
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={`flex-grow pt-24 ${className}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
