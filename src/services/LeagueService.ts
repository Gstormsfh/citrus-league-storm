import { Player } from "@/services/PlayerService";

// Hardcoded "Draft" results to ensure consistency across the app
// We assign players to teams deterministically based on their ID hash or simple round-robin
// We assume we have 10 teams in the league (ID 1-10).
// ID 3 is the User's team ("Citrus Crushers").

export interface LeagueTeam {
  id: number;
  name: string;
  roster: Player[];
}

let cachedLeagueState: Record<number, Player[]> | null = null;
let cachedFreeAgents: Player[] | null = null;

const POS_MAPPING: Record<string, string> = {
  'Centre': 'C', 'Left Wing': 'LW', 'Right Wing': 'RW', 'Defence': 'D', 'Goalie': 'G'
};

const getNormalizedPos = (p: Player) => {
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

    const teamsCount = 10; // 9 AI + 1 User
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
  }
};
