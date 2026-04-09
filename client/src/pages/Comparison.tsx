import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, TrendingUp, Battery, Zap, AlertCircle, HardDrive } from "lucide-react";
import HomeButton from "@/components/HomeButton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { localConfigs, LocalConfig } from "@/lib/localStore";

const COMPARISON_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#10b981", // green
  "#f59e0b", // orange
];

interface ConfigItem {
  id: number;
  name: string;
  description?: string | null;
  pvCell: string;
  battery: string;
  concentrator?: string | null;
  concentratorArea: number;
  pvArea: number;
  batteryCapacity: number;
  baseLoad: number;
  durationHours: number;
  yearsOperation: number;
}

interface ComparisonResult {
  configId: number;
  configName: string;
  color: string;
  results: any;
  metrics: {
    avgPower: number;
    peakPower: number;
    minSoc: number;
    energyBalance: number;
    viable: boolean;
  };
}

export default function Comparison() {
  const { user, loading: authLoading } = useAuth();
  const [selectedConfigs, setSelectedConfigs] = useState<number[]>([]);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Local (unauthenticated) configurations from localStorage
  const [localConfigList, setLocalConfigList] = useState<LocalConfig[]>([]);

  useEffect(() => {
    // Always load local configs so they are available even when not authenticated
    setLocalConfigList(localConfigs.list());
  }, []);

  // Server-side configurations (only when authenticated)
  const { data: serverConfigurations, isLoading: configsLoading } = trpc.configurations.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  const runSimulationMutation = trpc.simulation.run.useMutation();

  // Merge server + local configs, deduplicating by name when authenticated
  const configurations: ConfigItem[] = user
    ? (serverConfigurations ?? [])
    : localConfigList;

  const toggleConfig = (id: number) => {
    setSelectedConfigs((prev) => {
      if (prev.includes(id)) {
        return prev.filter((cid) => cid !== id);
      } else if (prev.length < 4) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const runComparison = async () => {
    if (!configurations || selectedConfigs.length === 0) return;

    setIsComparing(true);
    setComparisonResults([]);

    try {
      const results: ComparisonResult[] = [];

      for (let i = 0; i < selectedConfigs.length; i++) {
        const configId = selectedConfigs[i];
        const config = configurations.find((c) => c.id === configId);
        if (!config) continue;

        const simResult = await runSimulationMutation.mutateAsync({
          concentrator: config.concentrator || "None",
          pv_cell: config.pvCell,
          battery: config.battery,
          concentrator_area_m2: config.concentratorArea,
          pv_area_m2: config.pvArea,
          battery_capacity_wh: config.batteryCapacity,
          base_load_w: config.baseLoad,
          duration_hours: config.durationHours,
          years_operation: config.yearsOperation,
          save: false,
        });

        results.push({
          configId: config.id,
          configName: config.name,
          color: COMPARISON_COLORS[i],
          results: simResult,
          metrics: {
            avgPower: simResult.metrics?.avg_power_generated || 0,
            peakPower: simResult.metrics?.peak_power_generated || 0,
            minSoc: simResult.metrics?.min_soc || 0,
            energyBalance: simResult.metrics?.energy_balance || 0,
            viable: simResult.metrics?.viable || false,
          },
        });
      }

      setComparisonResults(results);
    } catch (error) {
      console.error("Comparison failed:", error);
    } finally {
      setIsComparing(false);
    }
  };

  // Prepare chart data
  const powerChartData = comparisonResults.length > 0 && comparisonResults[0]?.results?.time
    ? comparisonResults[0].results.time.map((_: any, idx: number) => {
        const point: any = {
          time: comparisonResults[0].results.time[idx],
        };
        comparisonResults.forEach((result) => {
          if (result?.results?.power_generated?.[idx] !== undefined) {
            point[result.configName] = result.results.power_generated[idx];
          }
        });
        return point;
      })
    : [];

  const socChartData = comparisonResults.length > 0 && comparisonResults[0]?.results?.time
    ? comparisonResults[0].results.time.map((_: any, idx: number) => {
        const point: any = {
          time: comparisonResults[0].results.time[idx],
        };
        comparisonResults.forEach((result) => {
          if (result?.results?.battery_soc?.[idx] !== undefined) {
            point[result.configName] = result.results.battery_soc[idx] * 100;
          }
        });
        return point;
      })
    : [];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isLoading = user ? configsLoading : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8C1D40] via-[#8C1D40] to-[#FFC627] p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Configuration Comparison</h1>
            <p className="text-white/90">
              Compare up to 4 saved configurations side-by-side
            </p>
            {!user && (
              <p className="text-white/70 text-sm mt-1 flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                Showing locally saved configurations (no login required)
              </p>
            )}
          </div>
          <HomeButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Select Configurations</CardTitle>
              <CardDescription>
                Choose up to 4 configurations to compare ({selectedConfigs.length}/4 selected)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : configurations && configurations.length > 0 ? (
                <div className="space-y-3">
                  {configurations.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={`config-${config.id}`}
                        checked={selectedConfigs.includes(config.id)}
                        onCheckedChange={() => toggleConfig(config.id)}
                        disabled={
                          !selectedConfigs.includes(config.id) && selectedConfigs.length >= 4
                        }
                      />
                      <label
                        htmlFor={`config-${config.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{config.name}</div>
                        {config.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {config.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {config.pvCell} • {config.battery}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No saved configurations yet.</p>
                  <p className="text-sm mt-2">
                    Save configurations from the Simulator page to compare them here.
                  </p>
                </div>
              )}

              {configurations && configurations.length > 0 && (
                <Button
                  onClick={runComparison}
                  disabled={selectedConfigs.length === 0 || isComparing}
                  className="w-full mt-4"
                >
                  {isComparing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Comparison...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Compare Selected
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Comparison Results */}
          <div className="lg:col-span-2 space-y-6">
            {comparisonResults.length > 0 ? (
              <>
                {/* Metrics Comparison Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Configuration</th>
                            <th className="text-right py-2 px-3">Avg Power (W)</th>
                            <th className="text-right py-2 px-3">Peak Power (W)</th>
                            <th className="text-right py-2 px-3">Min SOC (%)</th>
                            <th className="text-right py-2 px-3">Energy Balance (Wh)</th>
                            <th className="text-center py-2 px-3">Viable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonResults.map((result) => (
                            <tr key={result.configId} className="border-b">
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: result.color }}
                                  />
                                  <span className="font-medium">{result.configName}</span>
                                </div>
                              </td>
                              <td className="text-right py-2 px-3">
                                {result.metrics.avgPower.toFixed(1)}
                              </td>
                              <td className="text-right py-2 px-3">
                                {result.metrics.peakPower.toFixed(1)}
                              </td>
                              <td className="text-right py-2 px-3">
                                {(result.metrics.minSoc * 100).toFixed(1)}
                              </td>
                              <td className="text-right py-2 px-3">
                                {result.metrics.energyBalance.toFixed(0)}
                              </td>
                              <td className="text-center py-2 px-3">
                                {result.metrics.viable ? (
                                  <span className="text-green-600">✓</span>
                                ) : (
                                  <span className="text-red-600">✗</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Power Generation Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Power Generation Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={powerChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" label={{ value: "Time (hours)", position: "insideBottom", offset: -5 }} />
                        <YAxis label={{ value: "Power (W)", angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        {comparisonResults.map((result) => (
                          <Line
                            key={result.configId}
                            type="monotone"
                            dataKey={result.configName}
                            stroke={result.color}
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Battery SOC Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Battery className="h-5 w-5" />
                      Battery State of Charge Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={socChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" label={{ value: "Time (hours)", position: "insideBottom", offset: -5 }} />
                        <YAxis label={{ value: "SOC (%)", angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        {comparisonResults.map((result) => (
                          <Line
                            key={result.configId}
                            type="monotone"
                            dataKey={result.configName}
                            stroke={result.color}
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No comparison results yet</p>
                    <p className="text-sm mt-2">
                      Select configurations and click "Compare Selected" to see results
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
