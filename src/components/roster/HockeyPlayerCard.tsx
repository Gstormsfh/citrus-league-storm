import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertCircle, Shield, CalendarDays } from "lucide-react";
import { useState } from "react";

export interface HockeyPlayer {
  id: number;
  name: string;
  position: string; // 'Centre', 'Right Wing', 'Left Wing', 'Defence', 'Goalie'
  number: number;
  starter: boolean;
  stats: {
    // Skater stats
    goals?: number;
    assists?: number;
    points?: number;
    plusMinus?: number;
    shots?: number;
    blockedShots?: number;
    hits?: number;
    powerPlayPoints?: number;
    shortHandedPoints?: number;
    pim?: number;
    gamesPlayed?: number;
    toi?: string; // Time on ice, e.g., "21:34"
    toiPercentage?: number; // Percentage of team's total TOI
    // Goalie stats
    wins?: number;
    losses?: number;
    otl?: number;
    gaa?: number;
    savePct?: number;
    shutouts?: number;
  };
  team: string;
  teamAbbreviation?: string; // e.g., "EDM", "COL"
  status?: 'IR' | 'SUSP' | 'GTD' | 'WVR' | null; // Injury Reserve, Suspended, Game Time Decision, Waiver
  height?: string;
  weight?: string;
  age?: number;
  experience?: string;
  image?: string;
  nextGame?: {
    opponent: string; // e.g. "vs BOS", "@ NYR"
    isToday: boolean;
  };
  projectedPoints?: number;
}

interface HockeyPlayerCardProps {
  player: HockeyPlayer;
  onClick?: () => void;
  draggable?: boolean;
  className?: string;
  isInSlot?: boolean; // Whether the card is in a starter slot
}

const HockeyPlayerCard = ({ 
  player, 
  onClick, 
  draggable = true, 
  className,
  isInSlot = false 
}: HockeyPlayerCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });
  
  const [imageError, setImageError] = useState(false);

  const style = draggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  const getPositionAbbreviation = (position: string): string => {
    switch (position) {
      case 'Centre': return 'C';
      case 'Right Wing': return 'RW';
      case 'Left Wing': return 'LW';
      case 'Defence': return 'D';
      case 'Goalie': return 'G';
      default: return position.substring(0, 2).toUpperCase();
    }
  };

  const getTeamAbbreviation = (): string => {
    if (player.teamAbbreviation) return player.teamAbbreviation;
    // Extract abbreviation from team name (last word, first 3 letters)
    const words = player.team.split(' ');
    return words[words.length - 1].substring(0, 3).toUpperCase();
  };

  const getStatusBadge = () => {
    if (!player.status) return null;
    
    const statusConfig = {
      'IR': { label: 'IR', variant: 'destructive' as const, color: 'bg-red-500' },
      'SUSP': { label: 'SUSP', variant: 'destructive' as const, color: 'bg-orange-500' },
      'GTD': { label: 'GTD', variant: 'secondary' as const, color: 'bg-yellow-500' },
      'WVR': { label: 'WVR', variant: 'outline' as const, color: 'bg-blue-500' },
    };

    const config = statusConfig[player.status];
    if (!config) return null;

    return (
      <Badge 
        variant={config.variant}
        className={cn("absolute top-0.5 left-0.5 text-[7px] font-bold h-3 px-1 z-10", config.color, "text-white")}
      >
        {config.label}
      </Badge>
    );
  };

  const isGoalie = player.position === 'Goalie';
  const positionAbbr = getPositionAbbreviation(player.position);
  const teamAbbr = getTeamAbbreviation();
  const teamLogoUrl = `https://assets.nhle.com/logos/nhl/svg/${player.teamAbbreviation || 'NHL'}_light.svg`;

  // Projection & Game Data Logic
  const hasGameToday = player.nextGame?.isToday;
  const projectedPoints = hasGameToday ? (player.projectedPoints || 0) : 0;
  const maxProjectedPoints = 8; // Assumed "full bar" value for a great game
  const projectionPercentage = Math.min((projectedPoints / maxProjectedPoints) * 100, 100);

  const dragProps = draggable ? {
    ...attributes,
    ...listeners,
  } : {};

  return (
    <Card
      ref={draggable ? setNodeRef : undefined}
      style={style}
      {...dragProps}
      className={cn(
        "relative overflow-hidden cursor-grab active:cursor-grabbing transition-all",
        "border hover:shadow-md h-[110px] flex flex-col",
        isInSlot 
          ? "border-border/60 bg-card" 
          : "border-border/40 hover:border-primary/50",
        isDragging && "shadow-xl z-50 opacity-90",
        className
      )}
      onClick={onClick}
    >
      {/* Compact Header Section */}
      <div className="relative p-1.5 bg-muted/30 border-b border-border/30 flex items-center gap-1.5 min-h-[35px]">
        {/* Status Badge */}
        {getStatusBadge()}

        {/* Team Logo */}
        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-white rounded-full shadow-sm p-0.5">
           {!imageError ? (
             <img 
               src={teamLogoUrl} 
               alt={teamAbbr} 
               className="w-full h-full object-contain"
               onError={() => setImageError(true)}
             />
           ) : (
             <Shield className="w-4 h-4 text-muted-foreground/50" />
           )}
        </div>

        {/* Player Name and Team */}
        <div className="flex-1 min-w-0 pr-5">
          <h3 
            className="font-semibold text-[10px] leading-3 line-clamp-2 cursor-pointer hover:underline decoration-primary/50"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            {player.name}
          </h3>
          <div className="flex items-center text-[8px] text-muted-foreground mt-0.5">
            <span className="font-medium">{teamAbbr}</span>
            <span className="mx-1">•</span>
            <span>#{player.number}</span>
          </div>
        </div>

        {/* Position Badge - absolute top right */}
        <Badge 
          variant="outline"
          className="absolute top-0.5 right-0.5 text-[8px] font-bold h-3 px-1 border-border/50 bg-background/50"
        >
          {positionAbbr}
        </Badge>
      </div>

      {/* Compact Stats Grid - Flex grow to fill space */}
      <div className="p-1 bg-card flex-1 flex items-center justify-center">
        {isGoalie ? (
          // Goalie Stats - compact
          <div className="grid grid-cols-3 gap-0.5 text-center w-full">
            <div>
              <div className="text-[7px] text-muted-foreground uppercase leading-none mb-0.5">W</div>
              <div className="font-bold text-[9px]">{player.stats.wins || 0}</div>
            </div>
            <div>
              <div className="text-[7px] text-muted-foreground uppercase leading-none mb-0.5">GAA</div>
              <div className="font-bold text-[9px]">{player.stats.gaa?.toFixed(2) || '0.00'}</div>
            </div>
            <div>
              <div className="text-[7px] text-muted-foreground uppercase leading-none mb-0.5">SV%</div>
              <div className="font-bold text-[9px]">
                {player.stats.savePct ? (player.stats.savePct * 100).toFixed(1) : '0.0'}%
              </div>
            </div>
          </div>
        ) : (
          // Skater Stats - compact single row
          <div className="grid grid-cols-4 gap-0.5 text-center w-full">
            <div>
              <div className="text-[7px] text-muted-foreground uppercase leading-none mb-0.5">G</div>
              <div className="font-bold text-[9px]">{player.stats.goals || 0}</div>
            </div>
            <div>
              <div className="text-[7px] text-muted-foreground uppercase leading-none mb-0.5">A</div>
              <div className="font-bold text-[9px]">{player.stats.assists || 0}</div>
            </div>
            <div>
              <div className="text-[7px] text-muted-foreground uppercase leading-none mb-0.5">+/-</div>
              <div className={cn(
                "font-bold text-[9px]",
                (player.stats.plusMinus || 0) > 0 && "text-emerald-600",
                (player.stats.plusMinus || 0) < 0 && "text-red-600"
              )}>
                {(player.stats.plusMinus || 0) > 0 ? '+' : ''}{player.stats.plusMinus || 0}
              </div>
            </div>
            <div>
              <div className="text-[7px] text-muted-foreground uppercase leading-none mb-0.5">SOG</div>
              <div className="font-bold text-[9px]">{player.stats.shots || 0}</div>
            </div>
          </div>
        )}
      </div>

      {/* Projected Points / Game Bar */}
      <div className="px-1.5 pb-1.5 pt-1 bg-muted/20 flex flex-col justify-center gap-1 border-t border-border/30 min-h-[28px]">
        <div className="flex items-center justify-between h-3">
          <div className="flex items-center gap-1">
            {hasGameToday ? (
              <>
                <CalendarDays className="w-2 h-2 text-green-600" />
                <span className="text-[8px] font-bold text-green-700 truncate max-w-[50px]">
                   {player.nextGame?.opponent}
                </span>
              </>
            ) : (
               <span className="text-[8px] text-muted-foreground/50">No Game</span>
            )}
          </div>
          
          <div className="flex items-center gap-0.5">
             <span className="text-[7px] text-muted-foreground uppercase font-medium">PROJ</span>
             <span className={cn(
               "text-[9px] font-bold",
               hasGameToday ? "text-primary" : "text-muted-foreground"
             )}>
                 {projectedPoints.toFixed(1)}
             </span>
          </div>
        </div>
        
        {/* Projection Bar */}
        <div className="h-1 bg-muted/50 rounded-full overflow-hidden border border-border/10 w-full">
          <div 
            className={cn("h-full rounded-full transition-all duration-500", 
              hasGameToday ? "bg-green-500" : "bg-transparent" 
            )}
            style={{ width: `${projectionPercentage}%` }}
          />
        </div>
      </div>
    </Card>
  );
};

export default HockeyPlayerCard;

