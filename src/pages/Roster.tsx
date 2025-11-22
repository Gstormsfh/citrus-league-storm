import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Wand2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlayerStatsModal from '@/components/PlayerStatsModal';
import { StartersGrid, BenchGrid, IRSlot, HockeyPlayer } from '@/components/roster';
import { useToast } from '@/hooks/use-toast';
import HockeyPlayerCard from '@/components/roster/HockeyPlayerCard';

// Helper function to transform position to fantasy slot
const getFantasyPosition = (position: string): 'C' | 'LW' | 'RW' | 'D' | 'G' | 'UTIL' => {
  if (position === 'Centre') return 'C';
  if (position === 'Left Wing') return 'LW';
  if (position === 'Right Wing') return 'RW';
  if (position === 'Defence') return 'D';
  if (position === 'Goalie') return 'G';
  return 'UTIL';
};

// Helper function to get team abbreviation
const getTeamAbbreviation = (team: string): string => {
  const abbreviations: Record<string, string> = {
    'Anaheim Ducks': 'ANA',
    'Arizona Coyotes': 'ARI',
    'Boston Bruins': 'BOS',
    'Buffalo Sabres': 'BUF',
    'Calgary Flames': 'CGY',
    'Carolina Hurricanes': 'CAR',
    'Chicago Blackhawks': 'CHI',
    'Colorado Avalanche': 'COL',
    'Columbus Blue Jackets': 'CBJ',
    'Dallas Stars': 'DAL',
    'Detroit Red Wings': 'DET',
    'Edmonton Oilers': 'EDM',
    'Florida Panthers': 'FLA',
    'Los Angeles Kings': 'LAK',
    'Minnesota Wild': 'MIN',
    'Montreal Canadiens': 'MTL',
    'Nashville Predators': 'NSH',
    'New Jersey Devils': 'NJD',
    'New York Islanders': 'NYI',
    'New York Rangers': 'NYR',
    'Ottawa Senators': 'OTT',
    'Philadelphia Flyers': 'PHI',
    'Pittsburgh Penguins': 'PIT',
    'San Jose Sharks': 'SJS',
    'Seattle Kraken': 'SEA',
    'St. Louis Blues': 'STL',
    'Tampa Bay Lightning': 'TBL',
    'Toronto Maple Leafs': 'TOR',
    'Utah Hockey Club': 'UTA',
    'Vancouver Canucks': 'VAN',
    'Vegas Golden Knights': 'VGK',
    'Washington Capitals': 'WSH',
    'Winnipeg Jets': 'WPG',
  };
  return abbreviations[team] || team.split(' ').slice(-1)[0].substring(0, 3).toUpperCase();
};

// Sample player data - hockey themed
const initialPlayers = [
  {
    id: 1,
    name: 'Connor McDavid',
    position: 'Centre',
    number: 97,
    starter: true,
    stats: { goals: 44, assists: 89, points: 133, plusMinus: 28, pim: 36, shots: 352, gamesPlayed: 82, toi: '21:34', toiPercentage: 35.2, blockedShots: 12, hits: 45, powerPlayPoints: 28, shortHandedPoints: 2 },
    team: 'Edmonton Oilers',
    height: '6\'1"',
    weight: '193 lbs',
    age: 27,
    experience: '9 years',
    image: 'https://images.unsplash.com/photo-1562088287-bde35a1ea917?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: 'vs CGY', isToday: true },
    projectedPoints: 4.5
  },
  {
    id: 2,
    name: 'Leon Draisaitl',
    position: 'Centre',
    number: 29,
    starter: true,
    stats: { goals: 41, assists: 64, points: 105, plusMinus: 7, pim: 42, shots: 245, gamesPlayed: 81, toi: '20:15', toiPercentage: 33.8, blockedShots: 8, hits: 52, powerPlayPoints: 24, shortHandedPoints: 1 },
    team: 'Edmonton Oilers',
    height: '6\'2"',
    weight: '208 lbs',
    age: 28,
    experience: '9 years',
    image: 'https://images.unsplash.com/photo-1580064003896-8eba6fc5435f?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: 'vs CGY', isToday: true },
    projectedPoints: 3.8
  },
  {
    id: 3,
    name: 'Nathan MacKinnon',
    position: 'Centre',
    number: 29,
    starter: false,
    stats: { goals: 51, assists: 89, points: 140, plusMinus: 32, pim: 28, shots: 370, gamesPlayed: 82, toi: '22:10', toiPercentage: 36.9, blockedShots: 15, hits: 38, powerPlayPoints: 32, shortHandedPoints: 0 },
    team: 'Colorado Avalanche',
    height: '6\'0"',
    weight: '200 lbs',
    age: 28,
    experience: '10 years',
    image: 'https://images.unsplash.com/photo-1574883052806-413e0927a4d7?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: '@ DAL', isToday: false },
    projectedPoints: 0.0
  },
  {
    id: 4,
    name: 'David Pastrnak',
    position: 'Right Wing',
    number: 88,
    starter: true,
    stats: { goals: 47, assists: 63, points: 110, plusMinus: 26, pim: 34, shots: 312, gamesPlayed: 82, toi: '19:45', toiPercentage: 32.9, blockedShots: 10, hits: 42, powerPlayPoints: 26, shortHandedPoints: 0 },
    team: 'Boston Bruins',
    height: '6\'0"',
    weight: '195 lbs',
    age: 28,
    experience: '10 years',
    image: 'https://images.unsplash.com/photo-1562088287-e698e7c8e6da?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: 'vs TOR', isToday: true },
    projectedPoints: 3.2
  },
  {
    id: 5,
    name: 'Mikko Rantanen',
    position: 'Right Wing',
    number: 96,
    starter: true,
    stats: { goals: 40, assists: 64, points: 104, plusMinus: 24, pim: 48, shots: 265, gamesPlayed: 80, toi: '20:30', toiPercentage: 34.2, blockedShots: 9, hits: 48, powerPlayPoints: 22, shortHandedPoints: 1 },
    team: 'Colorado Avalanche',
    height: '6\'4"',
    weight: '215 lbs',
    age: 27,
    experience: '8 years',
    image: 'https://images.unsplash.com/photo-1580652870699-ae85c08a1ace?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: '@ DAL', isToday: false },
    projectedPoints: 0.0
  },
  {
    id: 6,
    name: 'Mitchell Marner',
    position: 'Right Wing',
    number: 16,
    starter: false,
    stats: { goals: 26, assists: 59, points: 85, plusMinus: 16, pim: 22, shots: 198, gamesPlayed: 78, toi: '19:20', toiPercentage: 32.3, blockedShots: 7, hits: 35, powerPlayPoints: 18, shortHandedPoints: 3 },
    team: 'Toronto Maple Leafs',
    height: '6\'0"',
    weight: '175 lbs',
    age: 27,
    experience: '8 years',
    image: 'https://images.unsplash.com/photo-1565035010268-a3816f98589a?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: '@ BOS', isToday: true },
    projectedPoints: 2.9
  },
  {
    id: 7,
    name: 'Kirill Kaprizov',
    position: 'Left Wing',
    number: 97,
    starter: true,
    stats: { goals: 39, assists: 57, points: 96, plusMinus: 22, pim: 30, shots: 243, gamesPlayed: 79, toi: '20:00', toiPercentage: 33.3, blockedShots: 11, hits: 40, powerPlayPoints: 20, shortHandedPoints: 0 },
    team: 'Minnesota Wild',
    height: '5\'10"',
    weight: '201 lbs',
    age: 27,
    experience: '4 years',
    image: 'https://images.unsplash.com/photo-1580852300654-203e8516c578?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: 'vs WPG', isToday: true },
    projectedPoints: 3.5
  },
  {
    id: 8,
    name: 'Matthew Tkachuk',
    position: 'Left Wing',
    number: 19,
    starter: true,
    stats: { goals: 26, assists: 61, points: 87, plusMinus: -2, pim: 110, shots: 234, gamesPlayed: 82, toi: '19:15', toiPercentage: 32.1, blockedShots: 14, hits: 95, powerPlayPoints: 19, shortHandedPoints: 1 },
    team: 'Florida Panthers',
    height: '6\'2"',
    weight: '202 lbs',
    age: 26,
    experience: '8 years',
    image: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: 'vs TBL', isToday: true },
    projectedPoints: 3.1
  },
  {
    id: 9,
    name: 'Jason Robertson',
    position: 'Left Wing',
    number: 21,
    starter: false,
    stats: { goals: 29, assists: 50, points: 79, plusMinus: 15, pim: 24, shots: 214, gamesPlayed: 75, toi: '18:45', toiPercentage: 31.3, blockedShots: 6, hits: 28, powerPlayPoints: 15, shortHandedPoints: 0 },
    team: 'Dallas Stars',
    height: '6\'3"',
    weight: '200 lbs',
    age: 25,
    experience: '4 years',
    image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: 'vs COL', isToday: false },
    projectedPoints: 0.0
  },
  {
    id: 10,
    name: 'Cale Makar',
    position: 'Defence',
    number: 8,
    starter: true,
    stats: { goals: 21, assists: 62, points: 83, plusMinus: 29, pim: 26, shots: 246, gamesPlayed: 77, toi: '24:30', toiPercentage: 40.8, blockedShots: 98, hits: 42, powerPlayPoints: 18, shortHandedPoints: 0 },
    team: 'Colorado Avalanche',
    height: '5\'11"',
    weight: '187 lbs',
    age: 25,
    experience: '5 years',
    image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: '@ DAL', isToday: false },
    projectedPoints: 0.0
  },
  {
    id: 11,
    name: 'Roman Josi',
    position: 'Defence',
    number: 59,
    starter: true,
    stats: { goals: 18, assists: 67, points: 85, plusMinus: -5, pim: 38, shots: 270, gamesPlayed: 82, toi: '25:15', toiPercentage: 42.1, blockedShots: 112, hits: 55, powerPlayPoints: 20, shortHandedPoints: 0 },
    team: 'Nashville Predators',
    height: '6\'1"',
    weight: '201 lbs',
    age: 33,
    experience: '13 years',
    image: 'https://images.unsplash.com/photo-1562087926-662f6680a456?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: 'vs VAN', isToday: true },
    projectedPoints: 3.0
  },
  {
    id: 12,
    name: 'Victor Hedman',
    position: 'Defence',
    number: 77,
    starter: false,
    stats: { goals: 13, assists: 62, points: 75, plusMinus: 14, pim: 52, shots: 195, gamesPlayed: 78, toi: '23:45', toiPercentage: 39.6, blockedShots: 105, hits: 48, powerPlayPoints: 16, shortHandedPoints: 0 },
    team: 'Tampa Bay Lightning',
    height: '6\'6"',
    weight: '241 lbs',
    age: 33,
    experience: '15 years',
    image: 'https://images.unsplash.com/photo-1582642030918-905439388d02?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: '@ FLA', isToday: true },
    projectedPoints: 2.8
  },
  {
    id: 13,
    name: 'Andrei Vasilevskiy',
    position: 'Goalie',
    number: 88,
    starter: true,
    stats: { wins: 30, losses: 15, otl: 5, gaa: 2.50, savePct: 0.915, shutouts: 4 },
    team: 'Tampa Bay Lightning',
    height: '6\'3"',
    weight: '225 lbs',
    age: 29,
    experience: '10 years',
    image: 'https://images.unsplash.com/photo-1560849807-bae5314c9e98?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: '@ FLA', isToday: true },
    projectedPoints: 6.2
  },
  {
    id: 14,
    name: 'Igor Shesterkin',
    position: 'Goalie',
    number: 31,
    starter: false,
    stats: { wins: 36, losses: 17, otl: 2, gaa: 2.58, savePct: 0.913, shutouts: 3 },
    team: 'New York Rangers',
    height: '6\'2"',
    weight: '182 lbs',
    age: 28,
    experience: '4 years',
    image: 'https://images.unsplash.com/photo-1561731172-9d906d7b13ad?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: 'vs WSH', isToday: true },
    projectedPoints: 5.8
  },
  // Additional bench players
  {
    id: 15,
    name: 'Auston Matthews',
    position: 'Centre',
    number: 34,
    starter: false,
    stats: { goals: 69, assists: 38, points: 107, plusMinus: 31, pim: 20, shots: 368, gamesPlayed: 81, toi: '20:45', toiPercentage: 34.6, blockedShots: 18, hits: 58, powerPlayPoints: 35, shortHandedPoints: 0 },
    team: 'Toronto Maple Leafs',
    height: '6\'3"',
    weight: '208 lbs',
    age: 27,
    experience: '8 years',
    image: 'https://images.unsplash.com/photo-1562088287-bde35a1ea917?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: '@ BOS', isToday: true },
    projectedPoints: 4.8
  },
  {
    id: 16,
    name: 'Artemi Panarin',
    position: 'Left Wing',
    number: 10,
    starter: false,
    stats: { goals: 49, assists: 71, points: 120, plusMinus: 18, pim: 18, shots: 279, gamesPlayed: 82, toi: '20:20', toiPercentage: 33.9, blockedShots: 9, hits: 32, powerPlayPoints: 31, shortHandedPoints: 0 },
    team: 'New York Rangers',
    height: '5\'11"',
    weight: '170 lbs',
    age: 32,
    experience: '9 years',
    image: 'https://images.unsplash.com/photo-1580852300654-203e8516c578?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: 'vs WSH', isToday: true },
    projectedPoints: 3.6
  },
  {
    id: 17,
    name: 'Erik Karlsson',
    position: 'Defence',
    number: 65,
    starter: false,
    stats: { goals: 25, assists: 76, points: 101, plusMinus: -26, pim: 22, shots: 223, gamesPlayed: 82, toi: '25:45', toiPercentage: 42.9, blockedShots: 89, hits: 41, powerPlayPoints: 24, shortHandedPoints: 0 },
    team: 'Pittsburgh Penguins',
    height: '6\'0"',
    weight: '190 lbs',
    age: 34,
    experience: '15 years',
    image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: 'vs PHI', isToday: true },
    projectedPoints: 2.5
  },
  {
    id: 18,
    name: 'Quinn Hughes',
    position: 'Defence',
    number: 43,
    starter: false,
    stats: { goals: 17, assists: 75, points: 92, plusMinus: 33, pim: 18, shots: 201, gamesPlayed: 82, toi: '24:15', toiPercentage: 40.4, blockedShots: 67, hits: 28, powerPlayPoints: 22, shortHandedPoints: 0 },
    team: 'Vancouver Canucks',
    height: '5\'10"',
    weight: '180 lbs',
    age: 24,
    experience: '5 years',
    image: 'https://images.unsplash.com/photo-1562087926-662f6680a456?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: '@ NSH', isToday: true },
    projectedPoints: 2.7
  },
  {
    id: 19,
    name: 'Sidney Crosby',
    position: 'Centre',
    number: 87,
    starter: false,
    stats: { goals: 42, assists: 50, points: 92, plusMinus: 19, pim: 36, shots: 268, gamesPlayed: 82, toi: '20:30', toiPercentage: 34.2, blockedShots: 24, hits: 67, powerPlayPoints: 28, shortHandedPoints: 2 },
    team: 'Pittsburgh Penguins',
    height: '5\'11"',
    weight: '200 lbs',
    age: 36,
    experience: '19 years',
    image: 'https://images.unsplash.com/photo-1574883052806-413e0927a4d7?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: 'vs PHI', isToday: true },
    projectedPoints: 3.3
  },
  {
    id: 20,
    name: 'Alex Ovechkin',
    position: 'Left Wing',
    number: 8,
    starter: false,
    stats: { goals: 31, assists: 34, points: 65, plusMinus: -19, pim: 20, shots: 293, gamesPlayed: 79, toi: '19:45', toiPercentage: 32.9, blockedShots: 19, hits: 78, powerPlayPoints: 18, shortHandedPoints: 0 },
    team: 'Washington Capitals',
    height: '6\'3"',
    weight: '235 lbs',
    age: 39,
    experience: '19 years',
    image: 'https://images.unsplash.com/photo-1580852300654-203e8516c578?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: '@ NYR', isToday: true },
    projectedPoints: 2.4
  },
  {
    id: 21,
    name: 'Connor Hellebuyck',
    position: 'Goalie',
    number: 37,
    starter: false,
    stats: { wins: 37, losses: 19, otl: 4, gaa: 2.39, savePct: 0.921, shutouts: 5 },
    team: 'Winnipeg Jets',
    height: '6\'4"',
    weight: '207 lbs',
    age: 31,
    experience: '9 years',
    image: 'https://images.unsplash.com/photo-1560849807-bae5314c9e98?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: '@ MIN', isToday: true },
    projectedPoints: 5.5
  },
  // IR players
  {
    id: 22,
    name: 'Mark Stone',
    position: 'Right Wing',
    number: 61,
    starter: false,
    stats: { goals: 16, assists: 37, points: 53, plusMinus: 12, pim: 10, shots: 145, gamesPlayed: 56, toi: '18:30', toiPercentage: 30.8, blockedShots: 8, hits: 42, powerPlayPoints: 12, shortHandedPoints: 0 },
    team: 'Vegas Golden Knights',
    height: '6\'4"',
    weight: '219 lbs',
    age: 32,
    experience: '11 years',
    image: 'https://images.unsplash.com/photo-1562088287-e698e7c8e6da?q=80&w=200&auto=format&fit=crop',
    status: 'IR' as const,
    nextGame: { opponent: 'vs SJS', isToday: false },
    projectedPoints: 0.0
  },
  {
    id: 23,
    name: 'Jack Eichel',
    position: 'Centre',
    number: 9,
    starter: false,
    stats: { goals: 26, assists: 33, points: 59, plusMinus: 8, pim: 12, shots: 198, gamesPlayed: 63, toi: '19:15', toiPercentage: 32.1, blockedShots: 11, hits: 35, powerPlayPoints: 15, shortHandedPoints: 0 },
    team: 'Vegas Golden Knights',
    height: '6\'2"',
    weight: '206 lbs',
    age: 28,
    experience: '9 years',
    image: 'https://images.unsplash.com/photo-1574883052806-413e0927a4d7?q=80&w=200&auto=format&fit=crop',
    status: 'IR' as const,
    nextGame: { opponent: 'vs SJS', isToday: false },
    projectedPoints: 0.0
  },
  {
    id: 24,
    name: 'Timo Meier',
    position: 'Right Wing',
    number: 28,
    starter: false,
    stats: { goals: 28, assists: 25, points: 53, plusMinus: -5, pim: 30, shots: 212, gamesPlayed: 78, toi: '18:00', toiPercentage: 30.0, blockedShots: 12, hits: 88, powerPlayPoints: 14, shortHandedPoints: 0 },
    team: 'New Jersey Devils',
    height: '6\'1"',
    weight: '220 lbs',
    age: 27,
    experience: '8 years',
    image: 'https://images.unsplash.com/photo-1580652870699-ae85c08a1ace?q=80&w=200&auto=format&fit=crop',
    status: 'IR' as const,
    nextGame: { opponent: 'vs DET', isToday: true },
    projectedPoints: 0.0
  },
  {
    id: 25,
    name: 'Clayton Keller',
    position: 'Right Wing',
    number: 9,
    starter: false,
    stats: { goals: 33, assists: 43, points: 76, plusMinus: -2, pim: 32, shots: 220, gamesPlayed: 78, toi: '19:15', toiPercentage: 32.1, blockedShots: 28, hits: 25, powerPlayPoints: 24, shortHandedPoints: 0 },
    team: 'Utah Hockey Club',
    height: '5\'10"',
    weight: '178 lbs',
    age: 25,
    experience: '7 years',
    image: 'https://images.unsplash.com/photo-1580652870699-ae85c08a1ace?q=80&w=200&auto=format&fit=crop',
    nextGame: { opponent: 'vs ARI', isToday: false },
    projectedPoints: 0.0
  },
];

// Sample team stats for analytics section
const teamStats = {
  record: "42-22-8",
  points: 92,
  goalsFor: 247,
  goalsAgainst: 198,
  powerPlayPct: 23.5,
  penaltyKillPct: 82.4,
  lastTenGames: "7-2-1",
  streak: "W3",
  homeRecord: "22-10-4",
  awayRecord: "20-12-4",
  trends: [
    { stat: "Goals", direction: "up", value: "+2.4%" },
    { stat: "Save %", direction: "up", value: "+1.8%" },
    { stat: "PP%", direction: "down", value: "-3.2%" },
    { stat: "Shots", direction: "up", value: "+4.1%" },
    { stat: "PK%", direction: "up", value: "+0.7%" }
  ]
};

// Position slot configuration
const POSITION_SLOTS = {
  'C': { maxPlayers: 2, label: 'Center' },
  'LW': { maxPlayers: 2, label: 'Left Wing' },
  'RW': { maxPlayers: 2, label: 'Right Wing' },
  'D': { maxPlayers: 4, label: 'Defense' },
  'G': { maxPlayers: 2, label: 'Goalie' },
  'UTIL': { maxPlayers: 1, label: 'Utility' },
} as const;

type PositionSlot = keyof typeof POSITION_SLOTS;

interface RosterState {
  starters: HockeyPlayer[];
  bench: HockeyPlayer[];
  ir: HockeyPlayer[];
  slotAssignments: Record<number, string>;
}

const Roster = () => {
  const { toast } = useToast();
  const [selectedPlayer, setSelectedPlayer] = useState<HockeyPlayer | null>(null);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("roster");
  const [activeId, setActiveId] = useState<number | null>(null);

  // Helper to calculate initial assignments based on player position and load order
  const calculateInitialSlotAssignments = (starters: HockeyPlayer[]) => {
    const assignments: Record<number, string> = {};
    const playersByPos: Record<string, HockeyPlayer[]> = {
      'C': [], 'LW': [], 'RW': [], 'D': [], 'G': [], 'UTIL': []
    };
    
    starters.forEach(p => {
      const pos = getFantasyPosition(p.position);
      if (pos !== 'UTIL') playersByPos[pos].push(p);
    });
    
    // Assign C, LW, RW to first 2 slots
    ['C', 'LW', 'RW'].forEach(pos => {
      playersByPos[pos].slice(0, 2).forEach((p, i) => {
        assignments[p.id] = `slot-${pos}-${i + 1}`;
      });
    });

    // Assign D to first 4 slots
    playersByPos['D'].slice(0, 4).forEach((p, i) => {
      assignments[p.id] = `slot-D-${i + 1}`;
    });

    // Assign G to first 2 slots
    playersByPos['G'].slice(0, 2).forEach((p, i) => {
      assignments[p.id] = `slot-G-${i + 1}`;
    });
    
    // Assign remaining non-goalie starters to UTIL if not already assigned
    const assignedIds = new Set(Object.keys(assignments).map(Number));
    const unassigned = starters.filter(p => !assignedIds.has(p.id));
    const utilPlayer = unassigned.find(p => getFantasyPosition(p.position) !== 'G');
    if (utilPlayer) {
        assignments[utilPlayer.id] = 'slot-UTIL';
    }
    
    return assignments;
  };

  // Initialize roster state from initial players
  const [roster, setRoster] = useState<RosterState>(() => {
    const transformedPlayers: HockeyPlayer[] = initialPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      number: p.number,
      starter: p.starter,
      stats: p.stats,
      team: p.team,
      teamAbbreviation: getTeamAbbreviation(p.team),
      status: (p as any).status || null, // Preserve IR/out status (IR, SUSP, GTD, WVR, or null)
      height: p.height,
      weight: p.weight,
      age: p.age,
      experience: p.experience,
      image: p.image,
      nextGame: (p as any).nextGame,
      projectedPoints: (p as any).projectedPoints,
    }));

    const starters: HockeyPlayer[] = [];
    const bench: HockeyPlayer[] = [];
    const ir: HockeyPlayer[] = [];

    transformedPlayers.forEach((player) => {
      if (player.status === 'IR' || player.status === 'SUSP') {
        ir.push(player);
      } else if (player.starter) {
        starters.push(player);
      } else {
        bench.push(player);
      }
    });

    const slotAssignments = calculateInitialSlotAssignments(starters);

    return { starters, bench, ir, slotAssignments };
  });

  const handleAutoLineup = () => {
    setRoster((prev) => {
      // 1. Gather all active players (exclude IR)
      const allActivePlayers = [...prev.starters, ...prev.bench];
      
      // 2. Helper to sort players: Games Today > Projected Points > Name
      const sortBestPlayers = (players: HockeyPlayer[]) => {
        return [...players].sort((a, b) => {
          if (a.nextGame?.isToday !== b.nextGame?.isToday) {
            return a.nextGame?.isToday ? -1 : 1;
          }
          return (b.projectedPoints || 0) - (a.projectedPoints || 0);
        });
      };

      // 3. Group by fantasy position
      const grouped: Record<string, HockeyPlayer[]> = {
        'C': [], 'LW': [], 'RW': [], 'D': [], 'G': []
      };

      allActivePlayers.forEach(p => {
        const pos = getFantasyPosition(p.position);
        if (pos !== 'UTIL' && grouped[pos]) {
          grouped[pos].push(p);
        }
      });

      // 4. Sort each group
      Object.keys(grouped).forEach(key => {
        grouped[key] = sortBestPlayers(grouped[key]);
      });

      // 5. Assign Slots
      const newAssignments: Record<number, string> = {};
      const newStarters: HockeyPlayer[] = [];
      const newBench: HockeyPlayer[] = [];
      const assignedIds = new Set<number>();

      // Helper to assign players to a list of slot IDs
      const assignToSlots = (players: HockeyPlayer[], slotPrefix: string, count: number) => {
        for (let i = 0; i < count; i++) {
          if (players.length > i) {
            const p = players[i];
            const slotId = `${slotPrefix}-${i + 1}`;
            newAssignments[p.id] = slotId;
            newStarters.push({ ...p, starter: true });
            assignedIds.add(p.id);
          }
        }
      };

      // Assign Primary Slots
      assignToSlots(grouped['C'], 'slot-C', 2);
      assignToSlots(grouped['LW'], 'slot-LW', 2);
      assignToSlots(grouped['RW'], 'slot-RW', 2);
      assignToSlots(grouped['D'], 'slot-D', 4);
      assignToSlots(grouped['G'], 'slot-G', 2);

      // 6. Handle UTIL Slot (Best remaining non-goalie)
      const remainingPlayers = allActivePlayers.filter(p => !assignedIds.has(p.id));
      const utilCandidates = remainingPlayers.filter(p => getFantasyPosition(p.position) !== 'G');
      const bestUtil = sortBestPlayers(utilCandidates)[0];

      if (bestUtil) {
        newAssignments[bestUtil.id] = 'slot-UTIL';
        newStarters.push({ ...bestUtil, starter: true });
        assignedIds.add(bestUtil.id);
      }

      // 7. Remaining go to Bench
      const remainingAfterUtil = allActivePlayers.filter(p => !assignedIds.has(p.id));
      remainingAfterUtil.forEach(p => {
        newBench.push({ ...p, starter: false });
      });

      return {
        ...prev,
        starters: newStarters,
        bench: newBench,
        slotAssignments: newAssignments
      };
    });

    toast({
      title: "Lineup Optimized",
      description: "Best players set based on today's games and projections.",
    });
  };

  // Get active player being dragged
  const activePlayer = useMemo(() => {
    if (!activeId) return null;
    return [...roster.starters, ...roster.bench, ...roster.ir].find(p => p.id === activeId) || null;
  }, [activeId, roster]);

  const handlePlayerClick = (player: HockeyPlayer) => {
    setSelectedPlayer(player);
    setIsPlayerDialogOpen(true);
  };

  // Position validation: Check if player can be placed in target slot
  const isPositionValid = (player: HockeyPlayer, targetSlot: string): boolean => {
    const playerFantasyPos = getFantasyPosition(player.position);
    
    if (targetSlot === 'bench-grid') return true;
    
    if (targetSlot === 'ir-slot') {
      return player.status === 'IR' || player.status === 'SUSP' || player.status === 'GTD';
    }
    
    let slotPosition: PositionSlot | null = null;
    
    if (targetSlot === 'slot-UTIL') {
      slotPosition = 'UTIL';
    } else if (targetSlot.startsWith('slot-')) {
       const parts = targetSlot.split('-');
       if (parts.length >= 2) {
         slotPosition = parts[1] as PositionSlot;
       }
    }
    
    if (!slotPosition) return false;
    
    if (slotPosition === 'UTIL') {
      return playerFantasyPos !== 'G';
    }
    
    if (playerFantasyPos === 'G') {
      return slotPosition === 'G';
    }
    
    if (slotPosition === 'G') {
      return false;
    }
    
    return playerFantasyPos === slotPosition;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const playerId = active.id as number;
    const targetId = over.id as string; 

    const allPlayers = [...roster.starters, ...roster.bench, ...roster.ir];
    const player = allPlayers.find(p => p.id === playerId);
    
    if (!player) return;

    // Identify if dropping onto a player or an empty slot
    const droppedOnPlayer = allPlayers.find(p => p.id === targetId); // targetId might be a player ID
    
    let finalTargetSlotId = targetId;

    if (droppedOnPlayer) {
       // If dropped on a player, find their slot
       if (roster.bench.some(p => p.id === droppedOnPlayer.id)) finalTargetSlotId = 'bench-grid';
       else if (roster.ir.some(p => p.id === droppedOnPlayer.id)) finalTargetSlotId = 'ir-slot';
       else finalTargetSlotId = roster.slotAssignments[droppedOnPlayer.id] || 'slot-UTIL';
    }

    const isCurrentlyStarter = roster.starters.some(p => p.id === playerId);
    
    // Check if we are just dropping in the same place
    if (isCurrentlyStarter && roster.slotAssignments[player.id] === finalTargetSlotId) return;
    if (!isCurrentlyStarter && finalTargetSlotId === 'bench-grid' && roster.bench.some(p => p.id === playerId)) return;

    if (!isPositionValid(player, finalTargetSlotId)) {
        toast({ title: "Invalid Position", description: "Player cannot play in this position.", variant: "destructive" });
        return;
    }

    setRoster(prev => {
        const newStarters = [...prev.starters];
        const newBench = [...prev.bench];
        const newIR = [...prev.ir];
        const newAssignments = { ...prev.slotAssignments };

        // Remove player from old location
        const removeFromCurrent = (pId: number) => {
            const sIdx = newStarters.findIndex(p => p.id === pId);
            if (sIdx >= 0) { 
                newStarters.splice(sIdx, 1); 
                delete newAssignments[pId]; 
                return { loc: 'starter' }; 
            }
            const bIdx = newBench.findIndex(p => p.id === pId);
            if (bIdx >= 0) { 
                newBench.splice(bIdx, 1); 
                return { loc: 'bench' }; 
            }
            const iIdx = newIR.findIndex(p => p.id === pId);
            if (iIdx >= 0) { 
                newIR.splice(iIdx, 1); 
                return { loc: 'ir' }; 
            }
            return null;
        };

        // 1. Remove Active Player
        const sourceInfo = removeFromCurrent(player.id);
        
        // 2. Check if target slot is occupied
        let occupantId: number | undefined;
        if (finalTargetSlotId.startsWith('slot-')) {
            const foundId = Object.keys(newAssignments).find(id => newAssignments[Number(id)] === finalTargetSlotId);
            if (foundId) occupantId = Number(foundId);
        }

        // 3. If occupied, remove the occupant (Swap)
        let occupantSourceInfo = null;
        if (occupantId) {
            occupantSourceInfo = removeFromCurrent(occupantId);
        }

        // 4. Place Active Player into Target Slot
        const p = { ...player };
        if (finalTargetSlotId === 'bench-grid') {
            p.starter = false; p.status = null; newBench.push(p);
        } else if (finalTargetSlotId === 'ir-slot') {
            p.starter = false; if(p.status !== 'IR' && p.status !== 'SUSP') p.status='IR'; newIR.push(p);
        } else {
            p.starter = true; p.status = null; newStarters.push(p);
            newAssignments[p.id] = finalTargetSlotId; 
        }

        // 5. If we swapped, put the occupant where the active player came from
        if (occupantId && occupantSourceInfo) {
            const occupant = allPlayers.find(x => x.id === occupantId)!;
            const p2 = { ...occupant };
            
            const originalSlot = prev.slotAssignments[player.id];
            let swapBackTarget = 'bench-grid';
            
            if (sourceInfo?.loc === 'bench') swapBackTarget = 'bench-grid';
            else if (sourceInfo?.loc === 'ir') swapBackTarget = 'ir-slot';
            else if (sourceInfo?.loc === 'starter' && originalSlot) swapBackTarget = originalSlot;

            if (!isPositionValid(p2, swapBackTarget)) {
                swapBackTarget = 'bench-grid';
            }

            if (swapBackTarget === 'bench-grid') {
                p2.starter = false; p2.status = null; newBench.push(p2);
            } else if (swapBackTarget === 'ir-slot') {
                p2.starter = false; if(p2.status!=='IR') p2.status='IR'; newIR.push(p2);
            } else {
                p2.starter = true; p2.status = null; newStarters.push(p2);
                newAssignments[p2.id] = swapBackTarget;
            }
        }

        return { starters: newStarters, bench: newBench, ir: newIR, slotAssignments: newAssignments };
    });
    
    toast({ title: "Lineup Updated", description: "Player moved successfully." });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container max-w-7xl mx-auto px-4">
          {/* Fantasy Team Header */}
          <div className="bg-card rounded-lg shadow-md border p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  HC
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Hockey Champions</h1>
                  <div className="text-muted-foreground text-sm">Manager: John Smith</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center px-4 py-2">
                  <div className="text-sm text-muted-foreground">Record</div>
                  <div className="font-bold">{teamStats.record}</div>
                </div>
                <div className="text-center px-4 py-2">
                  <div className="text-sm text-muted-foreground">Points</div>
                  <div className="font-bold">{teamStats.points}</div>
                </div>
                <div className="text-center px-4 py-2">
                  <div className="text-sm text-muted-foreground">Standing</div>
                  <div className="font-bold">#3</div>
                </div>
              </div>

              <div>
                <Button onClick={handleAutoLineup} variant="outline" className="flex gap-2">
                  <Wand2 className="w-4 h-4" />
                  Auto Lineup
                </Button>
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="bg-card rounded-lg shadow-md border">
              <TabsList className="w-full p-0 bg-transparent border-b rounded-none gap-0">
                <TabsTrigger 
                  value="roster" 
                  className="flex-1 py-4 rounded-none data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  Roster
                </TabsTrigger>
                <TabsTrigger 
                  value="stats" 
                  className="flex-1 py-4 rounded-none data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  Team Stats
                </TabsTrigger>
                <TabsTrigger 
                  value="trends" 
                  className="flex-1 py-4 rounded-none data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  Trends & Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="roster" className="m-0 p-6">
                <DndContext
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="space-y-8">
                    <StartersGrid 
                      players={roster.starters}
                      slotAssignments={roster.slotAssignments}
                      onPlayerClick={handlePlayerClick}
                    />
                    
                    <BenchGrid 
                      players={roster.bench}
                      onPlayerClick={handlePlayerClick}
                    />
                    
                    <IRSlot 
                      players={roster.ir}
                      onPlayerClick={handlePlayerClick}
                    />
                  </div>

                  <DragOverlay>
                    {activePlayer ? (
                      <div className="opacity-90 rotate-3">
                        <HockeyPlayerCard 
                          player={activePlayer}
                          draggable={false}
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </TabsContent>

              <TabsContent value="stats" className="m-0 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold">{teamStats.goalsFor}</div>
                      <p className="text-sm text-muted-foreground">Goals For</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold">{teamStats.goalsAgainst}</div>
                      <p className="text-sm text-muted-foreground">Goals Against</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold">{teamStats.powerPlayPct}%</div>
                      <p className="text-sm text-muted-foreground">Power Play %</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold">{teamStats.penaltyKillPct}%</div>
                      <p className="text-sm text-muted-foreground">Penalty Kill %</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="m-0 p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-4">Performance Trends</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamStats.trends.map((trend, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{trend.stat}</span>
                              <div className="flex items-center">
                                {trend.direction === 'up' ? (
                                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                <span className={`text-sm ${trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                  {trend.value}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        {/* Enhanced Player Stats Modal */}
        <PlayerStatsModal
          player={selectedPlayer}
          isOpen={isPlayerDialogOpen}
          onClose={() => setIsPlayerDialogOpen(false)}
        />
      </main>
      
      <Footer />
    </div>
  );
};

export default Roster;
