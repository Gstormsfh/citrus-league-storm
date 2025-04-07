
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock player data
const players = [
  {
    id: 1,
    name: 'James Wilson',
    position: 'QB',
    number: 12,
    stats: { passing: 3240, touchdowns: 28, interceptions: 7 },
    image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    position: 'RB',
    number: 23,
    stats: { rushing: 1120, touchdowns: 9, fumbles: 2 },
    image: 'https://images.unsplash.com/photo-1580064003896-8eba6fc5435f?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 3,
    name: 'Tyler Martinez',
    position: 'WR',
    number: 84,
    stats: { receiving: 1050, touchdowns: 11, receptions: 87 },
    image: 'https://images.unsplash.com/photo-1574883052806-413e0927a4d7?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 4,
    name: 'Darius Smith',
    position: 'TE',
    number: 87,
    stats: { receiving: 780, touchdowns: 6, receptions: 62 },
    image: 'https://images.unsplash.com/photo-1627037558426-c2d07beda3af?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 5,
    name: 'Jordan Williams',
    position: 'LB',
    number: 55,
    stats: { tackles: 112, sacks: 7, interceptions: 1 },
    image: 'https://images.unsplash.com/photo-1580652870699-ae85c08a1ace?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 6,
    name: 'Michael Taylor',
    position: 'CB',
    number: 27,
    stats: { tackles: 64, interceptions: 4, passDefended: 12 },
    image: 'https://images.unsplash.com/photo-1527861518817-93eef51df1c6?q=80&w=200&auto=format&fit=crop'
  },
];

const Roster = () => {
  // Animation observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      },
      { threshold: 0.1 }
    );

    const animatedElements = document.querySelectorAll('.animated-element');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10 animated-element">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 citrus-gradient-text">Team Roster</h1>
            <p className="text-lg text-muted-foreground">Manage your fantasy team's lineup and track player performance.</p>
          </div>

          <Tabs defaultValue="offense" className="w-full max-w-5xl mx-auto mb-12">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8 bg-muted">
              <TabsTrigger value="offense">Offense</TabsTrigger>
              <TabsTrigger value="defense">Defense</TabsTrigger>
              <TabsTrigger value="special">Special Teams</TabsTrigger>
            </TabsList>
            
            <TabsContent value="offense" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {players.filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.position)).map((player, index) => (
                  <Card key={player.id} className="overflow-hidden hover:shadow-lg transition-shadow animated-element" style={{animationDelay: `${index * 100}ms`}}>
                    <div className="flex">
                      <div className="w-1/3">
                        <img src={player.image} alt={player.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="w-2/3 p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg">{player.name}</h3>
                          <div className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">{player.position}</div>
                        </div>
                        <div className="mt-2 text-3xl font-bold text-accent">#{player.number}</div>
                        <div className="mt-4 text-sm text-muted-foreground">
                          {Object.entries(player.stats).map(([key, value], i) => (
                            <div key={i} className="flex justify-between">
                              <span className="capitalize">{key}:</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                        <Button variant="ghost" size="sm" className="mt-4 w-full bg-muted/50 hover:bg-muted">View Details</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="text-center animated-element">
                <Button className="btn-vibrant-purple">Add Player</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="defense" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {players.filter(p => ['LB', 'CB'].includes(p.position)).map((player, index) => (
                  <Card key={player.id} className="overflow-hidden hover:shadow-lg transition-shadow animated-element" style={{animationDelay: `${index * 100}ms`}}>
                    <div className="flex">
                      <div className="w-1/3">
                        <img src={player.image} alt={player.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="w-2/3 p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg">{player.name}</h3>
                          <div className="bg-[hsl(var(--vibrant-blue))]/10 text-[hsl(var(--vibrant-blue))] font-bold px-2 py-0.5 rounded-full">{player.position}</div>
                        </div>
                        <div className="mt-2 text-3xl font-bold text-accent">#{player.number}</div>
                        <div className="mt-4 text-sm text-muted-foreground">
                          {Object.entries(player.stats).map(([key, value], i) => (
                            <div key={i} className="flex justify-between">
                              <span className="capitalize">{key}:</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                        <Button variant="ghost" size="sm" className="mt-4 w-full bg-muted/50 hover:bg-muted">View Details</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="text-center animated-element">
                <Button className="btn-vibrant-blue">Add Defender</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="special" className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-6 animated-element">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-muted-foreground">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium">No Special Teams Players Yet</h3>
                <p className="text-muted-foreground max-w-md">Add kickers, punters, and return specialists to enhance your team's special teams unit.</p>
                <Button className="btn-vibrant-orange mt-4">Add Special Teams Player</Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="bg-muted/30 rounded-xl p-6 max-w-5xl mx-auto animated-element">
            <h2 className="text-2xl font-bold mb-4">Team Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <h3 className="text-lg font-medium text-green-800 mb-2">Current Rank</h3>
                <p className="text-3xl font-bold text-green-700">#3</p>
                <p className="text-sm text-green-600 mt-1">Up from #5 last week</p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <h3 className="text-lg font-medium text-amber-800 mb-2">Points Scored</h3>
                <p className="text-3xl font-bold text-amber-700">1,247</p>
                <p className="text-sm text-amber-600 mt-1">Avg 124.7 per week</p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Record</h3>
                <p className="text-3xl font-bold text-blue-700">7-3</p>
                <p className="text-sm text-blue-600 mt-1">70% win rate</p>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Roster;
