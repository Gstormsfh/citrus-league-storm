import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, Users, TrendingUp, Calendar, FileText, BarChart3, ListChecks, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Narwhal } from '@/components/icons/Narwhal';

const gmActions = [
  {
    title: "Stormy AI Assistant",
    description: "Get personalized advice and insights from your AI GM",
    icon: Narwhal,
    gradient: "from-primary to-secondary",
    link: "/gm-office/stormy"
  },
  {
    title: "Make a Trade",
    description: "Propose and negotiate trades with league managers",
    icon: ArrowLeftRight,
    gradient: "from-primary to-secondary",
    link: "/trade-analyzer"
  },
  {
    title: "Free Agents",
    description: "Browse and claim available players",
    icon: Users,
    gradient: "from-primary to-secondary",
    link: "/free-agents"
  },
  {
    title: "Team Analytics",
    description: "Deep dive into your team's performance metrics",
    icon: BarChart3,
    gradient: "from-primary to-secondary",
    link: "/team-analytics"
  },
  {
    title: "Waiver Wire",
    description: "Manage waiver claims and priorities",
    icon: TrendingUp,
    gradient: "from-primary to-secondary",
    link: "/waiver-wire"
  },
  {
    title: "Schedule Manager",
    description: "View upcoming matchups and plan your lineup",
    icon: Calendar,
    gradient: "from-primary to-secondary",
    link: "/schedule-manager"
  }
];

const GMOffice = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
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
                <Card className="h-full transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 hover:border-primary/70 cursor-pointer overflow-hidden relative">
                  <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-br ${action.gradient} opacity-10`} />
                  <CardHeader className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <action.icon className="h-8 w-8 text-white" strokeWidth={2.5} />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{action.title}</CardTitle>
                    <CardDescription className="text-sm mt-2">
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
