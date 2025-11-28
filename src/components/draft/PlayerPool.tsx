import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Filter, TrendingUp, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  age: number;
  goals: number;
  assists: number;
  points: number;
  gamesPlayed: number;
  averageFantasyPoints: number;
  adp: number; // Average Draft Position
  tier: number;
  trending: 'up' | 'down' | 'stable';
  injuryStatus?: string;
}

interface PlayerPoolProps {
  onPlayerSelect: (player: Player) => void;
  onPlayerDraft: (player: Player) => void;
  selectedPlayer: Player | null;
  draftedPlayers: string[];
  isDraftActive: boolean;
}

// Mock player data
const mockPlayers: Player[] = [
  { id: '1', name: 'Connor McDavid', position: 'C', team: 'EDM', age: 27, goals: 64, assists: 89, points: 153, gamesPlayed: 82, averageFantasyPoints: 28.5, adp: 1, tier: 1, trending: 'up' },
  { id: '2', name: 'David Pastrnak', position: 'RW', team: 'BOS', age: 28, goals: 61, assists: 52, points: 113, gamesPlayed: 82, averageFantasyPoints: 25.2, adp: 2, tier: 1, trending: 'stable' },
  { id: '3', name: 'Nathan MacKinnon', position: 'C', team: 'COL', age: 29, goals: 51, assists: 89, points: 140, gamesPlayed: 82, averageFantasyPoints: 27.8, adp: 3, tier: 1, trending: 'up' },
  { id: '4', name: 'Leon Draisaitl', position: 'C', team: 'EDM', age: 29, goals: 52, assists: 54, points: 106, gamesPlayed: 81, averageFantasyPoints: 24.9, adp: 4, tier: 1, trending: 'stable' },
  { id: '5', name: 'Erik Karlsson', position: 'D', team: 'SJS', age: 34, goals: 25, assists: 76, points: 101, gamesPlayed: 82, averageFantasyPoints: 22.1, adp: 5, tier: 1, trending: 'down' },
  { id: '6', name: 'Mikko Rantanen', position: 'RW', team: 'COL', age: 28, goals: 55, assists: 50, points: 105, gamesPlayed: 82, averageFantasyPoints: 23.8, adp: 6, tier: 1, trending: 'stable' },
  { id: '7', name: 'Auston Matthews', position: 'C', team: 'TOR', age: 27, goals: 69, assists: 38, points: 107, gamesPlayed: 81, averageFantasyPoints: 26.3, adp: 7, tier: 1, trending: 'up', injuryStatus: 'DTD' },
  { id: '8', name: 'Cale Makar', position: 'D', team: 'COL', age: 26, goals: 21, assists: 69, points: 90, gamesPlayed: 77, averageFantasyPoints: 21.7, adp: 8, tier: 1, trending: 'stable' },
  { id: '9', name: 'Igor Shesterkin', position: 'G', team: 'NYR', age: 29, goals: 0, assists: 0, points: 0, gamesPlayed: 55, averageFantasyPoints: 18.9, adp: 15, tier: 2, trending: 'up' },
  { id: '10', name: 'Connor Hellebuyck', position: 'G', team: 'WPG', age: 31, goals: 0, assists: 1, points: 1, gamesPlayed: 64, averageFantasyPoints: 17.8, adp: 18, tier: 2, trending: 'stable' },
  // Add more players...
];

const positions = ['All', 'C', 'LW', 'RW', 'D', 'G'];
const teams = ['All', 'BOS', 'COL', 'EDM', 'NYR', 'SJS', 'TOR', 'WPG'];
const sortOptions = [
  { value: 'adp', label: 'ADP' },
  { value: 'points', label: 'Points' },
  { value: 'goals', label: 'Goals' },
  { value: 'assists', label: 'Assists' },
  { value: 'fantasy', label: 'Fantasy Avg' },
];

export const PlayerPool = ({ 
  onPlayerSelect, 
  onPlayerDraft, 
  selectedPlayer, 
  draftedPlayers, 
  isDraftActive 
}: PlayerPoolProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [sortBy, setSortBy] = useState('adp');
  const [viewMode, setViewMode] = useState<'all' | 'tiers'>('all');

  const filteredAndSortedPlayers = useMemo(() => {
    const filtered = mockPlayers.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           player.team.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPosition = selectedPosition === 'All' || player.position === selectedPosition;
      const matchesTeam = selectedTeam === 'All' || player.team === selectedTeam;
      const notDrafted = !draftedPlayers.includes(player.id);
      
      return matchesSearch && matchesPosition && matchesTeam && notDrafted;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'adp':
          return a.adp - b.adp;
        case 'points':
          return b.points - a.points;
        case 'goals':
          return b.goals - a.goals;
        case 'assists':
          return b.assists - a.assists;
        case 'fantasy':
          return b.averageFantasyPoints - a.averageFantasyPoints;
        default:
          return a.adp - b.adp;
      }
    });

    return filtered;
  }, [searchTerm, selectedPosition, selectedTeam, sortBy, draftedPlayers]);

  const playersByTier = useMemo(() => {
    const tiers: { [key: number]: Player[] } = {};
    filteredAndSortedPlayers.forEach(player => {
      if (!tiers[player.tier]) {
        tiers[player.tier] = [];
      }
      tiers[player.tier].push(player);
    });
    return tiers;
  }, [filteredAndSortedPlayers]);

  const PlayerCard = ({ player }: { player: Player }) => {
    const isSelected = selectedPlayer?.id === player.id;
    const isDrafted = draftedPlayers.includes(player.id);
    
    return (
      <Card 
        className={cn(
          'p-4 cursor-pointer transition-all hover:shadow-md',
          isSelected && 'ring-2 ring-primary bg-primary/5',
          isDrafted && 'opacity-50 bg-muted/50'
        )}
        onClick={() => !isDrafted && onPlayerSelect(player)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs">
                {player.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm flex items-center gap-2">
                {player.name}
                {player.trending === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {player.injuryStatus && <Clock className="h-3 w-3 text-orange-500" />}
              </div>
              <div className="text-xs text-muted-foreground">
                {player.team} • {player.age}y
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Badge variant={player.tier === 1 ? 'default' : 'secondary'} className="text-xs">
              {player.position}
            </Badge>
            <div className="text-xs text-muted-foreground">
              ADP: {player.adp}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2 text-xs mb-3">
          <div className="text-center">
            <div className="font-medium">{player.goals}</div>
            <div className="text-muted-foreground">G</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{player.assists}</div>
            <div className="text-muted-foreground">A</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{player.points}</div>
            <div className="text-muted-foreground">PTS</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{player.averageFantasyPoints.toFixed(1)}</div>
            <div className="text-muted-foreground">FPTS</div>
          </div>
        </div>
        
        {player.injuryStatus && (
          <div className="text-xs text-orange-600 mb-2 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {player.injuryStatus}
          </div>
        )}
        
        {isSelected && isDraftActive && (
          <Button 
            size="sm" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onPlayerDraft(player);
            }}
          >
            Draft Player
          </Button>
        )}
      </Card>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Available Players
        </h2>
        <div className="text-sm text-muted-foreground">
          {filteredAndSortedPlayers.length} players available
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={selectedPosition} onValueChange={setSelectedPosition}>
          <SelectTrigger>
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent>
            {positions.map(pos => (
              <SelectItem key={pos} value={pos}>{pos}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger>
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map(team => (
              <SelectItem key={team} value={team}>{team}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex rounded-md bg-muted p-1">
          <Button 
            variant={viewMode === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('all')}
            className="flex-1 h-8"
          >
            All
          </Button>
          <Button 
            variant={viewMode === 'tiers' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('tiers')}
            className="flex-1 h-8"
          >
            Tiers
          </Button>
        </div>
      </div>

      {/* Player List */}
      <div className="space-y-6">
        {viewMode === 'all' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedPlayers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          Object.entries(playersByTier).map(([tier, players]) => (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={tier === '1' ? 'default' : 'secondary'}>
                  Tier {tier}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {players.length} players
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map(player => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </div>
          ))
        )}
        
        {filteredAndSortedPlayers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">No players found</div>
            <div className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};