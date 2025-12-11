/**
 * DemoDataService
 * 
 * Centralized service for managing demo league data.
 * Provides read-only dummy data for guest users and logged-in users without leagues.
 */

import { LeagueTeam, LEAGUE_TEAMS_DATA } from './LeagueService';
import { MatchupPlayer } from '@/components/matchup/types';
import { Player } from './PlayerService';

export interface DemoLeague {
  id: 'demo-league';
  name: 'Demo League';
  teams: LeagueTeam[];
  currentWeek: number;
  matchup: {
    myTeam: MatchupPlayer[];
    opponentTeam: MatchupPlayer[];
    myScore: number;
    opponentScore: number;
    week: number;
  };
}

/**
 * Get demo league data
 * This is a static, read-only dataset for demonstration purposes
 */
export const DemoDataService = {
  /**
   * Get demo league information
   */
  getDemoLeague(): DemoLeague {
    return {
      id: 'demo-league',
      name: 'Demo League',
      teams: LEAGUE_TEAMS_DATA,
      currentWeek: 5,
      matchup: {
        myTeam: this.getDemoMyTeam(),
        opponentTeam: this.getDemoOpponentTeam(),
        myScore: 245.7,
        opponentScore: 232.3,
        week: 5,
      },
    };
  },

  /**
   * Get demo teams for standings
   */
  getDemoTeams(): LeagueTeam[] {
    return LEAGUE_TEAMS_DATA;
  },

  /**
   * Get demo "My Team" roster players for matchup view
   */
  getDemoMyTeam(): MatchupPlayer[] {
    return [
      { id: 1, name: "Connor McDavid", position: "C", team: "EDM", points: 32.5, gamesRemaining: 2, status: "In Game", isStarter: true, isToday: true, stats: { goals: 1, assists: 2, sog: 4, blk: 0, gamesPlayed: 32 }, gameInfo: { opponent: "vs CGY", score: "EDM 4-2", period: "3rd 12:45" } },
      { id: 2, name: "Leon Draisaitl", position: "C", team: "EDM", points: 28.2, gamesRemaining: 1, status: "In Game", isStarter: true, isToday: true, stats: { goals: 0, assists: 1, sog: 2, blk: 0, gamesPlayed: 32 }, gameInfo: { opponent: "vs CGY", score: "EDM 4-2", period: "3rd 12:45" } },
      { id: 3, name: "Auston Matthews", position: "C", team: "TOR", points: 25.7, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 2, assists: 0, sog: 6, blk: 1, gamesPlayed: 30 } },
      { id: 4, name: "Nathan MacKinnon", position: "C", team: "COL", points: 22.8, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 3, sog: 5, blk: 0, gamesPlayed: 31 } },
      { id: 5, name: "David Pastrnak", position: "RW", team: "BOS", points: 21.4, gamesRemaining: 1, status: "In Game", isStarter: true, isToday: true, stats: { goals: 1, assists: 1, sog: 3, blk: 0, gamesPlayed: 33 }, gameInfo: { opponent: "@ FLA", score: "BOS 2-1", period: "2nd 4:20" } },
      { id: 6, name: "Mikko Rantanen", position: "RW", team: "COL", points: 18.9, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 2, sog: 2, blk: 1, gamesPlayed: 31 } },
      { id: 7, name: "Kirill Kaprizov", position: "LW", team: "MIN", points: 17.5, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 1, assists: 0, sog: 4, blk: 0, gamesPlayed: 29 } },
      { id: 8, name: "Alex Ovechkin", position: "LW", team: "WSH", points: 16.2, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 1, assists: 0, sog: 5, blk: 1, gamesPlayed: 28 } },
      { id: 9, name: "Cale Makar", position: "D", team: "COL", points: 15.7, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 2, sog: 2, blk: 2, gamesPlayed: 31 } },
      { id: 10, name: "Adam Fox", position: "D", team: "NYR", points: 13.8, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0, gamesPlayed: 30 }, gameInfo: { opponent: "vs NJD", time: "7:00 PM" } },
      { id: 11, name: "Roman Josi", position: "D", team: "NSH", points: 11.5, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 0, assists: 1, sog: 3, blk: 2, gamesPlayed: 32 } },
      { id: 12, name: "Victor Hedman", position: "D", team: "TBL", points: 10.7, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 1, sog: 2, blk: 1, gamesPlayed: 33 } },
      { id: 13, name: "Andrei Vasilevskiy", position: "G", team: "TBL", points: 24.8, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 0, sog: 0, blk: 0, gamesPlayed: 25 } },
      { id: 14, name: "Igor Shesterkin", position: "G", team: "NYR", points: 23.2, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0, gamesPlayed: 24 }, gameInfo: { opponent: "vs NJD", time: "7:00 PM" } },
      { id: 15, name: "Matt Duchene", position: "C", team: "DAL", points: 8.5, gamesRemaining: 2, status: "Yet to Play", isStarter: false, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0, gamesPlayed: 29 }, gameInfo: { opponent: "@ STL", time: "8:00 PM" } },
      { id: 16, name: "Mitch Marner", position: "RW", team: "TOR", points: 14.8, gamesRemaining: 0, status: "Final", isStarter: false, isToday: false, stats: { goals: 0, assists: 2, sog: 3, blk: 1, gamesPlayed: 30 } },
      { id: 17, name: "Brady Tkachuk", position: "LW", team: "OTT", points: 12.3, gamesRemaining: 1, status: "Yet to Play", isStarter: false, isToday: false, stats: { goals: 1, assists: 0, sog: 5, blk: 4, gamesPlayed: 28 } },
      { id: 18, name: "Quinn Hughes", position: "D", team: "VAN", points: 9.7, gamesRemaining: 2, status: "Yet to Play", isStarter: false, isToday: false, stats: { goals: 0, assists: 1, sog: 2, blk: 0, gamesPlayed: 31 } },
      { id: 19, name: "Jacob Markstrom", position: "G", team: "CGY", points: 18.5, gamesRemaining: 0, status: "Final", isStarter: false, isToday: false, stats: { goals: 0, assists: 0, sog: 0, blk: 0, gamesPlayed: 22 } },
    ];
  },

  /**
   * Get demo opponent team for matchup view
   */
  getDemoOpponentTeam(): MatchupPlayer[] {
    return [
      { id: 101, name: "Sidney Crosby", position: "C", team: "PIT", points: 29.7, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "vs PHI", time: "7:30 PM" } },
      { id: 102, name: "Nikita Kucherov", position: "RW", team: "TBL", points: 27.9, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 1, assists: 2, sog: 4, blk: 0 } },
      { id: 103, name: "Artemi Panarin", position: "LW", team: "NYR", points: 26.2, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "vs NJD", time: "7:00 PM" } },
      { id: 104, name: "Brad Marchand", position: "LW", team: "BOS", points: 22.1, gamesRemaining: 1, status: "In Game", isStarter: true, isToday: true, stats: { goals: 0, assists: 1, sog: 2, blk: 1 }, gameInfo: { opponent: "@ FLA", score: "BOS 2-1", period: "2nd 4:20" } },
      { id: 105, name: "Elias Pettersson", position: "C", team: "VAN", points: 20.8, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 1, assists: 1, sog: 3, blk: 1 } },
      { id: 106, name: "Jack Hughes", position: "C", team: "NJD", points: 19.5, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 1, assists: 1, sog: 5, blk: 0 } },
      { id: 107, name: "William Nylander", position: "RW", team: "TOR", points: 18.2, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 1, assists: 0, sog: 4, blk: 0 } },
      { id: 108, name: "Matthew Tkachuk", position: "RW", team: "FLA", points: 17.8, gamesRemaining: 2, status: "In Game", isStarter: true, isToday: true, stats: { goals: 1, assists: 0, sog: 3, blk: 2 }, gameInfo: { opponent: "vs BOS", score: "BOS 2-1", period: "2nd 4:20" } },
      { id: 109, name: "Brent Burns", position: "D", team: "CAR", points: 13.2, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 0, assists: 1, sog: 3, blk: 2 } },
      { id: 110, name: "Dougie Hamilton", position: "D", team: "NJD", points: 12.5, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 0, assists: 1, sog: 2, blk: 3 } },
      { id: 111, name: "Shea Theodore", position: "D", team: "VGK", points: 11.8, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "@ LAK", time: "10:00 PM" } },
      { id: 112, name: "Moritz Seider", position: "D", team: "DET", points: 9.9, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 0, sog: 1, blk: 4 } },
      { id: 113, name: "Connor Hellebuyck", position: "G", team: "WPG", points: 26.3, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 0, sog: 0, blk: 0 } },
      { id: 114, name: "Ilya Sorokin", position: "G", team: "NYI", points: 22.7, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "@ WAS", time: "7:00 PM" } },
    ];
  },

  /**
   * Get demo roster players (for roster page)
   * This will be populated from LeagueService.getMyTeam() which uses cached demo data
   */
  async getDemoRoster(allPlayers: Player[]): Promise<Player[]> {
    const { LeagueService } = await import('./LeagueService');
    return LeagueService.getMyTeam(allPlayers);
  },
};

