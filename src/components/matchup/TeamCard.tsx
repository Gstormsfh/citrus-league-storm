import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MatchupPlayer } from "./types";

interface TeamCardProps {
  title: string;
  starters: MatchupPlayer[];
  bench: MatchupPlayer[];
  gradientClass: string;
  slotAssignments?: Record<string, string>;
  onPlayerClick?: (player: MatchupPlayer) => void;
}

export const TeamCard = ({ title, starters, bench, gradientClass, slotAssignments = {}, onPlayerClick }: TeamCardProps) => {
  
  // Helper to calculate daily points
  const getDailyPoints = (stats: { goals?: number; assists?: number; sog?: number; blk?: number }) => {
    if (!stats) return 0;
    // Simplified calculation for demo: G=3, A=2, SOG=0.4, BLK=0.4
    return ((stats.goals || 0) * 3 + (stats.assists || 0) * 2 + (stats.sog || 0) * 0.4 + (stats.blk || 0) * 0.4).toFixed(1);
  };

  // Helper to normalize position for grouping
  const normalizePosition = (position: string): string => {
    const pos = position?.toUpperCase() || '';
    if (pos.includes('C') && !pos.includes('LW') && !pos.includes('RW')) return 'C';
    if (pos.includes('LW')) return 'LW';
    if (pos.includes('RW')) return 'RW';
    if (pos.includes('D')) return 'D';
    if (pos.includes('G')) return 'G';
    return 'UTIL';
  };

  // Position color mapping matching RosterDepthChart
  const getPositionStyles = (position: string, isBench: boolean = false) => {
    if (isBench) return { bg: '', border: '', text: '' };
    
    const pos = normalizePosition(position);
    const styles: Record<string, { bg: string; border: string; text: string }> = {
      'C': {
        bg: 'bg-fantasy-primary/10',
        border: 'border-l-4 border-fantasy-primary',
        text: 'text-fantasy-primary'
      },
      'LW': {
        bg: 'bg-fantasy-secondary/10',
        border: 'border-l-4 border-fantasy-secondary',
        text: 'text-fantasy-secondary'
      },
      'RW': {
        bg: 'bg-fantasy-tertiary/10',
        border: 'border-l-4 border-fantasy-tertiary',
        text: 'text-fantasy-tertiary'
      },
      'D': {
        bg: 'bg-blue-50',
        border: 'border-l-4 border-blue-500',
        text: 'text-blue-600'
      },
      'G': {
        bg: 'bg-purple-50',
        border: 'border-l-4 border-purple-500',
        text: 'text-purple-600'
      },
      'UTIL': {
        bg: 'bg-yellow-50',
        border: 'border-l-4 border-yellow-500',
        text: 'text-yellow-600'
      }
    };
    
    return styles[pos] || { bg: '', border: '', text: '' };
  };

  // Slot order matching roster tab lineup structure
  // Handles both numbered slots (slot-C-1) and unnumbered slots (slot-C)
  const slotOrder = [
    'slot-C-1', 'slot-C-2', 'slot-C',
    'slot-RW-1', 'slot-RW-2', 'slot-RW',
    'slot-LW-1', 'slot-LW-2', 'slot-LW',
    'slot-D-1', 'slot-D-2', 'slot-D-3', 'slot-D-4', 'slot-D',
    'slot-G-1', 'slot-G-2', 'slot-G',
    'slot-UTIL'
  ];

  // Order starters by their slot assignments (exactly as in roster tab)
  const orderStartersBySlots = (players: MatchupPlayer[]): MatchupPlayer[] => {
    // Create a map for quick slot order lookup
    const slotOrderMap = new Map<string, number>();
    slotOrder.forEach((slot, index) => {
      slotOrderMap.set(slot, index);
    });

    // Sort players by their slot assignment
    const sorted = [...players].sort((a, b) => {
      const slotA = slotAssignments[String(a.id)] || '';
      const slotB = slotAssignments[String(b.id)] || '';
      
      // Get order index for each slot (or -1 if not found)
      const orderA = slotOrderMap.get(slotA) ?? -1;
      const orderB = slotOrderMap.get(slotB) ?? -1;
      
      // If both have valid slots, sort by order
      if (orderA >= 0 && orderB >= 0) {
        return orderA - orderB;
      }
      
      // If only one has a valid slot, it comes first
      if (orderA >= 0) return -1;
      if (orderB >= 0) return 1;
      
      // If neither has a slot assignment, maintain original order
      return 0;
    });

    return sorted;
  };

  // Order starters using slot assignments (no filtering - use exact lineup from roster)
  const organizedStarters = orderStartersBySlots(starters);
  const finalBench = bench;

  const renderMobilePlayerRow = (player: MatchupPlayer, isBench: boolean = false) => {
    const posStyles = getPositionStyles(player.position, isBench);
    return (
    <div 
      key={player.id} 
      className={`p-3 border-b border-border/40 ${player.isToday ? 'bg-primary/5' : ''} ${isBench ? 'opacity-80' : ''} ${posStyles.bg} ${posStyles.border} cursor-pointer hover:bg-muted/50 transition-colors`}
      onClick={() => onPlayerClick?.(player)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground overflow-hidden border border-border/50 shadow-sm">
            {player.team}
          </div>
          <div>
             <div className="font-semibold text-sm flex items-center gap-1.5 leading-none mb-1 text-foreground/90">
               {player.name}
               {player.isToday && (
                 <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[8px] font-bold text-primary ring-1 ring-inset ring-primary/20">
                   TODAY
                 </span>
               )}
             </div>
             <div className="text-[11px] text-muted-foreground leading-none mt-0.5 flex items-center gap-1">
               <span className={`font-medium ${posStyles.text ? `${posStyles.text} font-bold` : ''}`}>{player.position}</span>
               <span>•</span>
               {player.gameInfo ? (
                 <span className={`${player.status === 'In Game' ? 'text-primary font-medium' : ''}`}>
                   {player.gameInfo.opponent} {player.gameInfo.score ? `(${player.gameInfo.score})` : ''} {player.gameInfo.time ? `• ${player.gameInfo.time}` : ''}
                 </span>
               ) : (
                 <span>{player.status}</span>
               )}
             </div>
          </div>
        </div>
        <div className="text-right">
           <div className={`text-base leading-none ${posStyles.text ? `${posStyles.text} font-bold` : 'font-bold'}`}>{player.points}</div>
           {player.isToday && (
             <div className="text-[10px] text-primary font-medium mt-0.5">+{getDailyPoints(player.stats)}</div>
           )}
        </div>
      </div>
      
      {/* Mobile Stats Grid */}
      <div className="grid grid-cols-4 gap-1 bg-muted/30 rounded p-1.5 text-[10px] text-center">
         <div>
            <span className="text-muted-foreground block text-[9px] uppercase">G</span>
            <span className={`font-bold ${player.stats?.goals > 0 ? 'text-foreground' : 'text-muted-foreground/50'}`}>{player.stats?.goals || 0}</span>
         </div>
         <div>
            <span className="text-muted-foreground block text-[9px] uppercase">A</span>
            <span className={`font-bold ${player.stats?.assists > 0 ? 'text-foreground' : 'text-muted-foreground/50'}`}>{player.stats?.assists || 0}</span>
         </div>
         <div>
            <span className="text-muted-foreground block text-[9px] uppercase">SOG</span>
            <span className="text-muted-foreground/70">{player.stats?.sog || 0}</span>
         </div>
         <div>
            <span className="text-muted-foreground block text-[9px] uppercase">BLK</span>
            <span className="text-muted-foreground/70">{player.stats?.blk || 0}</span>
         </div>
      </div>
    </div>
    );
  };

  return (
    <Card className="card-citrus p-0 overflow-hidden border-none shadow-md">
      <CardHeader className={`${gradientClass} py-4 border-b bg-white`}>
        <CardTitle className="text-lg font-bold tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        
        {/* STARTERS */}
        <div className="bg-muted/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
          Starting Lineup
        </div>
        
        {/* Mobile View */}
        <div className="md:hidden">
           {organizedStarters.map(p => renderMobilePlayerRow(p, false))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="w-12 text-xs font-semibold text-muted-foreground h-9">Pos</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground h-9">Player</TableHead>
                <TableHead className="w-8 text-center text-[10px] font-bold text-muted-foreground h-9 p-0">G</TableHead>
                <TableHead className="w-8 text-center text-[10px] font-bold text-muted-foreground h-9 p-0">A</TableHead>
                <TableHead className="w-10 text-center text-[10px] font-bold text-muted-foreground h-9 p-0">SOG</TableHead>
                <TableHead className="w-10 text-center text-[10px] font-bold text-muted-foreground h-9 p-0">BLK</TableHead>
                <TableHead className="w-16 text-right text-xs font-semibold text-muted-foreground h-9">Pts</TableHead>
                <TableHead className="w-24 text-right text-xs font-semibold text-muted-foreground h-9">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizedStarters.map(player => {
                const posStyles = getPositionStyles(player.position, false);
                return (
                <TableRow 
                  key={player.id} 
                  className={`hover:bg-muted/10 border-b border-border/40 ${player.isToday ? 'bg-primary/5' : ''} ${posStyles.bg} ${posStyles.border} cursor-pointer`}
                  onClick={() => onPlayerClick?.(player)}
                >
                  <TableCell className={`w-12 font-medium text-xs border-r border-border/20 py-3 ${posStyles.text ? `${posStyles.text} font-bold` : 'text-muted-foreground'}`}>{player.position}</TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground overflow-hidden border border-border/50 shadow-sm">
                        {player.team}
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="font-semibold text-sm flex items-center gap-2 leading-none mb-1 text-foreground/90 hover:text-primary transition-colors">
                          {player.name}
                          {player.isToday && (
                            <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary ring-1 ring-inset ring-primary/20">
                              TODAY
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-none mt-0.5">
                          {player.gameInfo ? (
                             <span className="flex items-center gap-1">
                               <span className="font-medium text-foreground/80">{player.gameInfo.opponent}</span>
                               {player.gameInfo.time && <span>• {player.gameInfo.time}</span>}
                               {player.gameInfo.score && <span>• {player.gameInfo.score}</span>}
                               {player.gameInfo.period && <span className="text-primary font-medium">• {player.gameInfo.period}</span>}
                             </span>
                           ) : (
                             <span>{player.team} • {player.gamesRemaining} Gms Left</span>
                           )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Stats Columns */}
                  <TableCell className="w-8 text-center p-0">
                    <span className={`text-xs ${player.stats?.goals > 0 ? 'font-bold text-foreground' : 'text-muted-foreground/30'}`}>
                      {player.stats?.goals || 0}
                    </span>
                  </TableCell>
                  <TableCell className="w-8 text-center p-0">
                    <span className={`text-xs ${player.stats?.assists > 0 ? 'font-bold text-foreground' : 'text-muted-foreground/30'}`}>
                      {player.stats?.assists || 0}
                    </span>
                  </TableCell>
                  <TableCell className="w-10 text-center p-0">
                    <span className="text-xs text-muted-foreground/70">
                      {player.stats?.sog || 0}
                    </span>
                  </TableCell>
                  <TableCell className="w-10 text-center p-0">
                    <span className="text-xs text-muted-foreground/70">
                      {player.stats?.blk || 0}
                    </span>
                  </TableCell>

                  <TableCell className="text-right font-bold w-16 border-l border-border/20 bg-muted/5 py-3">
                    <div className="flex flex-col items-end justify-center h-full leading-tight">
                      <span className="text-sm">{player.points}</span>
                      {player.isToday && (
                        <span className="text-[10px] text-primary font-medium">+{getDailyPoints(player.stats)}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right w-24 py-3">
                    <div className={`text-xs font-medium ${player.status === 'In Game' ? 'text-primary animate-pulse font-bold' : 'text-muted-foreground'}`}>
                      {player.status}
                    </div>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* BENCH SECTION */}
        {finalBench.length > 0 && (
          <>
            <div className="bg-muted/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-y mt-4">
              Bench
            </div>
            
            {/* Mobile View Bench */}
            <div className="md:hidden">
               {finalBench.map(p => renderMobilePlayerRow(p, true))}
            </div>

            {/* Desktop View Bench */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    <TableHead className="w-12 text-xs font-semibold text-muted-foreground h-9">Pos</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground h-9">Player</TableHead>
                    <TableHead className="w-8 text-center text-[10px] font-bold text-muted-foreground h-9 p-0">G</TableHead>
                    <TableHead className="w-8 text-center text-[10px] font-bold text-muted-foreground h-9 p-0">A</TableHead>
                    <TableHead className="w-10 text-center text-[10px] font-bold text-muted-foreground h-9 p-0">SOG</TableHead>
                    <TableHead className="w-10 text-center text-[10px] font-bold text-muted-foreground h-9 p-0">BLK</TableHead>
                    <TableHead className="w-16 text-right text-xs font-semibold text-muted-foreground h-9">Pts</TableHead>
                    <TableHead className="w-24 text-right text-xs font-semibold text-muted-foreground h-9">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finalBench.map(player => (
                <TableRow 
                  key={player.id} 
                  className={`hover:bg-muted/10 opacity-70 hover:opacity-100 transition-opacity border-b border-border/40 ${player.isToday ? 'bg-primary/5' : ''} cursor-pointer`}
                  onClick={() => onPlayerClick?.(player)}
                >
                  <TableCell className="w-12 font-medium text-muted-foreground text-xs border-r border-border/20 py-3">BN</TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground overflow-hidden border border-border/50 shadow-sm">
                        {player.team}
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="font-medium text-sm flex items-center gap-2 leading-none mb-1 text-foreground/90 hover:text-primary transition-colors">
                          {player.name}
                              {player.isToday && (
                                <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground ring-1 ring-inset ring-border">
                                  TODAY
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground leading-none mt-0.5">
                              {player.gameInfo ? (
                                 <span className="flex items-center gap-1">
                                   <span className="font-medium text-foreground/80">{player.gameInfo.opponent}</span>
                                   {player.gameInfo.score && <span>• {player.gameInfo.score}</span>}
                                   {player.gameInfo.time && <span>• {player.gameInfo.time}</span>}
                                 </span>
                               ) : (
                                 <span>{player.team} • {player.gamesRemaining} Gms Left</span>
                               )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      {/* Stats Columns */}
                      <TableCell className="w-8 text-center p-0">
                        <span className={`text-xs ${player.stats?.goals > 0 ? 'font-bold text-foreground' : 'text-muted-foreground/30'}`}>
                          {player.stats?.goals || 0}
                        </span>
                      </TableCell>
                      <TableCell className="w-8 text-center p-0">
                        <span className={`text-xs ${player.stats?.assists > 0 ? 'font-bold text-foreground' : 'text-muted-foreground/30'}`}>
                          {player.stats?.assists || 0}
                        </span>
                      </TableCell>
                      <TableCell className="w-10 text-center p-0">
                        <span className="text-xs text-muted-foreground/70">
                          {player.stats?.sog || 0}
                        </span>
                      </TableCell>
                      <TableCell className="w-10 text-center p-0">
                        <span className="text-xs text-muted-foreground/70">
                          {player.stats?.blk || 0}
                        </span>
                      </TableCell>

                      <TableCell className="text-right font-medium text-muted-foreground w-16 border-l border-border/20 bg-muted/5 py-3">
                        <div className="flex flex-col items-end justify-center h-full leading-tight">
                          <span className="text-sm">{player.points}</span>
                          {player.isToday && (
                            <span className="text-[10px] text-muted-foreground">+{getDailyPoints(player.stats)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right w-24 py-3">
                          <div className="text-xs text-muted-foreground">{player.status}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
