import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import HockeyPlayerCard, { HockeyPlayer } from "./HockeyPlayerCard";

interface BenchGridProps {
  players: HockeyPlayer[];
  onPlayerClick?: (player: HockeyPlayer) => void;
  className?: string;
}

const BenchGrid = ({ players, onPlayerClick, className }: BenchGridProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'bench-grid',
    data: {
      type: 'bench',
    },
  });

  const playerIds = players.map(p => p.id);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          Bench
          <Badge variant="outline" className="ml-2">
            {players.length} players
          </Badge>
        </h2>
      </div>

      <Card
        ref={setNodeRef}
        className={cn(
          "p-4 min-h-[300px] transition-all",
          "border-2",
          isOver && "border-primary bg-primary/5 border-dashed",
          !isOver && "border-border"
        )}
      >
        {players.length > 0 ? (
          <SortableContext items={playerIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {players.map((player) => (
                <HockeyPlayerCard
                  key={player.id}
                  player={player}
                  isInSlot={false}
                  onClick={() => onPlayerClick?.(player)}
                />
              ))}
            </div>
          </SortableContext>
        ) : (
          <div className={cn(
            "flex items-center justify-center h-64 rounded-lg border-2 border-dashed",
            isOver ? "border-primary bg-primary/10" : "border-muted-foreground/20 bg-muted/10"
          )}>
            <div className="text-center">
              <p className={cn(
                "text-sm font-medium mb-1",
                isOver ? "text-primary" : "text-muted-foreground"
              )}>
                {isOver ? "Drop players here" : "No bench players"}
              </p>
              <p className="text-xs text-muted-foreground">
                Drag players from starters or add from free agents
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BenchGrid;

