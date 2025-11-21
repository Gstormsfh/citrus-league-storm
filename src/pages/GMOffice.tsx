import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, Users, Brain, TrendingUp, Calendar, FileText, BarChart3, ListChecks, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const gmActions = [
  {
    title: "Stormy AI Assistant",
    description: "Get personalized advice and insights from your AI GM",
    icon: Brain,
    gradient: "from-[hsl(var(--vibrant-purple))] to-primary",
    link: "#stormy"
  },
  {
    title: "Make a Trade",
    description: "Propose and negotiate trades with league managers",
    icon: ArrowLeftRight,
    gradient: "from-primary to-[hsl(var(--vibrant-orange))]",
    link: "/roster"
  },
  {
    title: "Free Agents",
    description: "Browse and claim available players",
    icon: Users,
    gradient: "from-[hsl(var(--vibrant-orange))] to-[hsl(var(--citrus-yellow))]",
    link: "/free-agents"
  },
  {
    title: "Team Analytics",
    description: "Deep dive into your team's performance metrics",
    icon: BarChart3,
    gradient: "from-[hsl(var(--citrus-green))] to-primary",
    link: "#analytics"
  },
  {
    title: "Waiver Wire",
    description: "Manage waiver claims and priorities",
    icon: TrendingUp,
    gradient: "from-primary to-[hsl(var(--vibrant-purple))]",
    link: "#waiver"
  },
  {
    title: "Schedule Manager",
    description: "View upcoming matchups and plan your lineup",
    icon: Calendar,
    gradient: "from-[hsl(var(--vibrant-orange))] to-primary",
    link: "#schedule"
  },
  {
    title: "Player News",
    description: "Stay updated on injuries and lineup changes",
    icon: Bell,
    gradient: "from-[hsl(var(--vibrant-purple))] to-[hsl(var(--citrus-green))]",
    link: "/news"
  },
  {
    title: "League Standings",
    description: "Track rankings and playoff positioning",
    icon: ListChecks,
    gradient: "from-[hsl(var(--citrus-yellow))] to-[hsl(var(--vibrant-orange))]",
    link: "/standings"
  },
  {
    title: "Trade Analyzer",
    description: "Evaluate trade proposals with advanced analytics",
    icon: FileText,
    gradient: "from-primary to-[hsl(var(--citrus-green))]",
    link: "#trade-analyzer"
  }
];

const GMOffice = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[hsl(var(--vibrant-orange))] via-primary to-[hsl(var(--vibrant-purple))] inline-block text-transparent bg-clip-text">
              GM's Office
            </h1>
            <p className="text-lg text-muted-foreground">
              Your command center for team management and strategy
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gmActions.map((action, index) => (
              <Link 
                key={action.title} 
                to={action.link}
                className="group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary/50 cursor-pointer">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{action.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};


export default GMOffice;
