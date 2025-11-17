
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useRef, useState } from 'react';
import { Brain, Zap, Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';

const demoMessages = [
  {
    question: "Who should I start at center this week? I have Elias Pettersson vs BOS or Sebastian Aho vs NYR?",
    answer: "I'd recommend starting Sebastian Aho against New York. The Rangers' defense has been vulnerable against top-line centers, allowing the 5th most fantasy points to Cs this season. Aho has 3+ points in his last four games and faces a tired Rangers team on a back-to-back. Pettersson's matchup with Boston's strong defensive system is tougher."
  },
  {
    question: "What's Connor McDavid's outlook for rest of season?",
    answer: "McDavid's rest-of-season outlook is elite as always. He's entering his prime scoring months (January-March historically his best) and the Oilers' power play is firing on all cylinders. Expect continued dominance with favorable matchups against ARI (Week 18) and CHI (Week 20). He's a lock for 100+ points barring injury."
  },
  {
    question: "Should I trade Auston Matthews for Nathan MacKinnon and Tage Thompson?",
    answer: "Yes, I would make that trade. While Matthews is a goal-scoring machine, MacKinnon is currently leading the league in points with consistent multi-point games. Adding Thompson gives you a top-line center with elite power play time. The combined value and depth outweighs Matthews alone, especially with his recent injury history."
  }
];

const StormySection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeDemo, setActiveDemo] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  const [demoInterval, setDemoInterval] = useState<number | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isInteractive, setIsInteractive] = useState(false);

  // Typewriter effect
  useEffect(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setDisplayedAnswer("");
    
    const answer = demoMessages[activeDemo].answer;
    let index = 0;
    
    const interval = window.setInterval(() => {
      setDisplayedAnswer(prev => prev + answer[index]);
      index++;
      
      if (index === answer.length) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 20);
    
    return () => clearInterval(interval);
  }, [activeDemo]);
  
  // Auto-rotate demos
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!isAnimating) {
        setActiveDemo(prev => (prev + 1) % demoMessages.length);
      }
    }, 10000);
    
    setDemoInterval(interval);
    
    return () => {
      if (demoInterval) clearInterval(demoInterval);
    };
  }, [isAnimating]);
  
  // Manual demo navigation
  const navigateDemo = (index: number) => {
    if (demoInterval) clearInterval(demoInterval);
    setActiveDemo(index);
    setIsInteractive(false);
  };

  // Handle user input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    
    setIsInteractive(true);
    if (demoInterval) clearInterval(demoInterval);
    
    // Simulate AI response
    setIsAnimating(true);
    setDisplayedAnswer("");
    
    const response = "Thanks for asking! This is a demo version of Stormy. In the full app, I'll analyze your roster, league settings, and matchup data to provide personalized NHL fantasy advice. Sign up to get started!";
    let index = 0;
    
    const interval = window.setInterval(() => {
      setDisplayedAnswer(prev => prev + response[index]);
      index++;
      
      if (index === response.length) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 20);
    
    toast.success("Demo response - Sign up for full AI analysis!");
    setUserInput("");
  };

  return (
    <section id="stormy" ref={sectionRef} className="section-padding bg-gradient-to-br from-citrus-green-light to-citrus-yellow-light">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
            <div className="mb-8 animated-element animate">
              <div className="inline-flex items-center bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                <Brain className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm font-medium">Powered by Advanced AI</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Stormy, Your AI Assistant GM</h2>
              <p className="text-lg text-foreground/80 max-w-xl">
                Get personalized fantasy advice, lineup recommendations, and trade analysis from your AI assistant that learns your preferences and league dynamics.
              </p>
            </div>

            <div className="space-y-5 animated-element animate">
              <div className="flex items-start space-x-3">
                <div className="mt-1 bg-primary/20 rounded-full p-1">
                  <Zap size={16} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Instant Analysis</h3>
                  <p className="text-sm text-foreground/70">Get immediate answers to your fantasy questions, 24/7</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="mt-1 bg-primary/20 rounded-full p-1">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Personalized Insights</h3>
                  <p className="text-sm text-foreground/70">Stormy learns your preferences and league settings over time</p>
                </div>
              </div>
            </div>

            <div className="mt-10 animated-element animate">
              <Button size="lg" className="rounded-full">
                Try Stormy Now
              </Button>
            </div>
          </div>

          <div className="lg:w-1/2 animated-element animate">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-primary/10 p-4 flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="font-bold">Stormy</h3>
                  <p className="text-xs text-foreground/60">Your AI Assistant GM</p>
                </div>
              </div>
              
              <div className="p-5 h-[320px] overflow-y-auto">
                {!isInteractive ? (
                  <>
                    <div className="mb-4">
                      <div className="bg-citrus-green-light/30 rounded-lg rounded-tl-none p-4 max-w-[85%]">
                        <p className="text-sm text-foreground/80">{demoMessages[activeDemo].question}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="flex items-end space-x-2">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                          </svg>
                        </div>
                        <div className="bg-white rounded-lg rounded-bl-none p-4 max-w-[85%] shadow-sm border border-gray-100">
                          <p className="text-sm">{displayedAnswer}</p>
                          {isAnimating && (
                            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex items-end space-x-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                      </div>
                      <div className="bg-white rounded-lg rounded-bl-none p-4 max-w-[85%] shadow-sm border border-gray-100">
                        <p className="text-sm">{displayedAnswer}</p>
                        {isAnimating && (
                          <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-100">
                <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
                  <Input
                    type="text"
                    placeholder="Ask Stormy about your fantasy team..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!userInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                
                {!isInteractive && (
                  <div className="flex justify-center">
                    <div className="flex space-x-2">
                      {demoMessages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => navigateDemo(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            activeDemo === index ? 'bg-primary' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StormySection;
