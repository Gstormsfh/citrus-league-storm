import { MatchupPlayer } from "./types";
import { MatchupPositionGroup } from "./MatchupPositionGroup";
import { organizeMatchupData } from "./matchupUtils";

interface MatchupComparisonProps {
  userStarters: MatchupPlayer[];
  opponentStarters: MatchupPlayer[];
  userSlotAssignments: Record<string, string>;
  opponentSlotAssignments: Record<string, string>;
  onPlayerClick?: (player: MatchupPlayer) => void;
}

export const MatchupComparison = ({
  userStarters,
  opponentStarters,
  userSlotAssignments,
  opponentSlotAssignments,
  onPlayerClick
}: MatchupComparisonProps) => {
  // Organize players by slot order (flattened, no position grouping)
  const positionGroups = organizeMatchupData(
    userStarters,
    opponentStarters,
    userSlotAssignments,
    opponentSlotAssignments
  );

  // Flatten all players into one continuous list
  const allUserPlayers: (MatchupPlayer | null)[] = [];
  const allOpponentPlayers: (MatchupPlayer | null)[] = [];

  positionGroups.forEach(group => {
    allUserPlayers.push(...group.userPlayers);
    allOpponentPlayers.push(...group.opponentPlayers);
  });

  // Calculate totals
  const userTotal = allUserPlayers.reduce((sum, player) => sum + (player?.points || 0), 0);
  const opponentTotal = allOpponentPlayers.reduce((sum, player) => sum + (player?.points || 0), 0);

  return (
    <div className="w-full">
      <div className="matchup-position-group">
        <MatchupPositionGroup
          userPlayers={allUserPlayers}
          opponentPlayers={allOpponentPlayers}
          onPlayerClick={onPlayerClick}
        />
      </div>
      
      {/* Total Points Row */}
      <div className="matchup-total-row">
        <div className="matchup-total-card matchup-total-user">
          <div className="matchup-total-label">Total</div>
          <div className="matchup-total-score">{userTotal.toFixed(1)}</div>
        </div>
        <div className="matchup-center-column matchup-total-center">
          <span className="position-label">TOT</span>
        </div>
        <div className="matchup-total-card matchup-total-opponent">
          <div className="matchup-total-label">Total</div>
          <div className="matchup-total-score">{opponentTotal.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
};

