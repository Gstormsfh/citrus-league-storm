import { MatchupPlayer } from "./types";
import { MatchupComparisonRow } from "./MatchupComparisonRow";

interface MatchupPositionGroupProps {
  userPlayers: (MatchupPlayer | null)[];
  opponentPlayers: (MatchupPlayer | null)[];
  onPlayerClick?: (player: MatchupPlayer) => void;
}

export const MatchupPositionGroup = ({
  userPlayers,
  opponentPlayers,
  onPlayerClick
}: MatchupPositionGroupProps) => {
  // Ensure both arrays have the same length
  const maxLength = Math.max(userPlayers.length, opponentPlayers.length);
  const paddedUserPlayers = [...userPlayers];
  const paddedOpponentPlayers = [...opponentPlayers];
  
  while (paddedUserPlayers.length < maxLength) {
    paddedUserPlayers.push(null);
  }
  while (paddedOpponentPlayers.length < maxLength) {
    paddedOpponentPlayers.push(null);
  }

  return (
    <>
      {paddedUserPlayers.map((userPlayer, index) => {
        // Get position from player or use empty string
        const position = userPlayer?.position || opponentPlayers[index]?.position || '';
        return (
          <MatchupComparisonRow
            key={index}
            userPlayer={userPlayer}
            opponentPlayer={paddedOpponentPlayers[index]}
            position={position}
            onPlayerClick={onPlayerClick}
          />
        );
      })}
    </>
  );
};

