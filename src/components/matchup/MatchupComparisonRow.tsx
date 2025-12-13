import { MatchupPlayer } from "./types";
import { PlayerCard } from "./PlayerCard";
import { CenterColumn } from "./CenterColumn";

interface MatchupComparisonRowProps {
  userPlayer: MatchupPlayer | null;
  opponentPlayer: MatchupPlayer | null;
  position: string;
  onPlayerClick?: (player: MatchupPlayer) => void;
}

export const MatchupComparisonRow = ({
  userPlayer,
  opponentPlayer,
  position,
  onPlayerClick
}: MatchupComparisonRowProps) => {
  // Calculate projected points for tonight (points / 20 is the standard projection calculation)
  const userProjectedPoints = userPlayer ? (userPlayer.points || 0) / 20 : 0;
  const opponentProjectedPoints = opponentPlayer ? (opponentPlayer.points || 0) / 20 : 0;
  
  // Add projectedPoints to players if not already present
  const userPlayerWithProjection = userPlayer ? { ...userPlayer, projectedPoints: userProjectedPoints } : null;
  const opponentPlayerWithProjection = opponentPlayer ? { ...opponentPlayer, projectedPoints: opponentProjectedPoints } : null;
  
  return (
    <div className="matchup-comparison-row">
      {/* User Team Player Card */}
      <PlayerCard 
        player={userPlayerWithProjection} 
        isUserTeam={true}
        onPlayerClick={onPlayerClick}
      />
      
      {/* Center Column - hidden on mobile, visible on desktop */}
      <CenterColumn 
        position={position}
        userPlayer={userPlayer ? { projectedPoints: userProjectedPoints } : null}
        opponentPlayer={opponentPlayer ? { projectedPoints: opponentProjectedPoints } : null}
      />
      
      {/* Opponent Team Player Card */}
      <PlayerCard 
        player={opponentPlayerWithProjection} 
        isUserTeam={false}
        onPlayerClick={onPlayerClick}
      />
    </div>
  );
};

