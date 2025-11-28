import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import HockeyPlayerCard, { HockeyPlayer } from "./HockeyPlayerCard";
import { Plus } from "lucide-react";

interface PositionSlot {
  id: string;
  position: 'C' | 'LW' | 'RW' | 'D' | 'G' | 'UTIL';
  label: string;
  maxPlayers: number;
}

const positionSlots: PositionSlot[] = [
  { id: 'slot-C', position: 'C', label: 'Center', maxPlayers: 2 },
  { id: 'slot-LW', position: 'LW', label: 'Left Wing', maxPlayers: 2 },
  { id: 'slot-RW', position: 'RW', label: 'Right Wing', maxPlayers: 2 },
  { id: 'slot-D', position: 'D', label: 'Defense', maxPlayers: 4 },
  { id: 'slot-G', position: 'G', label: 'Goalie', maxPlayers: 2 },
  { id: 'slot-UTIL', position: 'UTIL', label: 'Utility', maxPlayers: 1 },
];

// Create individual slots for defense (4 slots) and goalies (2 slots)
const createIndividualSlots = (position: 'D' | 'G' | 'C' | 'LW' | 'RW', count: number): PositionSlot[] => {
  const baseSlot = positionSlots.find(s => s.position === position);
  if (!baseSlot) return [];
  
  return Array.from({ length: count }, (_, i) => ({
    ...baseSlot,
    id: `${baseSlot.id}-${i + 1}`,
    label: `${baseSlot.label} ${i + 1}`,
    maxPlayers: 1, // Each individual slot holds 1 player
  }));
};

interface StartersGridProps {
  players: HockeyPlayer[];
  slotAssignments?: Record<string | number, string>; // Map of Player ID -> Slot ID
  onPlayerClick?: (player: HockeyPlayer) => void;
  className?: string;
}

const StartersGrid = ({ players, slotAssignments = {}, onPlayerClick, className }: StartersGridProps) => {
  
  const getPlayerInSlot = (slotId: string) => {
    // Look for key in slotAssignments where value is slotId
    // Cast key to string for comparison since Object.keys returns strings
    const playerId = Object.keys(slotAssignments).find(key => slotAssignments[key as any] === slotId);
    if (!playerId) return undefined;
    
    // Loose comparison to catch both string/number IDs
    return players.find(p => String(p.id) === String(playerId));
  };

  const renderSlot = (slot: PositionSlot) => {
     const player = getPlayerInSlot(slot.id);
     const slotPlayers = player ? [player] : [];
     const isFull = !!player;
     const isEmpty = !player;

     return (
       <div key={slot.id} className="w-[14.28%] min-w-[130px] max-w-[160px] flex-shrink-0 px-1">
         <PositionSlot
           slot={slot}
           players={slotPlayers}
           isFull={isFull}
           isEmpty={isEmpty}
           onPlayerClick={onPlayerClick}
         />
       </div>
     );
  };

  // Group slots by row for visual stacking
  // Row 1: LW, C, RW (Top Left, Middle, Top Right)
  const forwardRow = [
    ...createIndividualSlots('LW', 2),
    ...createIndividualSlots('C', 2),
    ...createIndividualSlots('RW', 2)
  ];
  
  // Row 2: Defense (Centered below)
  const defenseRow = createIndividualSlots('D', 4);

  // Row 3: Goalies & Utility (Bottom)
  const bottomRow = [
    ...createIndividualSlots('G', 2),
    ...positionSlots.filter(slot => slot.position === 'UTIL')
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold flex items-center gap-2">
          Starting Lineup
        </h2>
      </div>

      {/* Visual Layout: Stacked Rows */}
      <div className="flex flex-col gap-4">
        
        {/* Row 1: Forwards (LW - C - RW) */}
        <div className="flex justify-center flex-wrap gap-y-2 -mx-1">
          {forwardRow.map(slot => renderSlot(slot))}
        </div>

        {/* Row 2: Defense */}
        <div className="flex justify-center flex-wrap gap-y-2 -mx-1">
          {defenseRow.map(slot => renderSlot(slot))}
        </div>

        {/* Row 3: Goalies & Utility */}
        <div className="flex justify-center flex-wrap gap-y-2 -mx-1">
          {bottomRow.map(slot => renderSlot(slot))}
        </div>

      </div>
    </div>
  );
};

interface PositionSlotProps {
  slot: PositionSlot;
  players: HockeyPlayer[];
  isFull: boolean;
  isEmpty: boolean;
  onPlayerClick?: (player: HockeyPlayer) => void;
}

const PositionSlot = ({ 
  slot, 
  players, 
  isFull, 
  isEmpty, 
  onPlayerClick 
}: PositionSlotProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: slot.id,
    data: {
      type: 'starter-slot',
      position: slot.position,
      maxPlayers: slot.maxPlayers,
    },
  });

  const playerIds = players.map(p => p.id);

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "p-2 transition-all rounded-md min-h-[110px] w-full", 
        "border",
        isOver && "border-primary bg-primary/5 shadow-md border-2",
        isEmpty && "border-dashed border-muted-foreground/20 bg-muted/5",
        !isEmpty && !isOver && "border-border/50 bg-card/50 hover:border-border hover:bg-card",
        isFull && !isOver && "border-green-500/20 bg-green-500/5"
      )}
    >
      {/* Compact Slot Header */}
      <div className="flex items-center justify-between mb-1">
        <Badge 
          variant="outline" 
          className={cn(
            "text-[9px] font-bold px-1 py-0 h-4",
            isEmpty ? "text-muted-foreground border-muted-foreground/30" : "text-foreground border-border"
          )}
        >
          {slot.position}
        </Badge>
      </div>

      {/* Players Grid */}
      {players.length > 0 ? (
        <SortableContext items={playerIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {players.map((player) => (
              <HockeyPlayerCard
                key={player.id}
                player={player}
                isInSlot={true}
                onClick={() => onPlayerClick?.(player)}
                className="border-0 shadow-none bg-transparent"
              />
            ))}
          </div>
        </SortableContext>
      ) : (
        <div className={cn(
          "flex items-center justify-center h-[80px] rounded border border-dashed transition-all",
          isOver ? "border-primary bg-primary/10 border-2" : "border-muted-foreground/20 bg-muted/5"
        )}>
          <div className="text-center">
            <Plus className={cn(
              "h-4 w-4 mx-auto mb-1 transition-colors",
              isOver ? "text-primary" : "text-muted-foreground/40"
            )} />
            <p className={cn(
              "text-[9px] font-medium",
              isOver ? "text-primary" : "text-muted-foreground/60"
            )}>
              Empty
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default StartersGrid;
