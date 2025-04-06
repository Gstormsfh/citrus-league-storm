
import { Facebook, Twitter, Instagram, Youtube, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Footer = () => {
  return (
    <footer className="bg-white pt-16 pb-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 border-b border-gray-200 pb-12 mb-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">CS</span>
              </div>
              <span className="font-display font-bold text-xl">CitrusSports</span>
            </div>
            <p className="text-foreground/70 mb-6 max-w-sm">
              A refreshing take on fantasy sports with intuitive design and powerful AI assistance.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 bg-foreground/5 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors group">
                <Facebook size={16} className="text-foreground/70 group-hover:text-primary" />
              </a>
              <a href="#" className="w-8 h-8 bg-foreground/5 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors group">
                <Twitter size={16} className="text-foreground/70 group-hover:text-primary" />
              </a>
              <a href="#" className="w-8 h-8 bg-foreground/5 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors group">
                <Instagram size={16} className="text-foreground/70 group-hover:text-primary" />
              </a>
              <a href="#" className="w-8 h-8 bg-foreground/5 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors group">
                <Youtube size={16} className="text-foreground/70 group-hover:text-primary" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">Features</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">Leagues</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">Players</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">Stormy AI</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">Podcasts</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">Strategy Guides</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">Player News</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold text-lg mb-4">Subscribe to our newsletter</h4>
            <p className="text-foreground/70 mb-4">Get the latest fantasy sports tips and updates</p>
            <div className="flex gap-2">
              <Input 
                placeholder="Enter your email" 
                className="rounded-full" 
                type="email" 
              />
              <Button>Subscribe</Button>
            </div>
          </div>
          
          <div className="lg:text-right">
            <div className="flex lg:justify-end items-center gap-3 text-sm mb-2">
              <Mail size={14} className="text-foreground/70" />
              <a href="mailto:hello@citrussports.com" className="text-foreground/70 hover:text-primary transition-colors">
                hello@citrussports.com
              </a>
            </div>
            <p className="text-foreground/50 text-sm">
              © {new Date().getFullYear()} CitrusSports. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
