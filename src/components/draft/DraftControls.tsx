import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Settings, 
  Download,
  Upload,
  Shuffle
} from 'lucide-react';

interface DraftControlsProps {
  isDraftActive: boolean;
  onToggleDraft: () => void;
}

export const DraftControls = ({ isDraftActive, onToggleDraft }: DraftControlsProps) => {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Settings className="h-4 w-4" />
        Draft Controls
      </h3>
      
      <div className="space-y-4">
        {/* Main Controls */}
        <div className="space-y-2">
          <Button 
            onClick={onToggleDraft}
            className="w-full"
            variant={isDraftActive ? "destructive" : "default"}
          >
            {isDraftActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Draft
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume Draft
              </>
            )}
          </Button>
          
          <Button variant="outline" className="w-full" disabled={!isDraftActive}>
            <SkipForward className="h-4 w-4 mr-2" />
            Skip Pick
          </Button>
        </div>

        {/* Draft Settings */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Draft Settings</div>
          
          <Button variant="ghost" className="w-full justify-start text-sm h-8">
            <RotateCcw className="h-3 w-3 mr-2" />
            Undo Last Pick
          </Button>
          
          <Button variant="ghost" className="w-full justify-start text-sm h-8">
            <Shuffle className="h-3 w-3 mr-2" />
            Randomize Order
          </Button>
        </div>

        {/* Import/Export */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Data</div>
          
          <Button variant="ghost" className="w-full justify-start text-sm h-8">
            <Upload className="h-3 w-3 mr-2" />
            Import Rankings
          </Button>
          
          <Button variant="ghost" className="w-full justify-start text-sm h-8">
            <Download className="h-3 w-3 mr-2" />
            Export Results
          </Button>
        </div>

        {/* Draft Status */}
        <div className="pt-4 border-t space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Status</div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Draft Mode</span>
              <Badge variant={isDraftActive ? "default" : "secondary"} className="text-xs">
                {isDraftActive ? "Active" : "Paused"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Auto-Draft</span>
              <Badge variant="outline" className="text-xs">
                Enabled
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Pick Timer</span>
              <Badge variant="outline" className="text-xs">
                90s
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};