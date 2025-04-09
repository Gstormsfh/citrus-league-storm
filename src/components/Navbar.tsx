
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronRight, User, Bell, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
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
    <header 
      className={cn(
        "fixed w-full z-40 transition-all duration-500", 
        isScrolled ? 
          "py-3 bg-background/80 backdrop-blur-lg shadow-lg border-b border-border/20" : 
          "py-5 bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        {/* Main Navigation Row */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
              <span className="text-white font-bold text-lg">CS</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl group-hover:text-primary transition-colors duration-300">CitrusSports</span>
              <span className="text-xs text-muted-foreground">Fantasy League Management</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-sm font-medium hover:bg-accent/20 hover:text-primary focus:bg-accent/20 h-11">My Team</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[400px] p-4 md:grid-cols-2 lg:w-[500px] lg:grid-cols-2">
                      <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-2">
                        <Link to="/roster" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md hover:shadow-md transition-shadow">
                          <div className="mb-2 mt-4 text-lg font-medium">Roster</div>
                          <p className="text-sm text-muted-foreground">Manage your team's roster and lineup</p>
                          <ChevronRight className="h-4 w-4 mt-2 text-primary" />
                        </Link>
                        <Link to="/gm-office" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md hover:shadow-md transition-shadow">
                          <div className="mb-2 mt-4 text-lg font-medium">GM's Office</div>
                          <p className="text-sm text-muted-foreground">Your command center for team operations</p>
                          <ChevronRight className="h-4 w-4 mt-2 text-primary" />
                        </Link>
                        <Link to="/team-settings" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md hover:shadow-md transition-shadow">
                          <div className="mb-2 mt-4 text-lg font-medium">Team Settings</div>
                          <p className="text-sm text-muted-foreground">Customize your team's appearance and preferences</p>
                          <ChevronRight className="h-4 w-4 mt-2 text-primary" />
                        </Link>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-sm font-medium hover:bg-accent/20 hover:text-primary focus:bg-accent/20 h-11">League</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[400px] p-4 md:grid-cols-2 lg:w-[500px] lg:grid-cols-2">
                      <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-2">
                        <Link to="/matchup" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md hover:shadow-md transition-shadow">
                          <div className="mb-2 mt-4 text-lg font-medium">Matchup</div>
                          <p className="text-sm text-muted-foreground">View your current and upcoming matchups</p>
                          <ChevronRight className="h-4 w-4 mt-2 text-primary" />
                        </Link>
                        <Link to="/standings" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md hover:shadow-md transition-shadow">
                          <div className="mb-2 mt-4 text-lg font-medium">Standings</div>
                          <p className="text-sm text-muted-foreground">See where your team ranks in the league</p>
                          <ChevronRight className="h-4 w-4 mt-2 text-primary" />
                        </Link>
                        <Link to="/free-agents" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md hover:shadow-md transition-shadow">
                          <div className="mb-2 mt-4 text-lg font-medium">Free Agents</div>
                          <p className="text-sm text-muted-foreground">Browse available players to add to your roster</p>
                          <ChevronRight className="h-4 w-4 mt-2 text-primary" />
                        </Link>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-sm font-medium hover:bg-accent/20 hover:text-primary focus:bg-accent/20 h-11">Resources</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[400px] p-4 md:grid-cols-2 lg:w-[500px] lg:grid-cols-2">
                      <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-2">
                        <Link to="/blog" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md hover:shadow-md transition-shadow">
                          <div className="mb-2 mt-4 text-lg font-medium">Blog</div>
                          <p className="text-sm text-muted-foreground">Latest news and fantasy sports insights</p>
                          <ChevronRight className="h-4 w-4 mt-2 text-primary" />
                        </Link>
                        <Link to="/podcasts" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md hover:shadow-md transition-shadow">
                          <div className="mb-2 mt-4 text-lg font-medium">Podcasts</div>
                          <p className="text-sm text-muted-foreground">Listen to expert analysis and predictions</p>
                          <ChevronRight className="h-4 w-4 mt-2 text-primary" />
                        </Link>
                        <Link to="/guides" onClick={closeMobileMenu} className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md hover:shadow-md transition-shadow">
                          <div className="mb-2 mt-4 text-lg font-medium">Strategy Guides</div>
                          <p className="text-sm text-muted-foreground">Learn winning tactics and strategies</p>
                          <ChevronRight className="h-4 w-4 mt-2 text-primary" />
                        </Link>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/contact" className={cn(
                      "inline-flex items-center justify-center rounded-md h-11 px-4 py-2 text-sm font-medium bg-transparent hover:bg-accent/20 hover:text-primary transition-colors focus:bg-accent/20"
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
                <Button variant="ghost" size="icon" className="text-foreground hover:text-primary h-10 w-10 rounded-full">
                  <Search className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="flex flex-col space-y-4">
                  <h4 className="font-medium text-sm">Quick search</h4>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      placeholder="Search players, teams, guides..."
                      className="w-full rounded-md border border-input bg-background pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Press <kbd className="rounded bg-muted px-1 py-0.5">Ctrl/⌘</kbd> + <kbd className="rounded bg-muted px-1 py-0.5">K</kbd> to open search anywhere
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:text-primary relative h-10 w-10 rounded-full">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">3</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Notifications</h4>
                    <Button variant="ghost" className="text-xs h-auto p-0 hover:bg-transparent hover:text-primary">
                      Mark all as read
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 p-2 rounded-lg hover:bg-accent/20 cursor-pointer">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                          {i === 1 ? <Bell className="h-4 w-4" /> : i === 2 ? <User className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            {i === 1 ? "Trade offer received" : i === 2 ? "New player available" : "Match starts in 1 hour"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {i === 1 ? "2 mins ago" : i === 2 ? "1 hour ago" : "3 hours ago"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full">View all notifications</Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="w-px h-8 bg-border/50 mx-1"></div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-full border-primary/20 flex gap-2 pl-3 pr-3">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">JS</div>
                  <span className="font-medium">John</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56">
                <div className="flex flex-col space-y-1">
                  <Button variant="ghost" className="justify-start text-sm h-9">Profile</Button>
                  <Button variant="ghost" className="justify-start text-sm h-9">Settings</Button>
                  <Button variant="ghost" className="justify-start text-sm h-9">Subscription</Button>
                  <Button variant="ghost" className="justify-start text-sm h-9 text-destructive hover:text-destructive">Log out</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-foreground hover:text-primary h-10 w-10 rounded-full">
              <Search className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-foreground hover:text-primary h-10 w-10 rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[calc(var(--header-height)+1px)] z-50 bg-background/95 backdrop-blur-lg animate-in fade-in slide-in-from-top duration-300">
          <div className="container mx-auto px-4 py-6 h-[calc(100vh-var(--header-height))] flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <nav className="flex flex-col space-y-6">
                <MobileNavSection title="My Team">
                  <Link to="/roster" className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20" onClick={closeMobileMenu}>
                    <span className="text-base">Roster</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link to="/gm-office" className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20" onClick={closeMobileMenu}>
                    <span className="text-base">GM's Office</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link to="/team-settings" className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20" onClick={closeMobileMenu}>
                    <span className="text-base">Team Settings</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </MobileNavSection>
                
                <MobileNavSection title="League">
                  <Link to="/matchup" className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20" onClick={closeMobileMenu}>
                    <span className="text-base">Matchup</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link to="/standings" className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20" onClick={closeMobileMenu}>
                    <span className="text-base">Standings</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link to="/free-agents" className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20" onClick={closeMobileMenu}>
                    <span className="text-base">Free Agents</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </MobileNavSection>
                
                <MobileNavSection title="Resources">
                  <Link to="/blog" className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20" onClick={closeMobileMenu}>
                    <span className="text-base">Blog</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link to="/podcasts" className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20" onClick={closeMobileMenu}>
                    <span className="text-base">Podcasts</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link to="/guides" className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20" onClick={closeMobileMenu}>
                    <span className="text-base">Strategy Guides</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </MobileNavSection>
                
                <Link to="/contact" className="flex items-center justify-between p-4 rounded-lg hover:bg-accent/20" onClick={closeMobileMenu}>
                  <span className="text-base font-medium">Contact</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </nav>
            </div>
            
            <div className="border-t border-border/40 pt-4 mt-6">
              <div className="flex space-x-4 items-center mb-4">
                <div className="h-11 w-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground">JS</div>
                <div>
                  <p className="font-medium">John Smith</p>
                  <p className="text-sm text-muted-foreground">Premium Member</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button variant="outline" className="w-full">Profile</Button>
                <Button variant="outline" className="w-full text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10">Log out</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* This sets a css variable that we can use to properly position the mobile menu */}
      <style jsx global>{`
        :root {
          --header-height: ${isScrolled ? '73px' : '89px'};
        }
      `}</style>
    </header>
  );
};

// Helper component for mobile navigation sections
const MobileNavSection = ({ title, children }: { title: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-border/20 pb-4">
      <button 
        className="w-full text-left py-2 flex justify-between items-center font-medium" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen ? "transform rotate-90" : ""
          )}
        />
      </button>
      {isOpen && (
        <div className="pl-2 space-y-1 mt-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default Navbar;
