
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyPointsChartProps {
  dayLabels: string[];
  myDailyPoints: number[];
  opponentDailyPoints: number[];
}

export const DailyPointsChart = ({ dayLabels, myDailyPoints, opponentDailyPoints }: DailyPointsChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Points Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-6">
          {dayLabels.map((day, index) => (
            <div key={day} className="text-center">
              <div className="bg-fantasy-light rounded-t-md py-1 text-xs font-medium">
                {day}
              </div>
              <div className="flex flex-col">
                <div className="h-[100px] bg-fantasy-primary/20 relative">
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-fantasy-primary"
                    style={{ height: `${(myDailyPoints[index] / 50) * 100}%` }}
                  ></div>
                  <div className="absolute bottom-1 left-0 right-0 text-xs text-white font-bold">
                    {myDailyPoints[index]}
                  </div>
                </div>
                <div className="h-[100px] bg-fantasy-muted/20 relative">
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-fantasy-muted"
                    style={{ height: `${(opponentDailyPoints[index] / 50) * 100}%` }}
                  ></div>
                  <div className="absolute bottom-1 left-0 right-0 text-xs text-white font-bold">
                    {opponentDailyPoints[index]}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center gap-8">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-fantasy-primary mr-2"></div>
            <span className="text-sm">My Team</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-fantasy-muted mr-2"></div>
            <span className="text-sm">Opponent</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
