import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Trophy, Users, Settings, ChevronRight, ArrowLeft, CheckCircle, Plus, X } from "lucide-react";

const CreateLeague = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [leagueName, setLeagueName] = useState("");
  const [teamsCount, setTeamsCount] = useState("12");
  const [scoringType, setScoringType] = useState("h2h-points");
  const [draftType, setDraftType] = useState("snake");
  const [isPublic, setIsPublic] = useState(false);

  // Custom Stats State
  const [customStatName, setCustomStatName] = useState("");
  const [customStatPoints, setCustomStatPoints] = useState("1");
  const [activeStats, setActiveStats] = useState([
    { id: "g", name: "Goals", points: 3, default: true },
    { id: "a", name: "Assists", points: 2, default: true },
    { id: "ppp", name: "Power Play Points", points: 1, default: true },
    { id: "sog", name: "Shots on Goal", points: 0.4, default: true },
    { id: "blk", name: "Blocks", points: 0.4, default: true },
    { id: "hit", name: "Hits", points: 0.2, default: true },
    { id: "w", name: "Wins (Goalie)", points: 4, default: true },
    { id: "so", name: "Shutouts", points: 2, default: true },
    { id: "sv", name: "Saves", points: 0.2, default: true },
    { id: "ga", name: "Goals Against", points: -1, default: true },
  ]);

  const handleAddCustomStat = () => {
    if (!customStatName) return;
    const pointsValue = parseFloat(customStatPoints);
    const newStat = {
      id: `custom-${Date.now()}`,
      name: customStatName,
      points: isNaN(pointsValue) ? 0 : pointsValue,
      default: false
    };
    setActiveStats([...activeStats, newStat]);
    setCustomStatName("");
    setCustomStatPoints("1");
  };

  const handleRemoveStat = (id: string) => {
    setActiveStats(activeStats.filter(stat => stat.id !== id));
  };

  const handleCreateLeague = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigate("/draft-room"); // Navigate to draft room after creation
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[hsl(var(--vibrant-yellow))] rounded-full opacity-10 blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[hsl(var(--vibrant-green))] rounded-full opacity-10 blur-3xl -z-10"></div>

      <Navbar />

      <main className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 citrus-gradient-text">
              Create Your League
            </h1>
            <p className="text-lg text-muted-foreground">
              Customize your fantasy experience and invite your friends.
            </p>
          </div>

          <Card className="card-citrus border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/40 pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  League Settings
                </CardTitle>
                <div className="text-sm font-medium text-muted-foreground">
                  Step {step} of 3
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-muted/50 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${(step / 3) * 100}%` }}
                ></div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              
              {/* STEP 1: BASIC SETTINGS */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-3">
                    <Label htmlFor="league-name" className="text-base">League Name</Label>
                    <Input 
                      id="league-name" 
                      placeholder="e.g. The Frozen Pond" 
                      className="h-12 text-lg"
                      value={leagueName}
                      onChange={(e) => setLeagueName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="teams-count" className="text-base">Number of Teams</Label>
                      <Select value={teamsCount} onValueChange={setTeamsCount}>
                        <SelectTrigger id="teams-count" className="h-12">
                          <SelectValue placeholder="Select teams" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8">8 Teams</SelectItem>
                          <SelectItem value="10">10 Teams</SelectItem>
                          <SelectItem value="12">12 Teams</SelectItem>
                          <SelectItem value="14">14 Teams</SelectItem>
                          <SelectItem value="16">16 Teams</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="scoring-type" className="text-base">Scoring Format</Label>
                      <Select value={scoringType} onValueChange={setScoringType}>
                        <SelectTrigger id="scoring-type" className="h-12">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="h2h-points">Head-to-Head Points</SelectItem>
                          <SelectItem value="h2h-categories">Head-to-Head Categories</SelectItem>
                          <SelectItem value="roto">Rotisserie</SelectItem>
                          <SelectItem value="season-points">Total Season Points</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button 
                      size="lg" 
                      className="rounded-full px-8"
                      onClick={() => setStep(2)}
                      disabled={!leagueName}
                    >
                      Next Step <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: SCORING & STATS */}
              {step === 2 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">Scoring Settings</h3>
                    <p className="text-sm text-muted-foreground">Define how your league scores points. Add custom stats for fun leagues!</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto p-2 border rounded-md bg-background/50">
                    {activeStats.map((stat) => (
                      <div key={stat.id} className="flex items-center justify-between p-3 bg-card rounded-lg shadow-sm border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {stat.points > 0 ? '+' : ''}{stat.points}
                          </div>
                          <span className="font-medium">{stat.name}</span>
                        </div>
                        {!stat.default && (
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveStat(stat.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-muted/30 p-4 rounded-xl space-y-4 border border-border/50">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Add Custom Stat</h4>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="custom-stat-name" className="text-xs">Stat Name</Label>
                        <Input 
                          id="custom-stat-name" 
                          placeholder="e.g. Fights, Broken Sticks" 
                          value={customStatName}
                          onChange={(e) => setCustomStatName(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      <div className="w-24 space-y-2">
                        <Label htmlFor="custom-stat-points" className="text-xs">Points</Label>
                        <Input 
                          id="custom-stat-points" 
                          type="number" 
                          step="0.1"
                          value={customStatPoints}
                          onChange={(e) => setCustomStatPoints(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      <div className="flex items-end pb-0.5">
                        <Button onClick={handleAddCustomStat} size="icon" className="h-10 w-10" disabled={!customStatName}>
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <Button 
                      variant="ghost" 
                      size="lg" 
                      onClick={() => setStep(1)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="mr-2 w-4 h-4" /> Back
                    </Button>
                    
                    <Button 
                      size="lg" 
                      className="rounded-full px-8"
                      onClick={() => setStep(3)}
                    >
                      Next Step <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: DRAFT & PRIVACY */}
              {step === 3 && (
                <div className="space-y-8 animate-fade-in">
                  
                  <div className="space-y-4">
                    <Label className="text-base">Draft Type</Label>
                    <RadioGroup value={draftType} onValueChange={setDraftType} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <RadioGroupItem value="snake" id="snake" className="peer sr-only" />
                        <Label
                          htmlFor="snake"
                          className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/20 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                        >
                          <Settings className="mb-3 h-6 w-6 text-muted-foreground peer-data-[state=checked]:text-primary" />
                          <span className="font-semibold">Snake Draft</span>
                          <span className="text-xs text-muted-foreground text-center mt-1">Standard alternating order (1-12, 12-1)</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="auction" id="auction" className="peer sr-only" />
                        <Label
                          htmlFor="auction"
                          className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/20 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                        >
                          <Users className="mb-3 h-6 w-6 text-muted-foreground peer-data-[state=checked]:text-primary" />
                          <span className="font-semibold">Auction Draft</span>
                          <span className="text-xs text-muted-foreground text-center mt-1">Budget-based player bidding</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Public League</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow anyone in the community to join this league
                      </p>
                    </div>
                    <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <Button 
                      variant="ghost" 
                      size="lg" 
                      onClick={() => setStep(2)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="mr-2 w-4 h-4" /> Back
                    </Button>
                    
                    <Button 
                      size="lg" 
                      className="rounded-full px-8 min-w-[160px]"
                      onClick={handleCreateLeague}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Creating...
                        </div>
                      ) : (
                        <>Create League <CheckCircle className="ml-2 w-4 h-4" /></>
                      )}
                    </Button>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateLeague;
