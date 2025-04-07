
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

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
        <nav className="hidden lg:flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="nav-button">
                My Team <ChevronDown size={16} className="ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <Link to="/roster">
                <DropdownMenuItem className="cursor-pointer">Roster</DropdownMenuItem>
              </Link>
              <Link to="/gm-office">
                <DropdownMenuItem className="cursor-pointer">GM's Office</DropdownMenuItem>
              </Link>
              <Link to="/team-settings">
                <DropdownMenuItem className="cursor-pointer">Team Settings</DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="nav-button">
                League <ChevronDown size={16} className="ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <Link to="/matchup">
                <DropdownMenuItem className="cursor-pointer">Matchup</DropdownMenuItem>
              </Link>
              <Link to="/standings">
                <DropdownMenuItem className="cursor-pointer">Standings</DropdownMenuItem>
              </Link>
              <Link to="/free-agents">
                <DropdownMenuItem className="cursor-pointer">Free Agents</DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="nav-button">
                Resources <ChevronDown size={16} className="ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <Link to="/blog">
                <DropdownMenuItem className="cursor-pointer">Blog</DropdownMenuItem>
              </Link>
              <Link to="/podcasts">
                <DropdownMenuItem className="cursor-pointer">Podcasts</DropdownMenuItem>
              </Link>
              <Link to="/guides">
                <DropdownMenuItem className="cursor-pointer">Strategy Guides</DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="/contact" className="nav-button">Contact</Link>
        </nav>

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
        <ChevronDown size={18} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
