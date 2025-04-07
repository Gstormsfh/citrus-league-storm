
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { cn } from '@/lib/utils';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-background/95 backdrop-blur-sm shadow-md py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">CS</span>
          </div>
          <span className="font-display font-bold text-xl">CitrusSports</span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent hover:bg-primary/10 focus:bg-primary/10">My Team</NavigationMenuTrigger>
              <NavigationMenuContent className="bg-background/95 backdrop-blur-sm border border-border">
                <div className="grid gap-3 p-4 w-[200px]">
                  <Link to="/roster" className="block p-2 hover:bg-primary/10 rounded-md">
                    Roster
                  </Link>
                  <Link to="/gm-office" className="block p-2 hover:bg-primary/10 rounded-md">
                    GM's Office
                  </Link>
                  <Link to="/team-settings" className="block p-2 hover:bg-primary/10 rounded-md">
                    Team Settings
                  </Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent hover:bg-primary/10 focus:bg-primary/10">League</NavigationMenuTrigger>
              <NavigationMenuContent className="bg-background/95 backdrop-blur-sm border border-border">
                <div className="grid gap-3 p-4 w-[200px]">
                  <Link to="/matchup" className="block p-2 hover:bg-primary/10 rounded-md">
                    Matchup
                  </Link>
                  <Link to="/standings" className="block p-2 hover:bg-primary/10 rounded-md">
                    Standings
                  </Link>
                  <Link to="/free-agents" className="block p-2 hover:bg-primary/10 rounded-md">
                    Free Agents
                  </Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent hover:bg-primary/10 focus:bg-primary/10">Resources</NavigationMenuTrigger>
              <NavigationMenuContent className="bg-background/95 backdrop-blur-sm border border-border">
                <div className="grid gap-3 p-4 w-[200px]">
                  <Link to="/blog" className="block p-2 hover:bg-primary/10 rounded-md">
                    Blog
                  </Link>
                  <Link to="/podcasts" className="block p-2 hover:bg-primary/10 rounded-md">
                    Podcasts
                  </Link>
                  <Link to="/guides" className="block p-2 hover:bg-primary/10 rounded-md">
                    Strategy Guides
                  </Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/contact" legacyBehavior passHref>
                <NavigationMenuLink className={cn(
                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
                )}>
                  Contact
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="hidden lg:flex items-center space-x-4">
          <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10">Log in</Button>
          <Button className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">Sign up free</Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background/95 backdrop-blur-sm border-t border-border animate-slide-down">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-3">
            <MobileNavSection title="My Team">
              <Link to="/roster" className="block py-1" onClick={closeMobileMenu}>Roster</Link>
              <Link to="/gm-office" className="block py-1" onClick={closeMobileMenu}>GM's Office</Link>
              <Link to="/team-settings" className="block py-1" onClick={closeMobileMenu}>Team Settings</Link>
            </MobileNavSection>
            
            <MobileNavSection title="League">
              <Link to="/matchup" className="block py-1" onClick={closeMobileMenu}>Matchup</Link>
              <Link to="/standings" className="block py-1" onClick={closeMobileMenu}>Standings</Link>
              <Link to="/free-agents" className="block py-1" onClick={closeMobileMenu}>Free Agents</Link>
            </MobileNavSection>
            
            <MobileNavSection title="Resources">
              <Link to="/blog" className="block py-1" onClick={closeMobileMenu}>Blog</Link>
              <Link to="/podcasts" className="block py-1" onClick={closeMobileMenu}>Podcasts</Link>
              <Link to="/guides" className="block py-1" onClick={closeMobileMenu}>Strategy Guides</Link>
            </MobileNavSection>
            
            <Link to="/contact" className="py-2 border-b border-border" onClick={closeMobileMenu}>Contact</Link>
            
            <div className="flex flex-col space-y-2 pt-2">
              <Button variant="outline" className="w-full rounded-full border-primary text-primary">Log in</Button>
              <Button className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90">Sign up free</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

// Helper component for mobile navigation sections
const MobileNavSection = ({ title, children }: { title: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-border pb-2">
      <button 
        className="w-full text-left py-2 flex justify-between items-center" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 transition-transform ${isOpen ? "transform rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className="pl-4 py-2 space-y-2 bg-muted/30 rounded-md my-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default Navbar;
