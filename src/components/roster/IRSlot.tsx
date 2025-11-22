import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import HockeyPlayerCard, { HockeyPlayer } from "./HockeyPlayerCard";
import { Plus, AlertCircle } from "lucide-react";

interface IRSlotProps {
  players: HockeyPlayer[];
  onPlayerClick?: (player: HockeyPlayer) => void;
  className?: string;
}

const IRSlot = ({ players, onPlayerClick, className }: IRSlotProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'ir-slot',
    data: {
      type: 'ir',
      maxPlayers: 3,
    },
  });

  const playerIds = players.map(p => p.id);
  const isFull = players.length >= 3;
  const isEmpty = players.length === 0;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          Injured Reserve
          <Badge variant="outline" className="ml-2 text-xs">
            {players.length}/3
          </Badge>
        </h2>
      </div>

      <Card
        ref={setNodeRef}
        className={cn(
          "p-4 min-h-[200px] transition-all rounded-md",
          "border-2",
          isOver && "border-red-500 bg-red-500/5 border-dashed",
          !isOver && isEmpty && "border-dashed border-muted-foreground/20 bg-muted/5",
          !isOver && !isEmpty && "border-border/50 bg-card/50",
          isFull && !isOver && "border-red-500/30 bg-red-500/5"
        )}
      >
        {players.length > 0 ? (
          <SortableContext items={playerIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
            "flex items-center justify-center min-h-[140px] rounded border border-dashed transition-all",
            isOver ? "border-red-500 bg-red-500/10 border-2" : "border-muted-foreground/20 bg-muted/5"
          )}>
            <div className="text-center">
              <Plus className={cn(
                "h-6 w-6 mx-auto mb-1.5 transition-colors",
                isOver ? "text-red-500" : "text-muted-foreground/40"
              )} />
              <p className={cn(
                "text-xs font-medium",
                isOver ? "text-red-500" : "text-muted-foreground/60"
              )}>
                {isOver ? "Drop IR player here" : "No IR players"}
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                Max 3 players (IR/Out status)
              </p>
            </div>
          </div>
        )}

        {/* Full indicator */}
        {isFull && !isEmpty && (
          <div className="mt-3 pt-2 border-t border-border/30 text-center">
            <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/30 font-medium">
              Full (3/3)
            </Badge>
          </div>
        )}
      </Card>
    </div>
  );
};

export default IRSlot;

