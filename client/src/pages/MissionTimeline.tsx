import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Play, Calendar, TrendingDown, Battery, Zap, FileDown, Info } from "lucide-react";
import { toast } from "sonner";
import { generateTimelinePDF, downloadPDF } from "@/lib/timelinePdfGenerator";
import { Link } from "wouter";
import HomeButton from "@/components/HomeButton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function MissionTimeline() {
  const [pvArea, setPvArea] = useState(2);
  const [batteryCapacity, setBatteryCapacity] = useState(10000);
  const [cellType, setCellType] = useState("GaAs Single Junction");
  
  const [timelineResult, setTimelineResult] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!timelineResult || !defaultTimeline) return;

    setIsExporting(true);
    try {
      const inputs = {
        concentrator: "None",
        pvCell: cellType,
        battery: "Lithium-ion",
        concentratorArea: 0,
        pvArea,
        batteryCapacity,
        baseLoad: defaultTimeline.phases[0]?.averagePowerLoad || 150,
      };

      const lastPhase = timelineResult.phaseResults[timelineResult.phaseResults.length - 1];
      
      const results = {
        phases: timelineResult.phaseResults.map((phase: any) => ({
          phase: phase.phaseName,
          duration_years: phase.endYear - phase.startYear,
          avg_power_w: phase.averagePowerGenerated,
          peak_power_w: phase.averagePowerGenerated * 1.2,
          energy_margin_percent: (phase.avgSOC - 0.2) * 100,
          min_soc_percent: phase.minSOC * 100,
          pv_degradation_percent: (1 - phase.pvEfficiencyFactor) * 100,
          battery_degradation_percent: (1 - phase.batteryCapacityFactor) * 100,
          viable: phase.viable,
        })),
        overall_metrics: {
          total_duration_years: timelineResult.timeline.totalDuration,
          final_pv_efficiency_percent: (lastPhase?.pvEfficiencyFactor || 1) * 100,
          final_battery_capacity_percent: (lastPhase?.batteryCapacityFactor || 1) * 100,
          mission_viable: timelineResult.missionSuccess,
          critical_phases: timelineResult.phaseResults
            .filter((p: any) => !p.viable)
            .map((p: any) => p.phaseName),
        },
      };

      const blob = await generateTimelinePDF(inputs, results);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadPDF(blob, `psyche-timeline-${timestamp}.pdf`);
      toast.success("PDF report generated successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setIsExporting(false);
    }
  };
  
  // Load default timeline
  const { data: defaultTimeline } = trpc.timeline.getDefaultTimeline.useQuery();
  
  // Simulate timeline mutation
  const simulateMutation = trpc.timeline.simulate.useMutation({
    onSuccess: (data) => {
      setTimelineResult(data);
      toast.success("Mission timeline simulated successfully!");
    },
    onError: (error) => {
      toast.error(`Simulation failed: ${error.message}`);
    },
  });
  
  const handleRunSimulation = () => {
    if (!defaultTimeline) {
      toast.error("Timeline data not loaded");
      return;
    }
    
    simulateMutation.mutate({
      phases: defaultTimeline.phases,
      pvArea,
      batteryCapacityWh: batteryCapacity,
      cellType,
    });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Mission Timeline Simulation
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Multi-phase mission simulation with environmental degradation modeling
            </p>
          </div>
          <HomeButton />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* System Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  System Parameters
                </CardTitle>
                <CardDescription>Configure power system specifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="pvArea">PV Array Area (m²)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Total surface area of photovoltaic cells used to convert sunlight into electrical power.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="pvArea"
                    type="number"
                    value={pvArea}
                    onChange={(e) => setPvArea(Number(e.target.value))}
                    min={0.5}
                    max={10}
                    step={0.5}
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="batteryCapacity">Battery Capacity (Wh)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Maximum energy storage capacity of the battery system, measured in watt-hours.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="batteryCapacity"
                    type="number"
                    value={batteryCapacity}
                    onChange={(e) => setBatteryCapacity(Number(e.target.value))}
                    min={1000}
                    max={50000}
                    step={1000}
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="cellType">Solar Cell Type</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Technology type of photovoltaic cells, affecting conversion efficiency and degradation rate over mission lifetime.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <select
                    id="cellType"
                    value={cellType}
                    onChange={(e) => setCellType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                  >
                    <option value="GaAs Single Junction">GaAs Single Junction</option>
                    <option value="Multi-junction GaAs (2J)">Multi-junction GaAs (2J)</option>
                    <option value="Multi-junction GaAs (3J)">Multi-junction GaAs (3J)</option>
                    <option value="Silicon">Silicon</option>
                  </select>
                </div>
                
                <Button 
                  onClick={handleRunSimulation}
                  disabled={simulateMutation.isPending}
                  className="w-full"
                >
                  {simulateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Timeline Simulation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            {/* Mission Phases Overview */}
            {defaultTimeline && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Mission Phases
                  </CardTitle>
                  <CardDescription>
                    {defaultTimeline.phases.length} phases over {defaultTimeline.totalDuration.toFixed(1)} years
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {defaultTimeline.phases.map((phase: any, index: number) => (
                      <div key={phase.id} className="border-l-4 border-blue-500 pl-3 py-2">
                        <div className="font-semibold text-sm">{phase.name}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {phase.durationYears.toFixed(2)} years • {phase.averagePowerLoad}W avg
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right Panel: Results */}
          <div className="lg:col-span-2 space-y-6">
            {timelineResult ? (
              <>
                {/* Export Button */}
                <Button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 mr-2" />
                      Export Timeline PDF
                    </>
                  )}
                </Button>

                {/* Mission Success Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Mission Summary</CardTitle>
                    <CardDescription>
                      {timelineResult.missionSuccess ? (
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          ✓ Mission Successful
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          ✗ Mission Failed
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Total Energy Generated</div>
                        <div className="text-2xl font-bold">{timelineResult.totalEnergyGenerated.toFixed(1)} kWh</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Total Energy Consumed</div>
                        <div className="text-2xl font-bold">{timelineResult.totalEnergyConsumed.toFixed(1)} kWh</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Final Degradation</div>
                        <div className="text-2xl font-bold text-orange-600">{timelineResult.finalDegradation.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Mission Duration</div>
                        <div className="text-2xl font-bold">{timelineResult.timeline.totalDuration.toFixed(1)} years</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Degradation Over Time */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5" />
                      System Degradation Over Time
                    </CardTitle>
                    <CardDescription>Environmental effects on power system performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timelineResult.degradationByYear}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="year" 
                          label={{ value: 'Mission Year', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          label={{ value: 'Performance (% of original)', angle: -90, position: 'insideLeft' }}
                          domain={[0, 100]}
                        />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey={(d) => d.pvPower * 100} 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="PV Power"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey={(d) => d.batteryCapacity * 100} 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Battery Capacity"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                {/* Phase Results */}
                <Card>
                  <CardHeader>
                    <CardTitle>Phase-by-Phase Results</CardTitle>
                    <CardDescription>Detailed performance metrics for each mission phase</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {timelineResult.phaseResults.map((phase: any) => (
                        <div 
                          key={phase.phaseId} 
                          className={`border rounded-lg p-4 ${
                            phase.viable 
                              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">{phase.phaseName}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Year {phase.startYear.toFixed(1)} - {phase.endYear.toFixed(1)}
                              </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              phase.viable 
                                ? 'bg-green-600 text-white' 
                                : 'bg-red-600 text-white'
                            }`}>
                              {phase.viable ? '✓ Viable' : '✗ Failed'}
                            </div>
                          </div>
                          
                          {!phase.viable && phase.failureReason && (
                            <div className="mb-3 p-2 bg-red-100 dark:bg-red-900 rounded text-sm text-red-800 dark:text-red-200">
                              <strong>Failure:</strong> {phase.failureReason}
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <div className="text-slate-600 dark:text-slate-400">Avg Power Gen</div>
                              <div className="font-semibold">{phase.averagePowerGenerated.toFixed(1)} W</div>
                            </div>
                            <div>
                              <div className="text-slate-600 dark:text-slate-400">Avg Power Used</div>
                              <div className="font-semibold">{phase.averagePowerConsumed.toFixed(1)} W</div>
                            </div>
                            <div>
                              <div className="text-slate-600 dark:text-slate-400">Energy Margin</div>
                              <div className={`font-semibold ${phase.energyMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {phase.energyMargin.toFixed(0)} Wh
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-600 dark:text-slate-400">Degradation</div>
                              <div className="font-semibold text-orange-600">{phase.cumulativeDegradation.toFixed(1)}%</div>
                            </div>
                            <div>
                              <div className="text-slate-600 dark:text-slate-400">Min SOC</div>
                              <div className="font-semibold">{(phase.minSOC * 100).toFixed(1)}%</div>
                            </div>
                            <div>
                              <div className="text-slate-600 dark:text-slate-400">Avg SOC</div>
                              <div className="font-semibold">{(phase.avgSOC * 100).toFixed(1)}%</div>
                            </div>
                            <div>
                              <div className="text-slate-600 dark:text-slate-400">PV Efficiency</div>
                              <div className="font-semibold">{(phase.pvEfficiencyFactor * 100).toFixed(1)}%</div>
                            </div>
                            <div>
                              <div className="text-slate-600 dark:text-slate-400">Battery Capacity</div>
                              <div className="font-semibold">{(phase.batteryCapacityFactor * 100).toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Calendar className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 text-center">
                    Configure system parameters and click "Run Timeline Simulation" to begin
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
