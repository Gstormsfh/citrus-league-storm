import React from 'react';
import { cn } from '@/lib/utils';

export type LoadingCharacter = 'citrus' | 'narwhal';

interface LoadingScreenProps {
  character?: LoadingCharacter;
  message?: string;
  progress?: number; // 0-100
  className?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  character = 'citrus',
  message = 'Loading...',
  progress = undefined,
  className,
}) => {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'bg-[#D4E8B8]', // Light green background matching the design
        className
      )}
    >
      {/* App Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">CITRUS</h1>
        <h2 className="text-xl md:text-2xl font-medium text-white/90">FANTASY SPORTS</h2>
      </div>

      {/* Character and Net */}
      <div className="relative mb-12 flex items-center justify-center">
        {character === 'citrus' ? <CitrusCharacter /> : <NarwhalCharacter />}
        <HockeyNet />
      </div>

      {/* Loading Bar */}
      <div className="w-64 md:w-80 max-w-[90%] mb-4">
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              'bg-gradient-to-r from-[#FFA366] via-[#FFCC33] to-[#9BCF4A]' // Orange to yellow to green gradient
            )}
            style={{
              width: progress !== undefined ? `${Math.min(100, Math.max(0, progress))}%` : '60%',
              animation: progress === undefined ? 'pulse 2s ease-in-out infinite' : 'none',
            }}
          />
        </div>
      </div>

      {/* Loading Message */}
      <p className="text-white text-sm md:text-base font-medium">{message}</p>

      {/* Bottom Right Icon */}
      <div className="absolute bottom-4 right-4">
        <div className="w-3 h-3 border border-white/40 rotate-45" />
      </div>
    </div>
  );
};

// Citrus Character Component
const CitrusCharacter: React.FC = () => {
  return (
    <div className="relative z-10">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Body (Orange Circle) */}
        <circle cx="60" cy="60" r="35" fill="#FFA366" />
        
        {/* Face Details */}
        <circle cx="50" cy="55" r="3" fill="#1E293B" /> {/* Left Eye */}
        <circle cx="70" cy="55" r="3" fill="#1E293B" /> {/* Right Eye */}
        <path
          d="M 50 70 Q 60 75 70 70"
          stroke="#1E293B"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        /> {/* Smile */}
        
        {/* Hockey Helmet */}
        <ellipse cx="60" cy="45" rx="38" ry="25" fill="white" opacity="0.9" />
        <line x1="40" y1="45" x2="80" y2="45" stroke="#1E293B" strokeWidth="1.5" /> {/* Visor */}
        
        {/* Arms */}
        <line
          x1="35"
          y1="70"
          x2="25"
          y2="85"
          stroke="#FFA366"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="85"
          y1="70"
          x2="95"
          y2="85"
          stroke="#FFA366"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Legs */}
        <line
          x1="50"
          y1="90"
          x2="50"
          y2="105"
          stroke="#FFA366"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="70"
          y1="90"
          x2="70"
          y2="105"
          stroke="#FFA366"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Hockey Stick */}
        <line
          x1="95"
          y1="85"
          x2="105"
          y2="75"
          stroke="#8B4513"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="105"
          y1="75"
          x2="115"
          y2="70"
          stroke="#8B4513"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Puck */}
        <ellipse cx="115" cy="70" rx="4" ry="2" fill="#1E40AF" />
      </svg>
    </div>
  );
};

// Narwhal Character Component
const NarwhalCharacter: React.FC = () => {
  return (
    <div className="relative z-10">
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Body */}
        <ellipse cx="70" cy="75" rx="40" ry="30" fill="#87CEEB" />
        <ellipse cx="70" cy="80" rx="35" ry="25" fill="white" /> {/* Belly */}
        
        {/* Face */}
        <circle cx="60" cy="70" r="2.5" fill="#1E293B" /> {/* Left Eye */}
        <circle cx="80" cy="70" r="2.5" fill="#1E293B" /> {/* Right Eye */}
        <path
          d="M 65 80 Q 70 83 75 80"
          stroke="#1E293B"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        /> {/* Smile */}
        
        {/* Horn (Tusk) */}
        <path
          d="M 70 50 Q 75 30 85 20"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 72 52 Q 77 32 87 22"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        
        {/* Flippers */}
        <ellipse cx="40" cy="75" rx="8" ry="15" fill="#87CEEB" />
        <ellipse cx="100" cy="75" rx="8" ry="15" fill="#87CEEB" />
        
        {/* Hockey Helmet */}
        <ellipse cx="70" cy="65" rx="42" ry="28" fill="white" opacity="0.9" />
        <ellipse cx="70" cy="65" rx="38" ry="24" fill="transparent" stroke="#1E293B" strokeWidth="1" />
        <line x1="35" y1="65" x2="105" y2="65" stroke="#1E293B" strokeWidth="1.5" /> {/* Visor */}
        
        {/* Feet/Boots */}
        <ellipse cx="55" cy="105" rx="8" ry="5" fill="white" />
        <ellipse cx="85" cy="105" rx="8" ry="5" fill="white" />
        
        {/* Hockey Stick */}
        <line
          x1="100"
          y1="75"
          x2="110"
          y2="65"
          stroke="#1E40AF"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="110"
          y1="65"
          x2="120"
          y2="60"
          stroke="#1E40AF"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Puck */}
        <ellipse cx="120" cy="60" rx="4" ry="2" fill="#DC2626" />
      </svg>
    </div>
  );
};

// Hockey Net Component
const HockeyNet: React.FC = () => {
  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 md:translate-x-12">
      <svg
        width="60"
        height="50"
        viewBox="0 0 60 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        {/* Net Frame */}
        <rect x="0" y="0" width="60" height="50" rx="2" fill="none" stroke="#DC2626" strokeWidth="2" />
        
        {/* Netting - Vertical Lines */}
        <line x1="10" y1="0" x2="10" y2="50" stroke="#9BCF4A" strokeWidth="1" opacity="0.6" />
        <line x1="20" y1="0" x2="20" y2="50" stroke="#9BCF4A" strokeWidth="1" opacity="0.6" />
        <line x1="30" y1="0" x2="30" y2="50" stroke="#9BCF4A" strokeWidth="1" opacity="0.6" />
        <line x1="40" y1="0" x2="40" y2="50" stroke="#9BCF4A" strokeWidth="1" opacity="0.6" />
        <line x1="50" y1="0" x2="50" y2="50" stroke="#9BCF4A" strokeWidth="1" opacity="0.6" />
        
        {/* Netting - Horizontal Lines */}
        <line x1="0" y1="10" x2="60" y2="10" stroke="#9BCF4A" strokeWidth="1" opacity="0.6" />
        <line x1="0" y1="20" x2="60" y2="20" stroke="#9BCF4A" strokeWidth="1" opacity="0.6" />
        <line x1="0" y1="30" x2="60" y2="30" stroke="#9BCF4A" strokeWidth="1" opacity="0.6" />
        <line x1="0" y1="40" x2="60" y2="40" stroke="#9BCF4A" strokeWidth="1" opacity="0.6" />
      </svg>
    </div>
  );
};

export default LoadingScreen;

