/**
 * Component Sizing Optimization Page
 * 
 * Allows users to specify mission requirements and automatically calculates
 * required component sizes (concentrator area, PV area, battery capacity)
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calculator, CheckCircle2, AlertTriangle, FileDown, Save, BookmarkPlus, Home, Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { generateSizingPDF, downloadPDF } from "@/lib/sizingPdfGenerator";
import { Link } from "wouter";

export default function Sizing() {
  // Form state
  const [averagePowerLoad, setAveragePowerLoad] = useState(150);
  const [peakPowerLoad, setPeakPowerLoad] = useState(250);
  const [minEnergyMargin, setMinEnergyMargin] = useState(30);
  const [minBatterySOC, setMinBatterySOC] = useState(20);
  const [eclipseDuration, setEclipseDuration] = useState(2.1);
  const [missionDuration, setMissionDuration] = useState(10);
  const [maxTotalMass, setMaxTotalMass] = useState(100);
  const [maxTotalCost, setMaxTotalCost] = useState(10000000);
  const [concentratorId, setConcentratorId] = useState<string | null>(null);
  const [pvCellId, setPvCellId] = useState("");
  const [batteryId, setBatteryId] = useState("");

  // Queries
  const technologiesQuery = trpc.simulation.getTechnologies.useQuery();
  
  // Mutation
  const sizingMutation = trpc.sizing.solve.useMutation({
    onSuccess: () => {
      toast.success("Component sizing completed successfully");
    },
    onError: (error) => {
      toast.error(`Sizing failed: ${error.message}`);
    }
  });

  const handleSolve = () => {
    if (!pvCellId || !batteryId) {
      toast.error("Please select PV cell and battery technologies");
      return;
    }

    sizingMutation.mutate({
      averagePowerLoad,
      peakPowerLoad,
      minEnergyMargin,
      minBatterySOC,
      eclipseDuration,
      missionDuration,
      maxTotalMass,
      maxTotalCost,
      concentratorId,
      pvCellId,
      batteryId,
    });
  };

  const solution = sizingMutation.data?.solution;
  const recommendations = sizingMutation.data?.recommendations || [];

  const [isExporting, setIsExporting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [scenarioNotes, setScenarioNotes] = useState("");
  
  const { user } = useAuth();
  
  const saveScenarioMutation = trpc.scenarios.sizing.save.useMutation({
    onSuccess: () => {
      toast.success("Scenario saved successfully");
      setShowSaveDialog(false);
      setScenarioName("");
      setScenarioDescription("");
      setScenarioNotes("");
    },
    onError: (error) => {
      toast.error(`Failed to save scenario: ${error.message}`);
    },
  });
  
  const handleSaveScenario = () => {
    if (!solution || !scenarioName.trim()) {
      toast.error("Please enter a scenario name");
      return;
    }
    
    saveScenarioMutation.mutate({
      name: scenarioName.trim(),
      description: scenarioDescription.trim() || undefined,
      notes: scenarioNotes.trim() || undefined,
      avgPower: averagePowerLoad,
      peakPower: peakPowerLoad,
      energyMargin: minEnergyMargin,
      minSOC: minBatterySOC,
      eclipseDuration: Math.round(eclipseDuration * 100), // Store as integer (2.1 hours = 210)
      missionDuration,
      maxMass: maxTotalMass,
      maxCost: maxTotalCost,
      concentrator: concentratorId || "None",
      pvCell: pvCellId,
      battery: batteryId,
      resultsJson: JSON.stringify({
        solution,
        recommendations,
      }),
    });
  };

  const handleExportPDF = async () => {
    if (!solution) return;

    setIsExporting(true);
    try {
      const inputs = {
        avgPower: averagePowerLoad,
        peakPower: peakPowerLoad,
        energyMargin: minEnergyMargin,
        minSOC: minBatterySOC,
        eclipseDuration,
        missionDuration,
        maxMass: maxTotalMass,
        maxCost: maxTotalCost,
        concentrator: concentratorId || "None",
        pvCell: pvCellId,
        battery: batteryId,
      };

      const results = {
        sizing: {
          concentrator_area_m2: solution.concentratorArea,
          pv_area_m2: solution.pvArea,
          battery_capacity_wh: solution.batteryCapacity,
        },
        metrics: {
          total_mass_kg: solution.totalMass,
          total_cost_usd: solution.totalCost,
          energy_margin_percent: solution.energyMargin,
          minimum_soc_percent: solution.minSOC,
        },
        sensitivity: {
          mass_margin_percent: solution.sensitivity.massMargin,
          cost_margin_percent: solution.sensitivity.costMargin,
          power_margin_percent: solution.sensitivity.powerMargin,
        },
        feasible: solution.feasible,
        recommendations,
      };

      const blob = await generateSizingPDF(inputs, results);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadPDF(blob, `psyche-sizing-report-${timestamp}.pdf`);
      toast.success("PDF report generated successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-blue-500/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calculator className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Component Sizing Optimization</h1>
                <p className="text-blue-200 mt-1">
                  Specify mission requirements and automatically calculate required component sizes
                </p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-blue-500/20 text-blue-300 hover:bg-blue-900/20">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-6">
            {/* Power Requirements */}
            <Card className="bg-slate-800/50 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-white">Power Requirements</CardTitle>
                <CardDescription className="text-blue-200">
                  Define your mission's power needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="avgPower" className="text-white">Average Power Load (W)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-blue-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Average continuous power required by spacecraft systems during normal operations.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="avgPower"
                    type="number"
                    value={averagePowerLoad}
                    onChange={(e) => setAveragePowerLoad(Number(e.target.value))}
                    className="bg-slate-700 border-blue-500/30 text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="peakPower" className="text-white">Peak Power Load (W)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-blue-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Maximum instantaneous power required during high-demand operations like transmissions or maneuvers.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="peakPower"
                    type="number"
                    value={peakPowerLoad}
                    onChange={(e) => setPeakPowerLoad(Number(e.target.value))}
                    className="bg-slate-700 border-blue-500/30 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Energy Margins */}
            <Card className="bg-slate-800/50 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-white">Energy Margins</CardTitle>
                <CardDescription className="text-blue-200">
                  Set safety margins for system reliability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="energyMargin" className="text-white">Minimum Energy Margin (%)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-blue-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Safety buffer ensuring power generation exceeds consumption by at least this percentage.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="energyMargin"
                    type="number"
                    value={minEnergyMargin}
                    onChange={(e) => setMinEnergyMargin(Number(e.target.value))}
                    className="bg-slate-700 border-blue-500/30 text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="minSOC" className="text-white">Minimum Battery SOC (%)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-blue-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Minimum allowable battery charge level to prevent damage and ensure emergency power availability.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="minSOC"
                    type="number"
                    value={minBatterySOC}
                    onChange={(e) => setMinBatterySOC(Number(e.target.value))}
                    className="bg-slate-700 border-blue-500/30 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Mission Parameters */}
            <Card className="bg-slate-800/50 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-white">Mission Parameters</CardTitle>
                <CardDescription className="text-blue-200">
                  Define mission duration and eclipse conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="eclipse" className="text-white">Maximum Eclipse Duration (hours)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-blue-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Longest continuous period without sunlight when spacecraft relies solely on battery power.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="eclipse"
                    type="number"
                    step="0.1"
                    value={eclipseDuration}
                    onChange={(e) => setEclipseDuration(Number(e.target.value))}
                    className="bg-slate-700 border-blue-500/30 text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="duration" className="text-white">Mission Duration (years)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-blue-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Total operational lifetime of the mission, affecting component degradation calculations.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="duration"
                    type="number"
                    step="0.1"
                    value={missionDuration}
                    onChange={(e) => setMissionDuration(Number(e.target.value))}
                    className="bg-slate-700 border-blue-500/30 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Constraints */}
            <Card className="bg-slate-800/50 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-white">Constraints</CardTitle>
                <CardDescription className="text-blue-200">
                  Set mass and cost limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="maxMass" className="text-white">Maximum Total Mass (kg)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-blue-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Maximum allowable mass for power system components within spacecraft mass budget.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="maxMass"
                    type="number"
                    value={maxTotalMass}
                    onChange={(e) => setMaxTotalMass(Number(e.target.value))}
                    className="bg-slate-700 border-blue-500/30 text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="maxCost" className="text-white">Maximum Total Cost ($)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-blue-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Maximum budget allocated for power system components including procurement and integration.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="maxCost"
                    type="number"
                    value={maxTotalCost}
                    onChange={(e) => setMaxTotalCost(Number(e.target.value))}
                    className="bg-slate-700 border-blue-500/30 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Technology Selection */}
            <Card className="bg-slate-800/50 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-white">Technology Selection</CardTitle>
                <CardDescription className="text-blue-200">
                  Choose technologies for sizing analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="concentrator" className="text-white">Solar Concentrator</Label>
                  <Select value={concentratorId || "none"} onValueChange={(v) => setConcentratorId(v === "none" ? null : v)}>
                    <SelectTrigger className="bg-slate-700 border-blue-500/30 text-white">
                      <SelectValue placeholder="Select concentrator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {technologiesQuery.data?.concentrators.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pvCell" className="text-white">PV Cell *</Label>
                  <Select value={pvCellId} onValueChange={setPvCellId}>
                    <SelectTrigger className="bg-slate-700 border-blue-500/30 text-white">
                      <SelectValue placeholder="Select PV cell" />
                    </SelectTrigger>
                    <SelectContent>
                      {technologiesQuery.data?.pv_cells.map((p) => (
                        <SelectItem key={p.name} value={p.name}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="battery" className="text-white">Battery *</Label>
                  <Select value={batteryId} onValueChange={setBatteryId}>
                    <SelectTrigger className="bg-slate-700 border-blue-500/30 text-white">
                      <SelectValue placeholder="Select battery" />
                    </SelectTrigger>
                    <SelectContent>
                      {technologiesQuery.data?.batteries.map((b) => (
                        <SelectItem key={b.name} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Solve Button */}
            <Button
              onClick={handleSolve}
              disabled={sizingMutation.isPending || !pvCellId || !batteryId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {sizingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Component Sizes
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {solution && (
              <>
                {/* Feasibility Status */}
                <Alert className={solution.feasible ? "bg-green-900/20 border-green-500/50" : "bg-red-900/20 border-red-500/50"}>
                  <div className="flex items-center gap-2">
                    {solution.feasible ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                    <AlertDescription className="text-white font-semibold">
                      {solution.feasible ? "✅ Feasible Solution Found" : "⚠️ Constraints Violated"}
                    </AlertDescription>
                  </div>
                </Alert>

                {/* Component Sizes */}
                <Card className="bg-slate-800/50 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">Required Component Sizes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {solution.concentratorArea > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-blue-200">Concentrator Area:</span>
                        <span className="text-white font-semibold">{solution.concentratorArea.toFixed(2)} m²</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">PV Array Area:</span>
                      <span className="text-white font-semibold">{solution.pvArea.toFixed(2)} m²</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">Battery Capacity:</span>
                      <span className="text-white font-semibold">{solution.batteryCapacity.toFixed(0)} Wh</span>
                    </div>
                  </CardContent>
                </Card>

                {/* System Metrics */}
                <Card className="bg-slate-800/50 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">System Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">Total Mass:</span>
                      <span className="text-white font-semibold">{solution.totalMass.toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">Total Cost:</span>
                      <span className="text-white font-semibold">${(solution.totalCost / 1e6).toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">Energy Margin:</span>
                      <span className="text-white font-semibold">{solution.energyMargin.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">Minimum SOC:</span>
                      <span className="text-white font-semibold">{solution.minSOC.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Sensitivity Analysis */}
                <Card className="bg-slate-800/50 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">Sensitivity Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">Mass Margin:</span>
                      <span className="text-white font-semibold">{solution.sensitivity.massMargin.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">Cost Margin:</span>
                      <span className="text-white font-semibold">{solution.sensitivity.costMargin.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">Power Margin:</span>
                      <span className="text-white font-semibold">{solution.sensitivity.powerMargin.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Constraint Violations */}
                {solution.constraintViolations.length > 0 && (
                  <Card className="bg-red-900/20 border-red-500/50">
                    <CardHeader>
                      <CardTitle className="text-red-300">Constraint Violations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {solution.constraintViolations.map((violation, idx) => (
                          <li key={idx} className="text-red-200 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{violation}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    size="lg"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <FileDown className="w-4 h-4 mr-2" />
                        Export PDF
                      </>
                    )}
                  </Button>
                  
                  {user ? (
                    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                      <DialogTrigger asChild>
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="lg"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Scenario
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-blue-500/30">
                        <DialogHeader>
                          <DialogTitle className="text-white flex items-center gap-2">
                            <BookmarkPlus className="w-5 h-5 text-green-400" />
                            Save Sizing Scenario
                          </DialogTitle>
                          <DialogDescription className="text-blue-200">
                            Save this configuration and results for future comparison
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="name" className="text-white">Scenario Name *</Label>
                            <Input
                              id="name"
                              value={scenarioName}
                              onChange={(e) => setScenarioName(e.target.value)}
                              placeholder="e.g., Baseline Configuration"
                              className="bg-slate-700 border-blue-500/30 text-white mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                            <Textarea
                              id="description"
                              value={scenarioDescription}
                              onChange={(e) => setScenarioDescription(e.target.value)}
                              placeholder="Brief summary of this scenario..."
                              className="bg-slate-700 border-blue-500/30 text-white mt-2"
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label htmlFor="notes" className="text-white">Notes & Comments (Optional)</Label>
                            <Textarea
                              id="notes"
                              value={scenarioNotes}
                              onChange={(e) => setScenarioNotes(e.target.value)}
                              placeholder="Detailed observations, decisions, or team comments..."
                              className="bg-slate-700 border-blue-500/30 text-white mt-2"
                              rows={4}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowSaveDialog(false)}
                            className="border-blue-500/30 text-white hover:bg-slate-700"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveScenario}
                            disabled={saveScenarioMutation.isPending || !scenarioName.trim()}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {saveScenarioMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button
                      disabled
                      className="bg-slate-600 text-slate-400 cursor-not-allowed"
                      size="lg"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Login to Save
                    </Button>
                  )}
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <Card className="bg-slate-800/50 border-blue-500/20">
                    <CardHeader>
                      <CardTitle className="text-white">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {recommendations.map((rec, idx) => (
                          <li key={idx} className="text-blue-200">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!solution && !sizingMutation.isPending && (
              <Card className="bg-slate-800/50 border-blue-500/20">
                <CardContent className="py-12 text-center">
                  <Calculator className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
                  <p className="text-blue-200">
                    Configure your requirements and click "Calculate Component Sizes" to begin
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
