
import { useState, useEffect } from "react";

interface LiveUpdatesProps {
  updates: string[];
}

export const LiveUpdates = ({ updates }: LiveUpdatesProps) => {
  const [currentUpdateIndex, setCurrentUpdateIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUpdateIndex(prev => (prev + 1) % updates.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [updates.length]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-fantasy-primary/90 to-fantasy-secondary/90 text-white py-3 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-center">
        <div className="animate-bounce mr-2">⚡</div>
        <div className="text-sm font-medium animate-fade-in">{updates[currentUpdateIndex]}</div>
      </div>
    </div>
  );
};
