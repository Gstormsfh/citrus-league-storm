interface CenterColumnProps {
  position: string;
  userPlayer?: { projectedPoints?: number } | null;
  opponentPlayer?: { projectedPoints?: number } | null;
}

// Get position color styles for center column - Citrus Pastel Theme (Distinct Colors)
const getPositionStyles = (position: string): { bg: string; border: string; text: string } => {
  const pos = position?.toUpperCase() || '';
  if (pos.includes('C') && !pos.includes('LW') && !pos.includes('RW')) {
    // Center - Citrus Orange (#FFA366)
    return { bg: 'rgba(255, 163, 102, 0.2)', border: 'rgba(255, 163, 102, 0.6)', text: '#FFA366' };
  }
  if (pos.includes('LW') || pos === 'L' || pos === 'LEFT' || pos === 'LEFTWING') {
    // Left Wing - Citrus Lime Green (#9BCF4A)
    return { bg: 'rgba(155, 207, 74, 0.2)', border: 'rgba(155, 207, 74, 0.6)', text: '#9BCF4A' };
  }
  if (pos.includes('RW') || pos === 'R' || pos === 'RIGHT' || pos === 'RIGHTWING') {
    // Right Wing - Citrus Golden Yellow (#FFCC33)
    return { bg: 'rgba(255, 204, 51, 0.2)', border: 'rgba(255, 204, 51, 0.6)', text: '#FFCC33' };
  }
  if (pos.includes('D')) {
    // Defense - Deep Blueberry Blue (#4A5D8C) - distinct from citrus colors
    return { bg: 'rgba(74, 93, 140, 0.2)', border: 'rgba(74, 93, 140, 0.6)', text: '#4A5D8C' };
  }
  if (pos.includes('G')) {
    // Goalie - Deep Blackberry (#5D3A6B) - distinct purple-berry color
    return { bg: 'rgba(93, 58, 107, 0.2)', border: 'rgba(93, 58, 107, 0.6)', text: '#5D3A6B' };
  }
  if (pos === 'UTIL' || pos === 'UTILITY') {
    // Utility - Citrus Apricot (#FFB84D) - distinct orange-yellow blend
    return { bg: 'rgba(255, 184, 77, 0.2)', border: 'rgba(255, 184, 77, 0.6)', text: '#FFB84D' };
  }
  return { bg: 'hsl(var(--muted) / 0.15)', border: 'hsl(var(--border) / 0.3)', text: 'hsl(var(--foreground))' };
};

export const CenterColumn = ({ position, userPlayer, opponentPlayer }: CenterColumnProps) => {
  const maxProjection = 8; // Max projection for bar scaling
  const userProjection = userPlayer?.projectedPoints || 0;
  const opponentProjection = opponentPlayer?.projectedPoints || 0;
  const positionStyles = getPositionStyles(position);
  
  return (
    <div 
      className="matchup-center-column"
      style={{
        background: positionStyles.bg,
        borderLeftColor: positionStyles.border,
        borderRightColor: positionStyles.border,
      }}
    >
      <span 
        className="position-label"
        style={{ color: positionStyles.text }}
      >
        {position}
      </span>
      
      {/* Projection Container with Bars and Scores */}
      <div className="projection-container">
        {/* User Projection */}
        <div className="projection-item">
          <div className="projection-bar-wrapper">
            <div 
              className="projection-bar projection-bar-user" 
              style={{ width: `${Math.min((userProjection / maxProjection) * 100, 100)}%` }}
            />
          </div>
          {userProjection > 0 && (
            <span className="projected-score projected-score-user">{userProjection.toFixed(1)}</span>
          )}
        </div>
        
        {/* Opponent Projection */}
        <div className="projection-item">
          <div className="projection-bar-wrapper">
            <div 
              className="projection-bar projection-bar-opponent" 
              style={{ width: `${Math.min((opponentProjection / maxProjection) * 100, 100)}%` }}
            />
          </div>
          {opponentProjection > 0 && (
            <span className="projected-score projected-score-opponent">{opponentProjection.toFixed(1)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

