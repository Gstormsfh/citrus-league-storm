
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import { Brain, Zap, Sparkles } from 'lucide-react';

const demoMessages = [
  {
    question: "Who should I start at flex this week? I have Diontae Johnson vs CHI or Kenneth Walker vs DET?",
    answer: "I'd recommend starting Kenneth Walker against Detroit. The Lions' defense allows the 3rd most fantasy points to RBs this season, and Walker has seen 15+ carries in his last three games. Johnson's target share is promising, but Chicago's defense has been strong against WR2s."
  },
  {
    question: "What's Tyler Lockett's outlook for rest of season?",
    answer: "Tyler Lockett's rest-of-season outlook is cautiously optimistic. While his target share has decreased with Jaxon Smith-Njigba's emergence, he maintains red zone value. Expect WR3 production with occasional boom weeks, particularly in favorable matchups against ATL (Week 12) and LAR (Week 15)."
  },
  {
    question: "Should I trade Justin Jefferson for Tyreek Hill and Rhamondre Stevenson?",
    answer: "Yes, I would make that trade. While Jefferson is elite, Hill is currently the WR1 in fantasy with consistent production. Adding Stevenson gives you a solid RB2 with upside in the Patriots' offense. The combined value outweighs what Jefferson alone provides, especially if you need depth."
  }
];

const StormySection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeDemo, setActiveDemo] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  const [demoInterval, setDemoInterval] = useState<number | null>(null);

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
                <div className="mb-4">
                  <div className="bg-citrus-green-light/30 rounded-lg rounded-tl-none p-4 max-w-[85%]">
                    <p className="text-sm text-foreground/80">{demoMessages[activeDemo].question}</p>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-end space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
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
              </div>
              
              <div className="p-4 border-t border-gray-100 flex justify-center">
                <div className="flex space-x-2">
                  {demoMessages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => navigateDemo(index)}
                      className={`w-2 h-2 rounded-full ${
                        activeDemo === index ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StormySection;
