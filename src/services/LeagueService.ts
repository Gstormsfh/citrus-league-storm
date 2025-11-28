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

export const LeagueService = {
  /**
   * Initializes the league state by distributing all players among teams.
   * This ensures that a player is only on one team at a time.
   * Players not assigned to a team become free agents.
   */
  async initializeLeague(allPlayers: Player[]) {
    if (cachedLeagueState && cachedFreeAgents) return;

    const teamsCount = 10; // 9 AI + 1 User
    const rosterSize = 23; // 20 starters + 3 bench (approx)
    
    const leagueRosters: Record<number, Player[]> = {};
    for (let i = 1; i <= teamsCount; i++) {
      leagueRosters[i] = [];
    }

    // Sort players by "value" (points) to simulate a draft
    // We use points as a proxy for value.
    const draftablePlayers = [...allPlayers].sort((a, b) => (b.points || 0) - (a.points || 0));

    // Snake draft simulation
    // Round 1: 1 -> 10
    // Round 2: 10 -> 1
    let round = 0;
    let pickIndex = 0;

    while (pickIndex < draftablePlayers.length) {
      // Determine team order for this round
      const isEvenRound = round % 2 === 0; // 0, 2, 4... (1->10)
      
      for (let i = 0; i < teamsCount; i++) {
        if (pickIndex >= draftablePlayers.length) break;

        const teamId = isEvenRound ? (i + 1) : (teamsCount - i);
        const player = draftablePlayers[pickIndex];

        // Only add if team isn't full (optional, but realistic)
        if (leagueRosters[teamId].length < rosterSize) {
          leagueRosters[teamId].push(player);
        }
        
        pickIndex++;
      }
      round++;
      
      // Stop if all teams have full rosters? 
      // Let's fill them up to ~20-23 players each.
      const allFull = Object.values(leagueRosters).every(r => r.length >= rosterSize);
      if (allFull) break;
    }

    cachedLeagueState = leagueRosters;
    cachedFreeAgents = draftablePlayers.slice(pickIndex);
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

