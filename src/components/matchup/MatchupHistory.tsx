
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const MatchupHistory = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Matchup History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-fantasy-light rounded-md">
            <div>
              <span className="block text-sm mb-1">Week 4, 2024</span>
              <div className="flex items-center">
                <span className="font-medium">Citrus Crushers</span>
                <span className="mx-2 text-fantasy-positive font-bold">W</span>
                <span>148-132</span>
              </div>
            </div>
            <div className="text-fantasy-muted">vs. Thunder Titans</div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-fantasy-light rounded-md">
            <div>
              <span className="block text-sm mb-1">Week 11, 2023</span>
              <div className="flex items-center">
                <span className="font-medium">Citrus Crushers</span>
                <span className="mx-2 text-fantasy-danger font-bold">L</span>
                <span>118-135</span>
              </div>
            </div>
            <div className="text-fantasy-muted">vs. Thunder Titans</div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-fantasy-light rounded-md">
            <div>
              <span className="block text-sm mb-1">Week 2, 2023</span>
              <div className="flex items-center">
                <span className="font-medium">Citrus Crushers</span>
                <span className="mx-2 text-fantasy-positive font-bold">W</span>
                <span>157-145</span>
              </div>
            </div>
            <div className="text-fantasy-muted">vs. Thunder Titans</div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <div className="inline-flex items-center bg-fantasy-light rounded-lg p-2">
            <div className="px-3 py-1 text-center">
              <div className="text-xl font-bold">2</div>
              <div className="text-xs text-fantasy-muted">WINS</div>
            </div>
            <div className="px-3 py-1 border-l border-r border-fantasy-border text-center">
              <div className="text-xl font-bold">1</div>
              <div className="text-xs text-fantasy-muted">LOSS</div>
            </div>
            <div className="px-3 py-1 text-center">
              <div className="text-xl font-bold">66%</div>
              <div className="text-xs text-fantasy-muted">WIN RATE</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
