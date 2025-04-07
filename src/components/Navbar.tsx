
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

// Create dedicated dropdown components for each section
const TeamDropdown = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) => {
  return (
    <div 
      className={`absolute top-full left-0 w-56 bg-background/95 backdrop-blur-sm shadow-lg rounded-md overflow-hidden transition-all duration-200 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="py-2 px-1">
        <Link to="/roster" className="block w-full text-left px-4 py-2 hover:bg-primary/10 rounded-md transition-colors">
          Roster
        </Link>
        <Link to="/gm-office" className="block w-full text-left px-4 py-2 hover:bg-primary/10 rounded-md transition-colors">
          GM's Office
        </Link>
        <Link to="/team-settings" className="block w-full text-left px-4 py-2 hover:bg-primary/10 rounded-md transition-colors">
          Team Settings
        </Link>
      </div>
    </div>
  )
}

const LeagueDropdown = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) => {
  return (
    <div 
      className={`absolute top-full left-0 w-56 bg-background/95 backdrop-blur-sm shadow-lg rounded-md overflow-hidden transition-all duration-200 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="py-2 px-1">
        <Link to="/matchup" className="block w-full text-left px-4 py-2 hover:bg-primary/10 rounded-md transition-colors">
          Matchup
        </Link>
        <Link to="/standings" className="block w-full text-left px-4 py-2 hover:bg-primary/10 rounded-md transition-colors">
          Standings
        </Link>
        <Link to="/free-agents" className="block w-full text-left px-4 py-2 hover:bg-primary/10 rounded-md transition-colors">
          Free Agents
        </Link>
      </div>
    </div>
  )
}

const ResourcesDropdown = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) => {
  return (
    <div 
      className={`absolute top-full left-0 w-56 bg-background/95 backdrop-blur-sm shadow-lg rounded-md overflow-hidden transition-all duration-200 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="py-2 px-1">
        <Link to="/blog" className="block w-full text-left px-4 py-2 hover:bg-primary/10 rounded-md transition-colors">
          Blog
        </Link>
        <Link to="/podcasts" className="block w-full text-left px-4 py-2 hover:bg-primary/10 rounded-md transition-colors">
          Podcasts
        </Link>
        <Link to="/guides" className="block w-full text-left px-4 py-2 hover:bg-primary/10 rounded-md transition-colors">
          Strategy Guides
        </Link>
      </div>
    </div>
  )
}

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [leagueDropdownOpen, setLeagueDropdownOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  
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
        <nav className="hidden lg:flex items-center space-x-6">
          <div className="relative">
            <button 
              className="nav-button flex items-center px-3 py-2 font-medium text-foreground"
              onMouseEnter={() => setTeamDropdownOpen(true)}
              onMouseLeave={() => setTeamDropdownOpen(false)}
              onClick={(e) => {e.preventDefault(); setTeamDropdownOpen(!teamDropdownOpen)}}
            >
              My Team <ChevronDown size={16} className="ml-1" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-1/2"></div>
            </button>
            <TeamDropdown isOpen={teamDropdownOpen} setIsOpen={setTeamDropdownOpen} />
          </div>
          
          <div className="relative">
            <button 
              className="nav-button flex items-center px-3 py-2 font-medium text-foreground"
              onMouseEnter={() => setLeagueDropdownOpen(true)}
              onMouseLeave={() => setLeagueDropdownOpen(false)}
              onClick={(e) => {e.preventDefault(); setLeagueDropdownOpen(!leagueDropdownOpen)}}
            >
              League <ChevronDown size={16} className="ml-1" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-1/2"></div>
            </button>
            <LeagueDropdown isOpen={leagueDropdownOpen} setIsOpen={setLeagueDropdownOpen} />
          </div>
          
          <div className="relative">
            <button 
              className="nav-button flex items-center px-3 py-2 font-medium text-foreground"
              onMouseEnter={() => setResourcesDropdownOpen(true)}
              onMouseLeave={() => setResourcesDropdownOpen(false)}
              onClick={(e) => {e.preventDefault(); setResourcesDropdownOpen(!resourcesDropdownOpen)}}
            >
              Resources <ChevronDown size={16} className="ml-1" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-1/2"></div>
            </button>
            <ResourcesDropdown isOpen={resourcesDropdownOpen} setIsOpen={setResourcesDropdownOpen} />
          </div>

          <Link to="/contact" className="nav-button px-3 py-2 font-medium text-foreground">Contact</Link>
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
            <div className="border-b border-border pb-2">
              <button className="w-full text-left py-2 flex justify-between items-center" 
                      onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}>
                My Team
                <ChevronDown size={18} className={`transform transition-transform ${teamDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {teamDropdownOpen && (
                <div className="pl-4 py-2 space-y-2 bg-muted/30 rounded-md my-2">
                  <Link to="/roster" className="block py-1" onClick={closeMobileMenu}>Roster</Link>
                  <Link to="/gm-office" className="block py-1" onClick={closeMobileMenu}>GM's Office</Link>
                  <Link to="/team-settings" className="block py-1" onClick={closeMobileMenu}>Team Settings</Link>
                </div>
              )}
            </div>
            
            <div className="border-b border-border pb-2">
              <button className="w-full text-left py-2 flex justify-between items-center" 
                      onClick={() => setLeagueDropdownOpen(!leagueDropdownOpen)}>
                League
                <ChevronDown size={18} className={`transform transition-transform ${leagueDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {leagueDropdownOpen && (
                <div className="pl-4 py-2 space-y-2 bg-muted/30 rounded-md my-2">
                  <Link to="/matchup" className="block py-1" onClick={closeMobileMenu}>Matchup</Link>
                  <Link to="/standings" className="block py-1" onClick={closeMobileMenu}>Standings</Link>
                  <Link to="/free-agents" className="block py-1" onClick={closeMobileMenu}>Free Agents</Link>
                </div>
              )}
            </div>
            
            <div className="border-b border-border pb-2">
              <button className="w-full text-left py-2 flex justify-between items-center" 
                      onClick={() => setResourcesDropdownOpen(!resourcesDropdownOpen)}>
                Resources
                <ChevronDown size={18} className={`transform transition-transform ${resourcesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {resourcesDropdownOpen && (
                <div className="pl-4 py-2 space-y-2 bg-muted/30 rounded-md my-2">
                  <Link to="/blog" className="block py-1" onClick={closeMobileMenu}>Blog</Link>
                  <Link to="/podcasts" className="block py-1" onClick={closeMobileMenu}>Podcasts</Link>
                  <Link to="/guides" className="block py-1" onClick={closeMobileMenu}>Strategy Guides</Link>
                </div>
              )}
            </div>
            
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

export default Navbar;
