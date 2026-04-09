import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, Rocket, Zap, Info } from "lucide-react";

interface PresetSelectorProps {
  onSelectPreset: (preset: any) => void;
}

export function PresetSelector({ onSelectPreset }: PresetSelectorProps) {
  const { data: presets, isLoading } = trpc.presets.list.useQuery();
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const getPresetColor = (presetName: string) => {
    if (presetName.includes('Optimal')) return 'from-emerald-500 to-emerald-600';
    if (presetName.includes('Baseline')) return 'from-blue-500 to-blue-600';
    if (presetName.includes('High-Power')) return 'from-purple-500 to-purple-600';
    if (presetName.includes('Minimal')) return 'from-green-500 to-green-600';
    if (presetName.includes('Extended')) return 'from-orange-500 to-orange-600';
    if (presetName.includes('No-Concentrator')) return 'from-red-500 to-red-600';
    return 'from-gray-500 to-gray-600';
  };

  const getEraIcon = (era: string) => {
    switch (era) {
      case 'Historical':
        return <Rocket className="h-4 w-4" />;
      case 'Current':
        return <Zap className="h-4 w-4" />;
      case 'Theoretical':
        return <Sparkles className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getEraColor = (era: string) => {
    switch (era) {
      case 'Historical':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
      case 'Current':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'Theoretical':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      default:
        return '';
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading presets...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Configuration Presets
        </CardTitle>
        <CardDescription>
          Quick-start templates for common mission scenarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {presets?.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setSelectedPresetId(preset.id);
                onSelectPreset(preset);
              }}
              className={`text-left p-4 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-lg ${
                selectedPresetId === preset.id
                  ? `border-white bg-gradient-to-r ${getPresetColor(preset.name)} text-white shadow-xl`
                  : `border-border bg-gradient-to-r ${getPresetColor(preset.name)} opacity-80 text-white`
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{preset.name}</h4>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm" side="right">
                      <div className="space-y-2 text-xs">
                        <div>
                          <p className="font-semibold mb-1">Viability:</p>
                          <p className="text-muted-foreground">{preset.tooltip.viability}</p>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Mission Types:</p>
                          <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                            {preset.tooltip.missionTypes.map((type, idx) => (
                              <li key={idx}>{type}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Expected Performance:</p>
                          <div className="text-muted-foreground space-y-0.5">
                            <p>• Energy Balance: {preset.tooltip.expectedPerformance.energyBalance}</p>
                            <p>• Min SOC: {preset.tooltip.expectedPerformance.minSOC}</p>
                            <p>• Reliability: {preset.tooltip.expectedPerformance.reliability}</p>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Badge variant="secondary" className={`${getEraColor(preset.era)} flex items-center gap-1`}>
                  {getEraIcon(preset.era)}
                  {preset.era}
                </Badge>
              </div>
              <p className="text-sm text-white/90 mb-3">{preset.description}</p>
              <div className="text-xs space-y-1 text-white/80">
                <div>• {preset.concentrator}</div>
                <div>• {preset.pvCell}</div>
                <div>• {preset.battery}</div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
