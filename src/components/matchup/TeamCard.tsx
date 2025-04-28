
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MatchupPlayer } from "./types";

interface TeamCardProps {
  title: string;
  starters: MatchupPlayer[];
  bench: MatchupPlayer[];
  gradientClass: string;
}

const getStatusColor = (status: "In Game" | "Final" | "Yet to Play") => {
  switch (status) {
    case "In Game": return "bg-fantasy-secondary text-fantasy-dark animate-pulse";
    case "Final": return "bg-fantasy-muted/60 text-fantasy-dark";
    case "Yet to Play": return "bg-fantasy-light text-fantasy-dark";
    default: return "bg-fantasy-muted/60 text-fantasy-dark";
  }
};

export const TeamCard = ({ title, starters, bench, gradientClass }: TeamCardProps) => {
  return (
    <Card className="border-fantasy-border overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className={`${gradientClass} py-4`}>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 border-b border-fantasy-border bg-white">
          <h3 className="text-sm font-medium text-fantasy-muted mb-2">Starters</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Position</TableHead>
                <TableHead className="min-w-[200px]">Player</TableHead>
                <TableHead className="text-right w-[80px]">Pts</TableHead>
                <TableHead className="text-right w-[100px]">Games Left</TableHead>
                <TableHead className="text-center w-[120px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {starters.map(player => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.position}</TableCell>
                  <TableCell>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs text-fantasy-muted">{player.team}</div>
                  </TableCell>
                  <TableCell className="text-right">{player.points}</TableCell>
                  <TableCell className="text-right">{player.gamesRemaining}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getStatusColor(player.status)}>
                      {player.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {bench.length > 0 && (
          <div className="p-4 bg-fantasy-light/50">
            <h3 className="text-sm font-medium text-fantasy-muted mb-2">Bench</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Position</TableHead>
                  <TableHead className="min-w-[200px]">Player</TableHead>
                  <TableHead className="text-right w-[80px]">Pts</TableHead>
                  <TableHead className="text-right w-[100px]">Games Left</TableHead>
                  <TableHead className="text-center w-[120px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bench.map(player => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.position}</TableCell>
                    <TableCell>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-fantasy-muted">{player.team}</div>
                    </TableCell>
                    <TableCell className="text-right">{player.points}</TableCell>
                    <TableCell className="text-right">{player.gamesRemaining}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getStatusColor(player.status)}>
                        {player.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
