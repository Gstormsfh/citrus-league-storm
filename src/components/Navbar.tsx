
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Menu, X, ChevronRight, User, Bell, Search, 
  Calendar, LineChart, Newspaper, Medal, Users, Settings, 
  LogOut, Home, FileText, Headphones, BookOpen, CircleUser
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuTrigger 
} from "@/components/ui/navigation-menu";
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
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

  // Check if the current path matches the link path
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <header 
      className={cn(
        "fixed w-full z-40 transition-all duration-500", 
        isScrolled ? 
          "py-3 bg-background/80 backdrop-blur-lg shadow-sm border-b border-border/20" : 
          "py-5 bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        {/* Main Navigation Row */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
              <span className="text-white font-bold text-base">CS</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg group-hover:text-primary transition-colors duration-300">CitrusSports</span>
              <span className="text-xs text-muted-foreground">Fantasy League</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "text-sm font-medium text-foreground/80",
                    (isActive("/roster") || isActive("/gm-office")) && "text-primary"
                  )}>My Team</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[320px] p-2 grid gap-2 grid-cols-2">
                      <Link to="/roster" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/5 to-primary/10 p-4 no-underline outline-none focus:shadow-sm hover:shadow-sm hover:scale-[1.01] transition-all duration-200">
                        <div className="mb-1 mt-2 text-base font-medium">Roster</div>
                        <p className="text-xs leading-tight text-muted-foreground">Manage your team's lineup</p>
                        <ChevronRight className="h-3 w-3 mt-2 text-primary" />
                      </Link>
                      <Link to="/gm-office" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-secondary/5 to-secondary/10 p-4 no-underline outline-none focus:shadow-sm hover:shadow-sm hover:scale-[1.01] transition-all duration-200">
                        <div className="mb-1 mt-2 text-base font-medium">GM's Office</div>
                        <p className="text-xs leading-tight text-muted-foreground">Team operations center</p>
                        <ChevronRight className="h-3 w-3 mt-2 text-primary" />
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "text-sm font-medium text-foreground/80",
                    (isActive("/matchup") || isActive("/standings") || isActive("/free-agents") || isActive("/draft")) && "text-primary"
                  )}>League</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[320px] p-2 grid gap-2 grid-cols-2">
                      <Link to="/matchup" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/5 to-primary/10 p-4 no-underline outline-none focus:shadow-sm hover:shadow-sm hover:scale-[1.01] transition-all duration-200">
                        <div className="mb-1 mt-2 text-base font-medium">Matchup</div>
                        <p className="text-xs leading-tight text-muted-foreground">Current matchups</p>
                        <ChevronRight className="h-3 w-3 mt-2 text-primary" />
                      </Link>
                      <Link to="/standings" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-secondary/5 to-secondary/10 p-4 no-underline outline-none focus:shadow-sm hover:shadow-sm hover:scale-[1.01] transition-all duration-200">
                        <div className="mb-1 mt-2 text-base font-medium">Standings</div>
                        <p className="text-xs leading-tight text-muted-foreground">League rankings</p>
                        <ChevronRight className="h-3 w-3 mt-2 text-primary" />
                      </Link>
                      <Link to="/draft-room" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-accent/5 to-accent/10 p-4 no-underline outline-none focus:shadow-sm hover:shadow-sm hover:scale-[1.01] transition-all duration-200">
                        <div className="mb-1 mt-2 text-base font-medium">Draft Room</div>
                        <p className="text-xs leading-tight text-muted-foreground">Live fantasy draft</p>
                        <ChevronRight className="h-3 w-3 mt-2 text-primary" />
                      </Link>
                      <Link to="/free-agents" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-accent/5 to-accent/10 p-4 no-underline outline-none focus:shadow-sm hover:shadow-sm hover:scale-[1.01] transition-all duration-200">
                        <div className="mb-1 mt-2 text-base font-medium">Free Agents</div>
                        <p className="text-xs leading-tight text-muted-foreground">Available players</p>
                        <ChevronRight className="h-3 w-3 mt-2 text-primary" />
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "text-sm font-medium text-foreground/80",
                    (isActive("/blog") || isActive("/podcasts") || isActive("/guides") || isActive("/news")) && "text-primary"
                  )}>Resources</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[320px] p-2 grid gap-2 grid-cols-2">
                      <Link to="/news" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-orange-500/5 to-orange-500/10 p-4 no-underline outline-none focus:shadow-sm hover:shadow-sm hover:scale-[1.01] transition-all duration-200">
                        <div className="mb-1 mt-2 text-base font-medium">News</div>
                        <p className="text-xs leading-tight text-muted-foreground">Latest fantasy updates</p>
                        <ChevronRight className="h-3 w-3 mt-2 text-primary" />
                      </Link>
                      <Link to="/blog" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/5 to-primary/10 p-4 no-underline outline-none focus:shadow-sm hover:shadow-sm hover:scale-[1.01] transition-all duration-200">
                        <div className="mb-1 mt-2 text-base font-medium">Blog</div>
                        <p className="text-xs leading-tight text-muted-foreground">Fantasy sports insights</p>
                        <ChevronRight className="h-3 w-3 mt-2 text-primary" />
                      </Link>
                      <Link to="/podcasts" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-secondary/5 to-secondary/10 p-4 no-underline outline-none focus:shadow-sm hover:shadow-sm hover:scale-[1.01] transition-all duration-200">
                        <div className="mb-1 mt-2 text-base font-medium">Podcasts</div>
                        <p className="text-xs leading-tight text-muted-foreground">Expert analysis</p>
                        <ChevronRight className="h-3 w-3 mt-2 text-primary" />
                      </Link>
                      <Link to="/guides" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-accent/5 to-accent/10 p-4 no-underline outline-none focus:shadow-sm hover:shadow-sm hover:scale-[1.01] transition-all duration-200">
                        <div className="mb-1 mt-2 text-base font-medium">Strategy Guides</div>
                        <p className="text-xs leading-tight text-muted-foreground">Winning tactics</p>
                        <ChevronRight className="h-3 w-3 mt-2 text-primary" />
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/contact" className={cn(
                      "inline-flex items-center justify-center rounded-md h-9 px-3 py-1.5 text-sm font-medium text-foreground/90 hover:text-primary transition-colors",
                      isActive("/contact") && "text-primary"
                    )}>
                      Contact
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side navigation - Search, Notifications, User */}
          <div className="hidden lg:flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:text-primary hover:bg-primary/5 h-9 w-9 rounded-md">
                  <Search className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <div className="flex flex-col space-y-3">
                  <h4 className="font-medium text-xs">Quick search</h4>
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      placeholder="Search players, teams..."
                      className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Press <kbd className="rounded bg-muted px-1 py-0.5 text-[10px]">⌘</kbd> + <kbd className="rounded bg-muted px-1 py-0.5 text-[10px]">K</kbd> to search
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:text-primary hover:bg-primary/5 relative h-9 w-9 rounded-md">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-white">2</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-0">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between p-3 border-b border-border/30">
                    <h4 className="font-medium text-xs">Notifications</h4>
                    <Button variant="ghost" className="text-[10px] h-auto p-0 hover:bg-transparent hover:text-primary">
                      Clear all
                    </Button>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-2 p-2.5 hover:bg-accent/5 cursor-pointer border-b border-border/10">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          {i === 1 ? <Bell className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium">
                            {i === 1 ? "Trade offer received" : "New player available"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {i === 1 ? "2 mins ago" : "1 hour ago"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2.5">
                    <Button variant="outline" size="sm" className="w-full text-xs h-7">View all</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="w-px h-7 bg-border/30 mx-1"></div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-background rounded-md border-border/30 flex gap-2 pl-2 pr-3 h-9 hover:shadow-sm">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">J</div>
                  <span className="text-xs font-medium">John</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-1.5">
                <div className="flex flex-col space-y-1">
                  <Button variant="ghost" className="justify-start text-xs h-8" asChild>
                    <Link to="/profile">
                      <CircleUser className="h-3.5 w-3.5 mr-2" /> Profile
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start text-xs h-8">
                    <Users className="h-3.5 w-3.5 mr-2" /> Subscription
                  </Button>
                  <Button variant="ghost" className="justify-start text-xs h-8 text-destructive hover:text-destructive">
                    <LogOut className="h-3.5 w-3.5 mr-2" /> Log out
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-1">
            <Button variant="ghost" size="icon" className="text-foreground hover:text-primary h-9 w-9 rounded-md">
              <Search className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-foreground hover:text-primary h-9 w-9 rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[calc(var(--header-height)+1px)] z-50 bg-background/95 backdrop-blur-sm animate-in fade-in slide-in-from-top duration-300">
          <div className="container mx-auto px-4 py-5 h-[calc(100vh-var(--header-height))] flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <nav className="flex flex-col space-y-4">
                <MobileNavSection title="My Team">
                  <Link to="/roster" className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent/5" onClick={closeMobileMenu}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary/70" />
                      <span className="text-sm">Roster</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                  <Link to="/gm-office" className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent/5" onClick={closeMobileMenu}>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary/70" />
                      <span className="text-sm">GM's Office</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                </MobileNavSection>
                
                <MobileNavSection title="League">
                  <Link to="/matchup" className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent/5" onClick={closeMobileMenu}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary/70" />
                      <span className="text-sm">Matchup</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                  <Link to="/draft" className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent/5" onClick={closeMobileMenu}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary/70" />
                      <span className="text-sm">Draft Room</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                  <Link to="/standings" className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent/5" onClick={closeMobileMenu}>
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4 text-primary/70" />
                      <span className="text-sm">Standings</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                  <Link to="/free-agents" className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent/5" onClick={closeMobileMenu}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary/70" />
                      <span className="text-sm">Free Agents</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                </MobileNavSection>
                
                <MobileNavSection title="Resources">
                  <Link to="/news" className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent/5" onClick={closeMobileMenu}>
                    <div className="flex items-center gap-2">
                      <Newspaper className="h-4 w-4 text-primary/70" />
                      <span className="text-sm">News</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                  <Link to="/blog" className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent/5" onClick={closeMobileMenu}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary/70" />
                      <span className="text-sm">Blog</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                  <Link to="/podcasts" className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent/5" onClick={closeMobileMenu}>
                    <div className="flex items-center gap-2">
                      <Headphones className="h-4 w-4 text-primary/70" />
                      <span className="text-sm">Podcasts</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                  <Link to="/guides" className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent/5" onClick={closeMobileMenu}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary/70" />
                      <span className="text-sm">Strategy Guides</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                </MobileNavSection>
                
                <Link to="/contact" className="bg-accent/5 flex items-center justify-between p-2.5 rounded-md" onClick={closeMobileMenu}>
                  <div className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-primary" />
                    <span className="text-sm">Contact</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
                
                <div className="pt-4">
                  <div className="bg-primary/5 p-3 rounded-md mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Recent Notifications</span>
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="bg-background rounded-md p-2 text-xs">
                        <p className="font-medium">Trade offer received</p>
                        <p className="text-muted-foreground text-[10px] mt-0.5">2 mins ago</p>
                      </div>
                      <div className="bg-background rounded-md p-2 text-xs">
                        <p className="font-medium">New player available</p>
                        <p className="text-muted-foreground text-[10px] mt-0.5">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </nav>
            </div>
            
            <div className="border-t border-border/30 pt-4 mt-4">
              <div className="flex space-x-3 items-center mb-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">J</div>
                <div>
                  <p className="text-sm font-medium">John Smith</p>
                  <p className="text-xs text-muted-foreground">Premium</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button variant="outline" size="sm" className="w-full text-xs h-8" asChild>
                  <Link to="/profile">
                    <User className="h-3.5 w-3.5 mr-1.5" /> Profile
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="col-span-2 w-full text-xs h-8 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5">
                  <LogOut className="h-3.5 w-3.5 mr-1.5" /> Log out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`:root {
          --header-height: ${isScrolled ? '73px' : '89px'};
        }`}
      </style>
    </header>
  );
};

// Helper component for mobile navigation sections
const MobileNavSection = ({ title, children }: { title: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-border/20 pb-2">
      <button 
        className="w-full text-left py-2 flex justify-between items-center font-medium text-sm" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            isOpen ? "transform rotate-90" : ""
          )}
        />
      </button>
      {isOpen && (
        <div className="pl-2 space-y-0.5 mt-1">
          {children}
        </div>
      )}
    </div>
  );
};

export default Navbar;
