import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MatchupPlayer } from "./types";

interface TeamCardProps {
  title: string;
  starters: MatchupPlayer[];
  bench: MatchupPlayer[];
  gradientClass: string;
}

export const TeamCard = ({ title, starters, bench, gradientClass }: TeamCardProps) => {
  
  // Helper to calculate daily points
  const getDailyPoints = (stats: any) => {
    if (!stats) return 0;
    // Simplified calculation for demo: G=3, A=2, SOG=0.4, BLK=0.4
    return (stats.goals * 3 + stats.assists * 2 + stats.sog * 0.4 + stats.blk * 0.4).toFixed(1);
  };

  return (
    <Card className="card-citrus p-0 overflow-hidden border-none shadow-md">
      <CardHeader className={`${gradientClass} py-4 border-b bg-white`}>
        <CardTitle className="text-lg font-bold tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* STARTERS SECTION */}
        <div className="bg-muted/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
          Starting Lineup
        </div>
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
            {starters.map(player => (
              <TableRow key={player.id} className={`hover:bg-muted/10 border-b border-border/40 ${player.isToday ? 'bg-primary/5' : ''}`}>
                <TableCell className="w-12 font-medium text-muted-foreground text-xs border-r border-border/20 py-3">{player.position}</TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground overflow-hidden border border-border/50 shadow-sm">
                      {player.team}
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="font-semibold text-sm flex items-center gap-2 leading-none mb-1 text-foreground/90">
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
                             {player.gameInfo.score && <span>• {player.gameInfo.score}</span>}
                             {player.gameInfo.time && <span>• {player.gameInfo.time}</span>}
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
            ))}
          </TableBody>
        </Table>
        
        {/* BENCH SECTION */}
        {bench.length > 0 && (
          <>
            <div className="bg-muted/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-y mt-4">
              Bench
            </div>
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
                {bench.map(player => (
                  <TableRow key={player.id} className={`hover:bg-muted/10 opacity-70 hover:opacity-100 transition-opacity border-b border-border/40 ${player.isToday ? 'bg-primary/5' : ''}`}>
                    <TableCell className="w-12 font-medium text-muted-foreground text-xs border-r border-border/20 py-3">BN</TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground overflow-hidden border border-border/50 shadow-sm">
                          {player.team}
                        </div>
                        <div className="flex flex-col justify-center">
                          <div className="font-medium text-sm flex items-center gap-2 leading-none mb-1 text-foreground/90">
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
          </>
        )}
      </CardContent>
    </Card>
  );
};
