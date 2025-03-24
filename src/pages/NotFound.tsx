
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/layout/PageLayout';

export default function NotFound() {
  return (
    <PageLayout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-6xl md:text-8xl font-display font-medium mb-6 page-transition-element">404</h1>
        <h2 className="text-2xl md:text-3xl font-medium mb-6 page-transition-element delay-100">Page Not Found</h2>
        <p className="text-lg text-muted-foreground max-w-md mb-8 page-transition-element delay-200">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="page-transition-element delay-300">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </PageLayout>
  );
}
