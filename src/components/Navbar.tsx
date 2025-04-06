import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
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
  return <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-background/95 backdrop-blur-sm shadow-md py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">CS</span>
          </div>
          <span className="font-display font-bold text-xl">CitrusSports</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          <a href="#features" className="nav-link">Features</a>
          <a href="#leagues" className="nav-link">Leagues</a>
          
          <a href="#news" className="nav-link">News</a>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="nav-link flex items-center">
                Resources <ChevronDown size={16} className="ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-sm">
              <DropdownMenuItem>
                <a href="#blog" className="w-full">Blog</a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="#podcasts" className="w-full">Podcasts</a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="#guides" className="w-full">Strategy Guides</a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <a href="#contact" className="nav-link">Contact</a>
        </nav>

        <div className="hidden lg:flex items-center space-x-4">
          <Button variant="outline" className="rounded-full">Log in</Button>
          <Button className="rounded-full">Sign up free</Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && <div className="lg:hidden bg-background/95 backdrop-blur-sm animate-slide-down">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-3">
            <a href="#features" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#leagues" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Leagues</a>
            <a href="#players" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Players</a>
            <a href="#news" className="nav-link" onClick={() => setMobileMenuOpen(false)}>News</a>
            <a href="#resources" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Resources</a>
            <a href="#contact" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            <div className="flex flex-col space-y-2 pt-2">
              <Button variant="outline" className="w-full rounded-full">Log in</Button>
              <Button className="w-full rounded-full">Sign up free</Button>
            </div>
          </div>
        </div>}
    </header>;
};
export default Navbar;