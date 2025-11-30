import { Player } from "@/services/PlayerService";
import { supabase } from "@/integrations/supabase/client";

// Hardcoded "Draft" results to ensure consistency across the app
// We assign players to teams deterministically based on their ID hash or simple round-robin
// We assume we have 10 teams in the league (ID 1-10).
// ID 3 is the User's team ("Citrus Crushers").

export interface LeagueTeam {
  id: number;
  name: string;
  owner: string;
  logo: string; // Emoji or short text for now
  record: { wins: number; losses: number };
  points: number;
  streak: string;
  roster: Player[];
}

export const LEAGUE_TEAMS_DATA = [
  { 
    id: 1, 
    name: 'Touchdown Titans', 
    owner: 'Alex Johnson',
    logo: 'TT',
    record: { wins: 9, losses: 1 },
    points: 1432,
    streak: 'W4'
  },
  { 
    id: 2, 
    name: 'Scoring Sharks', 
    owner: 'Samantha Lee',
    logo: 'SS',
    record: { wins: 8, losses: 2 },
    points: 1378,
    streak: 'W2'
  },
  { 
    id: 3, 
    name: 'Citrus Crushers', 
    owner: 'You',
    logo: 'CC',
    record: { wins: 7, losses: 3 },
    points: 1247,
    streak: 'W1'
  },
  { 
    id: 4, 
    name: 'Field Generals', 
    owner: 'Carlos Rodriguez',
    logo: 'FG',
    record: { wins: 6, losses: 4 },
    points: 1189,
    streak: 'L1'
  },
  { 
    id: 5, 
    name: 'Blitz Brigade', 
    owner: 'Taylor Kim',
    logo: 'BB',
    record: { wins: 5, losses: 5 },
    points: 1145,
    streak: 'W3'
  },
  { 
    id: 6, 
    name: 'Goal Getters', 
    owner: 'Jamie Zhang',
    logo: 'GG',
    record: { wins: 4, losses: 6 },
    points: 1102,
    streak: 'L2'
  },
  { 
    id: 7, 
    name: 'Victory Vipers', 
    owner: 'Morgan Williams',
    logo: 'VV',
    record: { wins: 3, losses: 7 },
    points: 1067,
    streak: 'L4'
  },
  { 
    id: 8, 
    name: 'Hustle Heroes', 
    owner: 'Jordan Patel',
    logo: 'HH',
    record: { wins: 2, losses: 8 },
    points: 987,
    streak: 'L1'
  },
  { 
    id: 9, 
    name: 'Gridiron Gladiators', 
    owner: 'Casey Thompson',
    logo: 'GG',
    record: { wins: 1, losses: 9 },
    points: 896,
    streak: 'L6'
  },
  { 
    id: 10, 
    name: 'Puck Pythons', 
    owner: 'Avery Davis',
    logo: 'PP',
    record: { wins: 0, losses: 10 },
    points: 850,
    streak: 'L10'
  }
];

export interface Transaction {
  id: string;
  type: 'claim' | 'drop' | 'trade';
  playerId: string;
  playerName: string;
  playerTeam: string;
  date: string;
  status: 'pending' | 'processed' | 'failed';
}

let cachedLeagueState: Record<number, Player[]> | null = null;
let cachedFreeAgents: Player[] | null = null;
let cachedWatchlist: Set<string> = new Set();
let cachedTransactions: Transaction[] = [
  { id: '1', type: 'claim', playerId: '101', playerName: 'Joey Daccord', playerTeam: 'SEA', date: '2024-03-25', status: 'pending' }
];

const POS_MAPPING: Record<string, string> = {
  'Centre': 'C', 'Left Wing': 'LW', 'Right Wing': 'RW', 'Defence': 'D', 'Goalie': 'G'
};

const getNormalizedPos = (p: Player) => {
  if (!p?.position) return 'UTIL';
  if (POS_MAPPING[p.position]) return POS_MAPPING[p.position];
  return p.position;
};

export const LeagueService = {
  /**
   * Initializes the league state by distributing all players among teams.
   * This ensures that a player is only on one team at a time.
   * Players not assigned to a team become free agents.
   */
  async initializeLeague(allPlayers: Player[]) {
    if (cachedLeagueState && cachedFreeAgents) return;

    const teamsCount = LEAGUE_TEAMS_DATA.length;
    // Roster Size: 2 C, 2 LW, 2 RW, 4 D, 2 G, 1 UTIL, 8 BENCH = 21 Total
    const rosterSize = 21; 
    
    // Minimum requirements for a valid starting lineup
    const minReqs = { 'C': 2, 'LW': 2, 'RW': 2, 'D': 4, 'G': 2 };

    const leagueRosters: Record<number, Player[]> = {};
    for (let i = 1; i <= teamsCount; i++) {
      leagueRosters[i] = [];
    }

    // Sort players by "value" (points) to simulate a draft
    // We use points as a proxy for value, but we need to normalize goalie value
    const getPlayerValue = (p: Player) => {
      const pos = getNormalizedPos(p);
      if (pos === 'G') {
        // Rough fantasy point equivalent for goalies to make them draftable
        // Wins * 4 + Saves * 0.2 - GoalsAgainst * 2
        // If stats are null, give them a baseline value to ensure they get drafted
        const wins = p.wins || 0;
        const saves = p.saves || 0;
        // If no stats (e.g. start of season or fallback data without stats), give arbitrary high value
        if (wins === 0 && saves === 0) return 100; // Middle tier
        return (wins * 4) + (saves * 0.2); 
      }
      return p.points || 0;
    };

    // Force assign some goalies to Team 3 (User) if available, to ensure they have some for the demo
    // Find top available goalies
    const goalies = allPlayers.filter(p => getNormalizedPos(p) === 'G')
      .sort((a, b) => getPlayerValue(b) - getPlayerValue(a));
    
    // Assign 2 goalies to Team 3 immediately (remove them from draft pool)
    const userGoalies = goalies.slice(0, 2);
    leagueRosters[3].push(...userGoalies);

    // Filter out these assigned goalies from the draft pool
    const assignedIds = new Set(userGoalies.map(p => p.id));
    
    // Initial pool of available players
    const availablePlayers = [...allPlayers]
      .filter(p => !assignedIds.has(p.id))
      .sort((a, b) => getPlayerValue(b) - getPlayerValue(a));

    // Snake draft simulation
    // Round 1: 1 -> 10
    // Round 2: 10 -> 1
    let round = 0;
    // We continue until all teams are full or we run out of players
    while (true) {
      const isEvenRound = round % 2 === 0; // 0, 2, 4... (1->10)
      
      let teamsProcessedInRound = 0;

      for (let i = 0; i < teamsCount; i++) {
        const teamId = isEvenRound ? (i + 1) : (teamsCount - i);
        const currentRoster = leagueRosters[teamId];

        if (currentRoster.length >= rosterSize) {
          teamsProcessedInRound++;
          continue;
        }

        // Determine needs
        const counts = { 'C': 0, 'LW': 0, 'RW': 0, 'D': 0, 'G': 0 };
        currentRoster.forEach(p => {
          const pos = getNormalizedPos(p);
          if (counts[pos] !== undefined) counts[pos]++;
        });

        // Draft Strategy:
        // 1. Fill starting requirements first
        // 2. Then Best Available
        
        // Find needed positions
        const needs: string[] = [];
        if (counts['C'] < minReqs['C']) needs.push('C');
        if (counts['LW'] < minReqs['LW']) needs.push('LW');
        if (counts['RW'] < minReqs['RW']) needs.push('RW');
        if (counts['D'] < minReqs['D']) needs.push('D');
        if (counts['G'] < minReqs['G']) needs.push('G');

        let pickedPlayer: Player | null = null;
        let pickedIndex = -1;

        if (needs.length > 0) {
          // Find best player matching a need
          pickedIndex = availablePlayers.findIndex(p => needs.includes(getNormalizedPos(p)));
        }

        // If no player found for needs (or no needs left), take best available (UTIL/Bench)
        if (pickedIndex === -1) {
          // If we are full on roster size, skip (handled by loop check above)
          // But we should try to avoid taking a 5th goalie if we need a forward, etc.
          // For simplicity, just BPA
          pickedIndex = 0;
        }

        if (pickedIndex !== -1 && pickedIndex < availablePlayers.length) {
          pickedPlayer = availablePlayers[pickedIndex];
          // Remove from available
          availablePlayers.splice(pickedIndex, 1);
          // Add to roster
          currentRoster.push(pickedPlayer);
        }
        
        teamsProcessedInRound++;
      }

      // Check if we are done
      const allFull = Object.values(leagueRosters).every(r => r.length >= rosterSize);
      if (allFull || availablePlayers.length === 0) break;

      round++;
    }

    cachedLeagueState = leagueRosters;
    cachedFreeAgents = availablePlayers;
  },

  async getMyTeam(allPlayers: Player[]): Promise<Player[]> {
    await this.initializeLeague(allPlayers);
    return cachedLeagueState?.[3] || []; // User is Team 3
  },

  async getTeamRoster(teamId: number, allPlayers: Player[]): Promise<Player[]> {
    await this.initializeLeague(allPlayers);
    return cachedLeagueState?.[teamId] || [];
  },

  async getFreeAgents(allPlayers: Player[]): Promise<Player[]> {
    await this.initializeLeague(allPlayers);
    return cachedFreeAgents || [];
  },

  getWatchlist(): Set<string> {
    return cachedWatchlist;
  },

  addToWatchlist(playerId: string) {
    cachedWatchlist.add(playerId);
  },

  removeFromWatchlist(playerId: string) {
    cachedWatchlist.delete(playerId);
  },

  getTransactions(): Transaction[] {
    return cachedTransactions;
  },

  addTransaction(transaction: Transaction) {
    cachedTransactions.unshift(transaction);
  },

  getAllTeams(): LeagueTeam[] {
    // This returns the static team data, rosters need to be fetched via getTeamRoster
    // or we can merge them here if we are careful about async initialization
    return LEAGUE_TEAMS_DATA.map(t => ({
        ...t,
        roster: cachedLeagueState?.[t.id] || []
    }));
  },
  
  async getAllTeamsWithRosters(allPlayers: Player[]): Promise<LeagueTeam[]> {
    await this.initializeLeague(allPlayers);
    return LEAGUE_TEAMS_DATA.map(t => ({
        ...t,
        roster: cachedLeagueState?.[t.id] || []
    }));
  },

  /**
   * Save lineup configuration to Supabase (with localStorage fallback)
   * Stores player IDs and their slot assignments in shared database
   */
  async saveLineup(teamId: number, lineup: { 
    starters: (string | number)[], 
    bench: (string | number)[], 
    ir: (string | number)[], 
    slotAssignments: Record<string, string> 
  }) {
    // Convert all IDs to strings for consistency
    const lineupToSave = {
      starters: lineup.starters.map(id => String(id)),
      bench: lineup.bench.map(id => String(id)),
      ir: lineup.ir.map(id => String(id)),
      slotAssignments: lineup.slotAssignments
    };

    try {
      // Try Supabase first (shared database)
      const { error } = await supabase
        .from('team_lineups')
        .upsert({
          team_id: teamId,
          starters: lineupToSave.starters,
          bench: lineupToSave.bench,
          ir: lineupToSave.ir,
          slot_assignments: lineupToSave.slotAssignments,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'team_id'
        });
      
      if (error) {
        console.warn('Supabase save failed, using localStorage fallback:', error);
        throw error; // Fall through to localStorage
      }
    } catch (error) {
      // Fallback to localStorage if Supabase fails (offline mode, errors, etc.)
      try {
        const key = `lineup_team_${teamId}`;
        localStorage.setItem(key, JSON.stringify(lineupToSave));
        console.log('Saved to localStorage as fallback');
      } catch (localError) {
        console.error('Failed to save lineup to both Supabase and localStorage:', localError);
      }
    }
  },

  /**
   * Load saved lineup configuration from Supabase (with localStorage fallback)
   * Returns lineup from shared database, or falls back to localStorage
   */
  async getLineup(teamId: number): Promise<{ 
    starters: string[], 
    bench: string[], 
    ir: string[], 
    slotAssignments: Record<string, string> 
  } | null> {
    try {
      // Try Supabase first (shared database)
      const { data, error } = await supabase
        .from('team_lineups')
        .select('starters, bench, ir, slot_assignments')
        .eq('team_id', teamId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found", which is OK
        console.warn('Supabase load failed, trying localStorage fallback:', error);
        throw error; // Fall through to localStorage
      }
      
      if (data) {
        return {
          starters: (data.starters || []) as string[],
          bench: (data.bench || []) as string[],
          ir: (data.ir || []) as string[],
          slotAssignments: (data.slot_assignments || {}) as Record<string, string>
        };
      }
      
      // No data found in Supabase, try localStorage fallback
      return null;
    } catch (error) {
      // Fallback to localStorage if Supabase fails
      try {
        const key = `lineup_team_${teamId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          console.log('Loaded from localStorage fallback');
          return JSON.parse(saved);
        }
      } catch (localError) {
        console.error('Failed to load lineup from both Supabase and localStorage:', localError);
      }
      return null;
    }
  }
};
