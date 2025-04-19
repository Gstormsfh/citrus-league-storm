
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface PlayerCardProps {
  player: any;
  onPlayerClick: (player: any) => void;
}

export const PlayerCard = ({ player, onPlayerClick }: PlayerCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onPlayerClick(player)}
      className="group cursor-move bg-white hover:shadow-md transition-all border-fantasy-border hover:border-fantasy-primary relative"
    >
      <div className="p-4 space-y-3">
        <div className="aspect-square rounded-lg overflow-hidden mb-2">
          <img
            src={player.image}
            alt={player.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        
        <Badge 
          className={`absolute top-2 right-2 ${
            player.starter 
              ? 'bg-fantasy-primary text-white' 
              : 'bg-fantasy-muted text-white'
          }`}
        >
          {player.position === 'Centre' ? 'C' : 
           player.position === 'Right Wing' ? 'RW' : 
           player.position === 'Left Wing' ? 'LW' : 
           player.position === 'Defence' ? 'D' : 'G'}
        </Badge>

        <div>
          <h3 className="font-semibold text-fantasy-dark truncate">{player.name}</h3>
          <p className="text-sm text-fantasy-muted">#{player.number} - {player.team}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-fantasy-border">
          {player.position === 'Goalie' ? (
            <>
              <Stat label="W" value={player.stats.wins} />
              <Stat label="GAA" value={player.stats.gaa} />
              <Stat label="SV%" value={player.stats.savePct} />
            </>
          ) : (
            <>
              <Stat label="G" value={player.stats.goals} />
              <Stat label="A" value={player.stats.assists} />
              <Stat label="PTS" value={player.stats.points} />
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="text-center">
    <div className="text-xs text-fantasy-muted">{label}</div>
    <div className="font-semibold text-fantasy-dark">{value}</div>
  </div>
);
