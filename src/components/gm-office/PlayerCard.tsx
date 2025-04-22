
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Player = {
  id: number;
  name: string;
  position: string;
  number: number;
  starter: boolean;
  stats: any;
  team: string;
  height: string;
  weight: string;
  age: number;
  experience: string;
  image: string;
};

type PlayerCardProps = {
  player: Player;
  onClick: () => void;
};

export const PlayerCard = ({ player, onClick }: PlayerCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getAbbreviation = (position: string) => {
    switch (position) {
      case 'Centre': return 'C';
      case 'Right Wing': return 'RW';
      case 'Left Wing': return 'LW';
      case 'Defence': return 'D';
      case 'Goalie': return 'G';
      default: return position;
    }
  };

  const isGoalie = player.position === 'Goalie';

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`overflow-hidden cursor-pointer border ${
        player.starter 
          ? "border-fantasy-primary shadow-md" 
          : "border-fantasy-border"
      } transition-all hover:shadow-lg`}
      onClick={onClick}
    >
      <div className="aspect-square relative">
        <img 
          src={player.image} 
          alt={player.name} 
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
          <Badge 
            className={`absolute top-2 right-2 ${
              player.starter 
                ? "bg-fantasy-primary text-white" 
                : "bg-fantasy-muted text-white"
            }`}
          >
            {getAbbreviation(player.position)}
          </Badge>
          <h3 className="text-white font-bold">{player.name}</h3>
          <div className="flex justify-between items-center">
            <span className="text-white/90 text-xs">{player.team}</span>
            <span className="text-white/90 text-xs">#{player.number}</span>
          </div>
        </div>
      </div>
      <div className="p-3 bg-white border-t border-fantasy-border">
        <div className="grid grid-cols-3 gap-1 text-xs">
          <div className="text-center">
            <div className="text-fantasy-muted">{isGoalie ? "W" : "G"}</div>
            <div className="font-bold">{isGoalie ? player.stats.wins : player.stats.goals}</div>
          </div>
          <div className="text-center">
            <div className="text-fantasy-muted">{isGoalie ? "GAA" : "A"}</div>
            <div className="font-bold">{isGoalie ? player.stats.gaa : player.stats.assists}</div>
          </div>
          <div className="text-center">
            <div className="text-fantasy-muted">{isGoalie ? "SV%" : "PTS"}</div>
            <div className="font-bold">{isGoalie ? player.stats.savePct : player.stats.points}</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
