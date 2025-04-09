import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Calendar, ChevronRight, MessageSquare, Share2, ThumbsUp } from "lucide-react";

// Mock news data
const newsData = [
  {
    id: 1,
    title: "Week 6 Fantasy Football Recap: Stars and Disappointments",
    excerpt: "Breaking down the major performances and letdowns from Week 6 NFL action.",
    image: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YW1lcmljYW4lMjBmb290YmFsbHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    category: "Analysis",
    date: "Oct 18, 2023",
    comments: 24,
    likes: 58,
    author: "Michael Thompson"
  },
  {
    id: 2,
    title: "Injury Updates: Top Players Status for Week 7",
    excerpt: "Latest updates on injury status for key fantasy players heading into Week 7.",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YW1lcmljYW4lMjBmb290YmFsbCUyMGluanVyeXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    category: "Injuries",
    date: "Oct 17, 2023",
    comments: 37,
    likes: 42,
    author: "Sarah Johnson"
  },
  {
    id: 3,
    title: "Waiver Wire: Top Pickups for Week 7",
    excerpt: "Must-add players still available in most fantasy leagues.",
    image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGFtZXJpY2FuJTIwZm9vdGJhbGx8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
    category: "Strategy",
    date: "Oct 16, 2023",
    comments: 19,
    likes: 64,
    author: "James Rodriguez"
  },
  {
    id: 4,
    title: "Trade Targets: Buy Low and Sell High Candidates",
    excerpt: "Players to target in trades and those to move before their value drops.",
    image: "https://images.unsplash.com/photo-1580750882617-8863d769ef11?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjN8fGFtZXJpY2FuJTIwZm9vdGJhbGx8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60", 
    category: "Trades",
    date: "Oct 15, 2023",
    comments: 31,
    likes: 47,
    author: "Rebecca Lee"
  }
];

const News = () => {
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="pt-24 flex-grow">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Fantasy News Center</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stay updated with the latest fantasy sports news, analysis, and insights to help you dominate your league.
            </p>
          </div>
          
          {/* News Categories Tabs */}
          <Tabs defaultValue="all" className="w-full mb-8">
            <div className="flex justify-center mb-6">
              <TabsList className="bg-background/50 border border-border/20">
                <TabsTrigger value="all">All News</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="injuries">Injuries</TabsTrigger>
                <TabsTrigger value="strategy">Strategy</TabsTrigger>
                <TabsTrigger value="trades">Trades</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="mt-0">
              {/* Featured Article */}
              <div className="mb-12 animated-element opacity-0 translate-y-4 transition-all duration-700">
                <div className="relative rounded-xl overflow-hidden shadow-md">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1560012954-3def95eb3e22?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YW1lcmljYW4lMjBmb290YmFsbHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=1600&q=60" 
                    alt="Featured article" 
                    className="w-full h-[40vh] md:h-[50vh] object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20 text-white">
                    <Badge className="mb-3 bg-primary hover:bg-primary text-white">Featured</Badge>
                    <h2 className="text-2xl md:text-4xl font-bold mb-2">Midseason Fantasy Football Awards: MVPs, Busts, and Breakouts</h2>
                    <p className="text-sm md:text-base mb-4 text-gray-200 max-w-3xl">
                      As we approach the halfway point of the fantasy season, we recognize the standouts, disappointments, and surprise performers that have shaped the fantasy landscape so far.
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>By Thomas Wright</span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" /> Oct 20, 2023
                      </span>
                    </div>
                    <Button className="mt-4 group" variant="secondary">
                      Read Full Article <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* News Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
                {newsData.map((article, index) => (
                  <Card key={article.id} className={`overflow-hidden shadow-sm hover:shadow-md transition-shadow animated-element opacity-0 translate-y-4 transition-all duration-700 delay-${index * 100}`}>
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={article.image} 
                        alt={article.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
                      />
                    </div>
                    <CardHeader className="p-4 pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">{article.category}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" /> {article.date}
                        </span>
                      </div>
                      <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {article.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-sm text-muted-foreground">By {article.author}</p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <button className="flex items-center hover:text-primary transition-colors">
                          <MessageSquare className="h-4 w-4 mr-1" /> {article.comments}
                        </button>
                        <button className="flex items-center hover:text-primary transition-colors">
                          <ThumbsUp className="h-4 w-4 mr-1" /> {article.likes}
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-1.5 rounded-full hover:bg-accent/10 transition-colors">
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 rounded-full hover:bg-accent/10 transition-colors">
                          <Bookmark className="h-4 w-4" />
                        </button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {/* Load More Button */}
              <div className="flex justify-center mt-8 mb-12">
                <Button variant="outline">
                  Load More Articles
                </Button>
              </div>
            </TabsContent>
            
            {/* Other tabs content - these would be filled with filtered content */}
            <TabsContent value="analysis" className="mt-0">
              <div className="text-center py-16">
                <h3 className="text-xl font-medium mb-2">Analysis Articles</h3>
                <p className="text-muted-foreground">
                  Detailed breakdowns and analysis of fantasy performances and trends.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="injuries" className="mt-0">
              <div className="text-center py-16">
                <h3 className="text-xl font-medium mb-2">Injury Updates</h3>
                <p className="text-muted-foreground">
                  Latest injury news and impact analysis on fantasy-relevant players.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="strategy" className="mt-0">
              <div className="text-center py-16">
                <h3 className="text-xl font-medium mb-2">Strategy Guides</h3>
                <p className="text-muted-foreground">
                  Tips, strategies, and best practices to maximize your fantasy team's performance.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="trades" className="mt-0">
              <div className="text-center py-16">
                <h3 className="text-xl font-medium mb-2">Trade Analysis</h3>
                <p className="text-muted-foreground">
                  Evaluations of trade opportunities, targets, and strategies.
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Newsletter Section */}
          <div className="bg-accent/5 rounded-xl p-8 mb-12 animated-element opacity-0 translate-y-4 transition-all duration-700">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-2xl font-bold mb-3">Subscribe to our Fantasy Newsletter</h3>
              <p className="text-muted-foreground mb-6">
                Get weekly insights, waiver recommendations, and start/sit advice delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="px-4 py-2 rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary min-w-[240px]"
                />
                <Button className="bg-primary hover:bg-primary/90">
                  Subscribe Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default News;
