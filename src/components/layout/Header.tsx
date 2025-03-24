
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/components/ui/use-toast';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Jobs', href: '/jobs' },
  { name: 'Contact', href: '/contact' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      
      if (session?.user) {
        // Check if user is admin
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .single();
          
        setIsAdmin(!!data);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsAuthenticated(!!session);
        setUser(session?.user || null);
        
        if (session?.user) {
          // Check if user is admin
          const { data } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('role', 'admin')
            .single();
            
          setIsAdmin(!!data);
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully"
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        scrolled ? 'py-3 glass-background shadow-subtle' : 'py-5 bg-transparent'
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-display font-medium">CompanyPulse</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <ul className="flex space-x-8">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className={cn(
                      'text-sm font-medium transition-colors relative py-2',
                      'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full',
                      'after:origin-center after:scale-x-0 after:transition-transform after:duration-300',
                      'hover:text-primary',
                      location.pathname === link.href 
                        ? 'text-primary after:bg-primary after:scale-x-100' 
                        : 'after:bg-primary/80'
                    )}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              
              {isAdmin && (
                <>
                  <li>
                    <Link
                      to="/company"
                      className={cn(
                        'text-sm font-medium transition-colors relative py-2',
                        'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full',
                        'after:origin-center after:scale-x-0 after:transition-transform after:duration-300',
                        'hover:text-primary',
                        location.pathname === "/company" 
                          ? 'text-primary after:bg-primary after:scale-x-100' 
                          : 'after:bg-primary/80'
                      )}
                    >
                      Companies
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/employees"
                      className={cn(
                        'text-sm font-medium transition-colors relative py-2',
                        'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full',
                        'after:origin-center after:scale-x-0 after:transition-transform after:duration-300',
                        'hover:text-primary',
                        location.pathname === "/employees" 
                          ? 'text-primary after:bg-primary after:scale-x-100' 
                          : 'after:bg-primary/80'
                      )}
                    >
                      Employees
                    </Link>
                  </li>
                </>
              )}
            </ul>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/company">Company Management</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/employees">Employee Management</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link to="/auth">Log in</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth?tab=signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md -m-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden transition-opacity duration-300',
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="fixed inset-y-0 right-0 w-full max-w-sm glass-background shadow-elevated">
          <div className="flex flex-col h-full py-6 px-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-xl font-display font-medium">CompanyPulse</span>
              </Link>
              <button
                type="button"
                className="p-2 rounded-md -m-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flex flex-col space-y-6">
              <ul className="space-y-4">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className={cn(
                        'block text-base font-medium py-2',
                        location.pathname === link.href ? 'text-primary' : ''
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
                
                {isAdmin && (
                  <>
                    <li>
                      <Link
                        to="/company"
                        className={cn(
                          'block text-base font-medium py-2',
                          location.pathname === "/company" ? 'text-primary' : ''
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Companies
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/employees"
                        className={cn(
                          'block text-base font-medium py-2',
                          location.pathname === "/employees" ? 'text-primary' : ''
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Employees
                      </Link>
                    </li>
                  </>
                )}
              </ul>
              <div className="flex flex-col space-y-4 pt-6 border-t">
                {isAuthenticated ? (
                  <Button onClick={handleSignOut} variant="outline" className="flex justify-center items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" asChild>
                      <Link to="/auth">Log in</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/auth?tab=signup">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
