/**
 * Cost-Benefit Analysis Page
 * 
 * Provides economic modeling, lifecycle cost analysis, mass budget tracking,
 * and TRL risk assessment for power system configurations
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, DollarSign, Scale, AlertTriangle, TrendingUp, FileDown, Save, BookmarkPlus, Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { localCostBenefit } from "@/lib/localStore";
import { toast } from "sonner";
import { generateCostBenefitPDF, downloadPDF } from "@/lib/costBenefitPdfGenerator";
import { Link } from "wouter";
import HomeButton from "@/components/HomeButton";

export default function CostBenefit() {
  // Form state
  const [concentratorId, setConcentratorId] = useState<string | null>(null);
  const [pvCellId, setPvCellId] = useState("");
  const [batteryId, setBatteryId] = useState("");
  const [concentratorArea, setConcentratorArea] = useState(3);
  const [pvArea, setPvArea] = useState(1);
  const [batteryCapacity, setBatteryCapacity] = useState(8000);
  const [averagePower, setAveragePower] = useState(150);
  const [peakPower, setPeakPower] = useState(250);
  const [energyMargin, setEnergyMargin] = useState(30);
  const [missionDuration, setMissionDuration] = useState(10);

  // Queries
  const technologiesQuery = trpc.simulation.getTechnologies.useQuery();
  
  // Mutation
  const analysisMutation = trpc.costBenefit.analyze.useMutation({
    onSuccess: () => {
      toast.success("Cost-benefit analysis completed");
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    }
  });

  const handleAnalyze = () => {
    if (!pvCellId || !batteryId) {
      toast.error("Please select PV cell and battery technologies");
      return;
    }

    analysisMutation.mutate({
      concentratorId,
      pvCellId,
      batteryId,
      concentratorArea,
      pvArea,
      batteryCapacity,
      averagePower,
      peakPower,
      energyMargin,
      missionDuration,
    });
  };

  const analysis = analysisMutation.data?.analysis;

  const [isExporting, setIsExporting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [scenarioNotes, setScenarioNotes] = useState("");
  
  const { user } = useAuth();
  
  const saveScenarioMutation = trpc.scenarios.costBenefit.save.useMutation({
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
    if (!analysis || !scenarioName.trim()) {
      toast.error("Please enter a scenario name");
      return;
    }

    if (!user) {
      // No authentication — save to localStorage
      localCostBenefit.save({
        name: scenarioName.trim(),
        description: scenarioDescription.trim() || null,
        notes: scenarioNotes.trim() || null,
        tags: null,
        avgPower: averagePower,
        peakPower,
        missionDuration,
        concentrator: concentratorId || "None",
        pvCell: pvCellId,
        battery: batteryId,
        resultsJson: JSON.stringify(analysis),
      });
      toast.success("Scenario saved locally! (visible in Compare Scenarios)");
      setShowSaveDialog(false);
      setScenarioName("");
      setScenarioDescription("");
      setScenarioNotes("");
      return;
    }
    
    saveScenarioMutation.mutate({
      name: scenarioName.trim(),
      description: scenarioDescription.trim() || undefined,
      notes: scenarioNotes.trim() || undefined,
      avgPower: averagePower,
      peakPower,
      missionDuration,
      concentrator: concentratorId || "None",
      pvCell: pvCellId,
      battery: batteryId,
      resultsJson: JSON.stringify(analysis),
    });
  };

  const handleExportPDF = async () => {
    if (!analysis) return;

    setIsExporting(true);
    try {
      const inputs = {
        concentrator: concentratorId || "None",
        pvCell: pvCellId,
        battery: batteryId,
        concentratorArea,
        pvArea,
        batteryCapacity,
        avgPower: averagePower,
        peakPower,
        energyMargin,
        missionDuration,
      };

      // Map analysis to PDF format
      const results = {
        lifecycle_costs: {
          development_cost_usd: analysis.lifecycle.developmentCost,
          component_cost_usd: analysis.lifecycle.componentCost,
          testing_cost_usd: analysis.lifecycle.testingCost,
          launch_cost_usd: analysis.lifecycle.launchCost,
          total_lifecycle_cost_usd: analysis.lifecycle.totalLifecycle,
          cost_per_watt: analysis.lifecycle.costPerWatt,
        },
        mass_budget: {
          pv_mass_kg: analysis.mass.pvMass,
          battery_mass_kg: analysis.mass.batteryMass,
          structure_mass_kg: analysis.mass.structureMass,
          harness_mass_kg: analysis.mass.harnessMass,
          contingency_mass_kg: analysis.mass.contingencyMass,
          total_mass_kg: analysis.mass.totalMass,
          power_to_mass_ratio: analysis.mass.powerToMassRatio,
        },
        trl_assessment: {
          concentrator_trl: analysis.trl.concentratorTRL,
          pv_cell_trl: analysis.trl.pvCellTRL,
          battery_trl: analysis.trl.batteryTRL,
          overall_risk_level: analysis.trl.riskLevel,
          development_time_years: analysis.trl.developmentTime,
          risk_score: analysis.trl.riskScore,
          risk_description: analysis.trl.developmentRisk,
        },
        performance_score: analysis.performanceScore,
        trade_offs: analysis.tradeoffs,
      };

      const blob = await generateCostBenefitPDF(inputs, results);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadPDF(blob, `psyche-cost-benefit-${timestamp}.pdf`);
      toast.success("PDF report generated successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setIsExporting(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'High': return 'bg-orange-500';
      case 'Very High': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-purple-500/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-purple-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Cost-Benefit Analysis</h1>
                <p className="text-purple-200 mt-1">
                  Economic modeling, lifecycle costs, mass budget, and TRL risk assessment
                </p>
              </div>
            </div>
          <HomeButton />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-6">
            {/* Technology Selection */}
            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Technology Selection</CardTitle>
                <CardDescription className="text-purple-200">
                  Choose technologies for analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="concentrator" className="text-white">Solar Concentrator</Label>
                  <Select value={concentratorId || "none"} onValueChange={(v) => setConcentratorId(v === "none" ? null : v)}>
                    <SelectTrigger className="bg-slate-700 border-purple-500/30 text-white">
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
                    <SelectTrigger className="bg-slate-700 border-purple-500/30 text-white">
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
                    <SelectTrigger className="bg-slate-700 border-purple-500/30 text-white">
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

            {/* System Sizing */}
            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">System Sizing</CardTitle>
                <CardDescription className="text-purple-200">
                  Define component sizes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="concArea" className="text-white">Concentrator Area (m²)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-purple-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Surface area of solar concentrator optics used to focus sunlight onto photovoltaic cells.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="concArea"
                    type="number"
                    step="0.1"
                    value={concentratorArea}
                    onChange={(e) => setConcentratorArea(Number(e.target.value))}
                    className="bg-slate-700 border-purple-500/30 text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="pvArea" className="text-white">PV Area (m²)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-purple-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Total surface area of photovoltaic cells used to convert sunlight into electrical power.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="pvArea"
                    type="number"
                    step="0.1"
                    value={pvArea}
                    onChange={(e) => setPvArea(Number(e.target.value))}
                    className="bg-slate-700 border-purple-500/30 text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="battCap" className="text-white">Battery Capacity (Wh)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-purple-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Maximum energy storage capacity of the battery system, measured in watt-hours.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="battCap"
                    type="number"
                    value={batteryCapacity}
                    onChange={(e) => setBatteryCapacity(Number(e.target.value))}
                    className="bg-slate-700 border-purple-500/30 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
                <CardDescription className="text-purple-200">
                  Expected system performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="avgPower" className="text-white">Average Power (W)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-purple-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Average continuous power required by spacecraft systems during normal operations.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="avgPower"
                    type="number"
                    value={averagePower}
                    onChange={(e) => setAveragePower(Number(e.target.value))}
                    className="bg-slate-700 border-purple-500/30 text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="peakPower" className="text-white">Peak Power (W)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-purple-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Maximum instantaneous power required during high-demand operations.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="peakPower"
                    type="number"
                    value={peakPower}
                    onChange={(e) => setPeakPower(Number(e.target.value))}
                    className="bg-slate-700 border-purple-500/30 text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="margin" className="text-white">Energy Margin (%)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-purple-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Safety buffer ensuring power generation exceeds consumption by at least this percentage.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="margin"
                    type="number"
                    value={energyMargin}
                    onChange={(e) => setEnergyMargin(Number(e.target.value))}
                    className="bg-slate-700 border-purple-500/30 text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="duration" className="text-white">Mission Duration (years)</Label>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-purple-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Total operational lifetime of the mission, affecting component degradation and lifecycle costs.
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Input
                    id="duration"
                    type="number"
                    step="0.1"
                    value={missionDuration}
                    onChange={(e) => setMissionDuration(Number(e.target.value))}
                    className="bg-slate-700 border-purple-500/30 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={analysisMutation.isPending || !pvCellId || !batteryId}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              size="lg"
            >
              {analysisMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Perform Cost-Benefit Analysis
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {analysis && (
              <>
                {/* Overall Recommendation */}
                <Card className="bg-slate-800/50 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">Overall Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-white font-semibold mb-4">{analysis.recommendation}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200">Performance Score:</span>
                        <span className="text-white font-semibold">{analysis.performanceScore.toFixed(1)}/100</span>
                      </div>
                      <Progress value={analysis.performanceScore} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Lifecycle Costs */}
                <Card className="bg-slate-800/50 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Lifecycle Costs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-purple-200 text-sm">Development</p>
                        <p className="text-white font-semibold">${(analysis.lifecycle.developmentCost / 1e6).toFixed(2)}M</p>
                      </div>
                      <div>
                        <p className="text-purple-200 text-sm">Testing</p>
                        <p className="text-white font-semibold">${(analysis.lifecycle.testingCost / 1e6).toFixed(2)}M</p>
                      </div>
                      <div>
                        <p className="text-purple-200 text-sm">Components</p>
                        <p className="text-white font-semibold">${(analysis.lifecycle.componentCost / 1e6).toFixed(2)}M</p>
                      </div>
                      <div>
                        <p className="text-purple-200 text-sm">Launch</p>
                        <p className="text-white font-semibold">${(analysis.lifecycle.launchCost / 1e6).toFixed(2)}M</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-purple-500/30">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200 font-semibold">Total Lifecycle:</span>
                        <span className="text-white font-bold text-lg">${(analysis.lifecycle.totalLifecycle / 1e6).toFixed(2)}M</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-purple-200 text-sm">Cost per Watt:</span>
                        <span className="text-white">${(analysis.lifecycle.costPerWatt / 1000).toFixed(1)}k/W</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mass Budget */}
                <Card className="bg-slate-800/50 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Scale className="w-5 h-5" />
                      Mass Budget
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {analysis.mass.concentratorMass > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-purple-200">Concentrator:</span>
                          <span className="text-white">{analysis.mass.concentratorMass.toFixed(1)} kg</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200">PV Array:</span>
                        <span className="text-white">{analysis.mass.pvMass.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200">Battery:</span>
                        <span className="text-white">{analysis.mass.batteryMass.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200">Structure:</span>
                        <span className="text-white">{analysis.mass.structureMass.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200">Harness:</span>
                        <span className="text-white">{analysis.mass.harnessMass.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200">Contingency:</span>
                        <span className="text-white">{analysis.mass.contingencyMass.toFixed(1)} kg</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-purple-500/30">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200 font-semibold">Total Mass:</span>
                        <span className="text-white font-bold text-lg">{analysis.mass.totalMass.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-purple-200 text-sm">Power-to-Mass:</span>
                        <span className="text-white">{analysis.mass.powerToMassRatio.toFixed(2)} W/kg</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* TRL Risk Assessment */}
                <Card className="bg-slate-800/50 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      TRL Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-200">Risk Level:</span>
                      <Badge className={`${getRiskLevelColor(analysis.trl.riskLevel)} text-white`}>
                        {analysis.trl.riskLevel}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-purple-200">Risk Score:</span>
                        <span className="text-white">{analysis.trl.riskScore.toFixed(0)}/100</span>
                      </div>
                      <Progress value={analysis.trl.riskScore} className="h-2" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div>
                        <p className="text-purple-200 text-sm">Concentrator TRL</p>
                        <p className="text-white font-semibold text-lg">{analysis.trl.concentratorTRL}</p>
                      </div>
                      <div>
                        <p className="text-purple-200 text-sm">PV Cell TRL</p>
                        <p className="text-white font-semibold text-lg">{analysis.trl.pvCellTRL}</p>
                      </div>
                      <div>
                        <p className="text-purple-200 text-sm">Battery TRL</p>
                        <p className="text-white font-semibold text-lg">{analysis.trl.batteryTRL}</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <p className="text-purple-200 text-sm mb-1">Development Time:</p>
                      <p className="text-white">{analysis.trl.developmentTime.toFixed(1)} years to flight readiness</p>
                    </div>
                    <div className="pt-2">
                      <p className="text-purple-200 text-sm mb-1">Development Risk:</p>
                      <p className="text-white text-sm">{analysis.trl.developmentRisk}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {analysis.trl.recommendations.length > 0 && (
                  <Card className="bg-slate-800/50 border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="text-white">TRL Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.trl.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-purple-200 flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{rec}</span>
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
                      <DialogContent className="bg-slate-800 border-purple-500/30">
                        <DialogHeader>
                          <DialogTitle className="text-white flex items-center gap-2">
                            <BookmarkPlus className="w-5 h-5 text-green-400" />
                            Save Cost-Benefit Scenario
                          </DialogTitle>
                          <DialogDescription className="text-purple-200">
                            Save this analysis for future comparison
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="name" className="text-white">Scenario Name *</Label>
                            <Input
                              id="name"
                              value={scenarioName}
                              onChange={(e) => setScenarioName(e.target.value)}
                              placeholder="e.g., High-Performance Configuration"
                              className="bg-slate-700 border-purple-500/30 text-white mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                            <Textarea
                              id="description"
                              value={scenarioDescription}
                              onChange={(e) => setScenarioDescription(e.target.value)}
                              placeholder="Brief summary of this scenario..."
                              className="bg-slate-700 border-purple-500/30 text-white mt-2"
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
                              className="bg-slate-700 border-purple-500/30 text-white mt-2"
                              rows={4}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowSaveDialog(false)}
                            className="border-purple-500/30 text-white hover:bg-slate-700"
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

                {/* Trade-offs */}
                {analysis.tradeoffs.length > 0 && (
                  <Card className="bg-slate-800/50 border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="text-white">Key Trade-offs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.tradeoffs.map((tradeoff, idx) => (
                          <li key={idx} className="text-purple-200 flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{tradeoff}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!analysis && !analysisMutation.isPending && (
              <Card className="bg-slate-800/50 border-purple-500/20">
                <CardContent className="py-12 text-center">
                  <DollarSign className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
                  <p className="text-purple-200">
                    Configure your system and click "Perform Cost-Benefit Analysis" to begin
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
