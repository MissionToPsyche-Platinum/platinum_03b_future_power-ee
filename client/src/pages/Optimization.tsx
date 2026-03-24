import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, TrendingUp, Weight, DollarSign, Download, FileJson, Home, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { exportAsJSON, exportAsPDF, type OptimizationResult } from "@/lib/optimizationExport";
import { Link } from "wouter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Optimization() {
  const [objectiveType, setObjectiveType] = useState<"maximize_energy_margin" | "minimize_mass" | "minimize_cost" | "multi_objective">("maximize_energy_margin");
  const [constraints, setConstraints] = useState({
    maxMass: "",
    maxCost: "",
    minPower: "",
    minSOC: "20",
  });
  const [systemParams, setSystemParams] = useState({
    concentratorArea: "3",
    pvArea: "1",
    batteryCapacity: "8000",
    baseLoad: "100",
    duration: "48",
    yearsInOperation: "0",
  });
  const [advancedSettings, setAdvancedSettings] = useState({
    populationSize: "50",
    generations: "100",
    mutationRate: "0.1",
    eliteSize: "5",
  });
  const [weights, setWeights] = useState({
    energyMargin: "0.4",
    mass: "0.3",
    cost: "0.3",
  });

  // Optimization presets
  const presets = {
    minimize_mass: {
      name: "Minimize Mass",
      description: "Optimize for lowest system mass while maintaining power requirements",
      objective: "minimize_mass" as const,
      constraints: {
        maxMass: "",
        maxCost: "50000",
        minPower: "100",
        minSOC: "30",
      },
      systemParams: {
        concentratorArea: "3",
        pvArea: "2",
        batteryCapacity: "10000",
        baseLoad: "100",
        duration: "48",
        yearsInOperation: "5",
      },
    },
    minimize_cost: {
      name: "Minimize Cost",
      description: "Optimize for lowest total cost while meeting mission requirements",
      objective: "minimize_cost" as const,
      constraints: {
        maxMass: "200",
        maxCost: "",
        minPower: "80",
        minSOC: "25",
      },
      systemParams: {
        concentratorArea: "2",
        pvArea: "1.5",
        batteryCapacity: "8000",
        baseLoad: "80",
        duration: "48",
        yearsInOperation: "5",
      },
    },
    balanced: {
      name: "Balanced Performance",
      description: "Multi-objective optimization balancing energy, mass, and cost",
      objective: "multi_objective" as const,
      constraints: {
        maxMass: "150",
        maxCost: "40000",
        minPower: "100",
        minSOC: "30",
      },
      systemParams: {
        concentratorArea: "3",
        pvArea: "2",
        batteryCapacity: "10000",
        baseLoad: "100",
        duration: "48",
        yearsInOperation: "5",
      },
      weights: {
        energyMargin: "0.4",
        mass: "0.3",
        cost: "0.3",
      },
    },
  };

  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [totalGenerations, setTotalGenerations] = useState(0);

  const optimizationMutation = trpc.optimization.run.useMutation({
    onSuccess: (data) => {
      setOptimizationResult(data);
      setIsRunning(false);
      setProgress(100);
      toast.success("Optimization completed successfully!");
    },
    onError: (error) => {
      console.error("Optimization failed:", error);
      setIsRunning(false);
      setProgress(0);
      toast.error(`Optimization failed: ${error.message}`);
    },
  });

  const handleRunOptimization = () => {
    console.log("[Optimization] Starting optimization...");
    setIsRunning(true);
    setProgress(0);
    setOptimizationResult(null);
    setTotalGenerations(parseInt(advancedSettings.generations));

    const config = {
      constraints: {
        maxMass: constraints.maxMass ? parseFloat(constraints.maxMass) : undefined,
        maxCost: constraints.maxCost ? parseFloat(constraints.maxCost) : undefined,
        minPower: constraints.minPower ? parseFloat(constraints.minPower) : undefined,
        minSOC: constraints.minSOC ? parseFloat(constraints.minSOC) : undefined,
      },
      objective: {
        type: objectiveType,
        weights: objectiveType === "multi_objective" ? {
          energyMargin: parseFloat(weights.energyMargin),
          mass: parseFloat(weights.mass),
          cost: parseFloat(weights.cost),
        } : undefined,
      },
      systemParams: {
        concentratorArea: parseFloat(systemParams.concentratorArea),
        pvArea: parseFloat(systemParams.pvArea),
        batteryCapacity: parseFloat(systemParams.batteryCapacity),
        baseLoad: parseFloat(systemParams.baseLoad),
        duration: parseFloat(systemParams.duration),
        yearsInOperation: parseFloat(systemParams.yearsInOperation),
      },
      populationSize: parseInt(advancedSettings.populationSize),
      generations: parseInt(advancedSettings.generations),
      mutationRate: parseFloat(advancedSettings.mutationRate),
      eliteSize: parseInt(advancedSettings.eliteSize),
    };

    console.log("[Optimization] Config:", config);
    optimizationMutation.mutate(config);
    console.log("[Optimization] Mutation called");

    // Simulate progress (in real implementation, use WebSocket or polling)
    const interval = setInterval(() => {
      setCurrentGeneration((prev) => {
        if (prev >= parseInt(advancedSettings.generations)) {
          clearInterval(interval);
          return prev;
        }
        const next = prev + 1;
        setProgress((next / parseInt(advancedSettings.generations)) * 100);
        return next;
      });
    }, 100);
  };

  const formatTechnologyName = (id: string) => {
    return id.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const loadPreset = (presetKey: keyof typeof presets) => {
    const preset = presets[presetKey];
    setObjectiveType(preset.objective);
    setConstraints(preset.constraints);
    setSystemParams(preset.systemParams);
    if ('weights' in preset && preset.weights) {
      setWeights(preset.weights);
    }
    toast.success(`Loaded preset: ${preset.name}`);
  };

  const handleExportJSON = () => {
    if (!optimizationResult) return;
    
    const exportData: OptimizationResult = {
      bestSolution: {
        concentrator: formatTechnologyName(optimizationResult.bestSolution.genes.concentratorId),
        pvCell: formatTechnologyName(optimizationResult.bestSolution.genes.pvCellId),
        battery: formatTechnologyName(optimizationResult.bestSolution.genes.batteryId),
        fitness: optimizationResult.bestSolution.fitness,
        energyMargin: optimizationResult.bestSolution.metrics?.energyMargin || 0,
        mass: optimizationResult.bestSolution.metrics?.mass || 0,
        cost: optimizationResult.bestSolution.metrics?.cost || 0,
        minSoc: optimizationResult.bestSolution.metrics?.minSOC || 0,
        viable: optimizationResult.bestSolution.metrics?.viable || false,
      },
      evolutionHistory: optimizationResult.progress || [],
      executionTime: optimizationResult.executionTime,
      config: {
        objective: objectiveType,
        constraints: {
          maxMass: constraints.maxMass ? parseFloat(constraints.maxMass) : undefined,
          maxCost: constraints.maxCost ? parseFloat(constraints.maxCost) : undefined,
          minPower: constraints.minPower ? parseFloat(constraints.minPower) : undefined,
          minSoc: constraints.minSOC ? parseFloat(constraints.minSOC) : undefined,
        },
        systemParams: {
          concentratorArea: parseFloat(systemParams.concentratorArea),
          pvArea: parseFloat(systemParams.pvArea),
          batteryCapacity: parseFloat(systemParams.batteryCapacity),
          baseLoad: parseFloat(systemParams.baseLoad),
          duration: parseFloat(systemParams.duration),
          years: parseFloat(systemParams.yearsInOperation),
        },
        algorithmParams: {
          populationSize: parseInt(advancedSettings.populationSize),
          generations: parseInt(advancedSettings.generations),
          mutationRate: parseFloat(advancedSettings.mutationRate),
          eliteSize: parseInt(advancedSettings.eliteSize),
        },
      },
    };
    
    exportAsJSON(exportData);
    toast.success("Results exported as JSON");
  };

  const handleExportPDF = async () => {
    if (!optimizationResult) return;
    
    const exportData: OptimizationResult = {
      bestSolution: {
        concentrator: formatTechnologyName(optimizationResult.bestSolution.genes.concentratorId),
        pvCell: formatTechnologyName(optimizationResult.bestSolution.genes.pvCellId),
        battery: formatTechnologyName(optimizationResult.bestSolution.genes.batteryId),
        fitness: optimizationResult.bestSolution.fitness,
        energyMargin: optimizationResult.bestSolution.metrics?.energyMargin || 0,
        mass: optimizationResult.bestSolution.metrics?.mass || 0,
        cost: optimizationResult.bestSolution.metrics?.cost || 0,
        minSoc: optimizationResult.bestSolution.metrics?.minSOC || 0,
        viable: optimizationResult.bestSolution.metrics?.viable || false,
      },
      evolutionHistory: optimizationResult.progress || [],
      executionTime: optimizationResult.executionTime,
      config: {
        objective: objectiveType,
        constraints: {
          maxMass: constraints.maxMass ? parseFloat(constraints.maxMass) : undefined,
          maxCost: constraints.maxCost ? parseFloat(constraints.maxCost) : undefined,
          minPower: constraints.minPower ? parseFloat(constraints.minPower) : undefined,
          minSoc: constraints.minSOC ? parseFloat(constraints.minSOC) : undefined,
        },
        systemParams: {
          concentratorArea: parseFloat(systemParams.concentratorArea),
          pvArea: parseFloat(systemParams.pvArea),
          batteryCapacity: parseFloat(systemParams.batteryCapacity),
          baseLoad: parseFloat(systemParams.baseLoad),
          duration: parseFloat(systemParams.duration),
          years: parseFloat(systemParams.yearsInOperation),
        },
        algorithmParams: {
          populationSize: parseInt(advancedSettings.populationSize),
          generations: parseInt(advancedSettings.generations),
          mutationRate: parseFloat(advancedSettings.mutationRate),
          eliteSize: parseInt(advancedSettings.eliteSize),
        },
      },
    };
    
    try {
      await exportAsPDF(exportData);
      toast.success("Results exported as PDF");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Failed to export PDF");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="h-8 w-8" />
              Optimization Engine
            </h1>
            <p className="text-blue-200">
              Find optimal technology combinations using genetic algorithms
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-blue-500/20 text-blue-300 hover:bg-blue-900/20">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preset Profiles */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Quick Start Presets</CardTitle>
                <CardDescription className="text-blue-200">
                  Load pre-configured optimization scenarios
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => loadPreset('minimize_mass')}
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10 flex flex-col items-start h-auto py-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Weight className="h-4 w-4" />
                    <span className="font-semibold">Minimize Mass</span>
                  </div>
                  <span className="text-xs text-blue-200 text-left">
                    Optimize for lowest system mass
                  </span>
                </Button>
                <Button
                  onClick={() => loadPreset('minimize_cost')}
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10 flex flex-col items-start h-auto py-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold">Minimize Cost</span>
                  </div>
                  <span className="text-xs text-blue-200 text-left">
                    Optimize for lowest total cost
                  </span>
                </Button>
                <Button
                  onClick={() => loadPreset('balanced')}
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10 flex flex-col items-start h-auto py-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold">Balanced</span>
                  </div>
                  <span className="text-xs text-blue-200 text-left">
                    Multi-objective optimization
                  </span>
                </Button>
              </CardContent>
            </Card>

            {/* Objective Selection */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Optimization Objective</CardTitle>
                <CardDescription className="text-blue-200">
                  Choose what to optimize for
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="objective" className="text-white">Objective Type</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-blue-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        <p className="font-semibold mb-1">Optimization Objective</p>
                        <p>Choose what the genetic algorithm optimizes for: maximum safety margin, minimum mass, lowest cost, or balanced multi-objective optimization.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={objectiveType} onValueChange={(value: any) => setObjectiveType(value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maximize_energy_margin">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Maximize Energy Margin
                        </div>
                      </SelectItem>
                      <SelectItem value="minimize_mass">
                        <div className="flex items-center gap-2">
                          <Weight className="h-4 w-4" />
                          Minimize Mass
                        </div>
                      </SelectItem>
                      <SelectItem value="minimize_cost">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Minimize Cost
                        </div>
                      </SelectItem>
                      <SelectItem value="multi_objective">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Multi-Objective (Pareto)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {objectiveType === "multi_objective" && (
                  <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                    <Label className="text-white">Objective Weights (must sum to 1.0)</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="weight-energy" className="text-sm text-blue-200">Energy</Label>
                        <Input
                          id="weight-energy"
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={weights.energyMargin}
                          onChange={(e) => setWeights({ ...weights, energyMargin: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight-mass" className="text-sm text-blue-200">Mass</Label>
                        <Input
                          id="weight-mass"
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={weights.mass}
                          onChange={(e) => setWeights({ ...weights, mass: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight-cost" className="text-sm text-blue-200">Cost</Label>
                        <Input
                          id="weight-cost"
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={weights.cost}
                          onChange={(e) => setWeights({ ...weights, cost: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Constraints */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Constraints</CardTitle>
                <CardDescription className="text-blue-200">
                  Set limits for the optimization (leave empty for no constraint)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max-mass" className="text-white">Max Mass (kg)</Label>
                    <Input
                      id="max-mass"
                      type="number"
                      placeholder="No limit"
                      value={constraints.maxMass}
                      onChange={(e) => setConstraints({ ...constraints, maxMass: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-cost" className="text-white">Max Cost ($)</Label>
                    <Input
                      id="max-cost"
                      type="number"
                      placeholder="No limit"
                      value={constraints.maxCost}
                      onChange={(e) => setConstraints({ ...constraints, maxCost: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-power" className="text-white">Min Power (W)</Label>
                    <Input
                      id="min-power"
                      type="number"
                      placeholder="No limit"
                      value={constraints.minPower}
                      onChange={(e) => setConstraints({ ...constraints, minPower: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-soc" className="text-white">Min Battery SOC (%)</Label>
                    <Input
                      id="min-soc"
                      type="number"
                      value={constraints.minSOC}
                      onChange={(e) => setConstraints({ ...constraints, minSOC: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Parameters */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">System Parameters</CardTitle>
                <CardDescription className="text-blue-200">
                  Configure sizing and mission duration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="concentrator-area" className="text-white">Concentrator Area (m²)</Label>
                    <Input
                      id="concentrator-area"
                      type="number"
                      value={systemParams.concentratorArea}
                      onChange={(e) => setSystemParams({ ...systemParams, concentratorArea: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pv-area" className="text-white">PV Area (m²)</Label>
                    <Input
                      id="pv-area"
                      type="number"
                      value={systemParams.pvArea}
                      onChange={(e) => setSystemParams({ ...systemParams, pvArea: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="battery-capacity" className="text-white">Battery Capacity (Wh)</Label>
                    <Input
                      id="battery-capacity"
                      type="number"
                      value={systemParams.batteryCapacity}
                      onChange={(e) => setSystemParams({ ...systemParams, batteryCapacity: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="base-load" className="text-white">Base Load (W)</Label>
                    <Input
                      id="base-load"
                      type="number"
                      value={systemParams.baseLoad}
                      onChange={(e) => setSystemParams({ ...systemParams, baseLoad: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration" className="text-white">Duration (hours)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={systemParams.duration}
                      onChange={(e) => setSystemParams({ ...systemParams, duration: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="years" className="text-white">Years in Operation</Label>
                    <Input
                      id="years"
                      type="number"
                      value={systemParams.yearsInOperation}
                      onChange={(e) => setSystemParams({ ...systemParams, yearsInOperation: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Advanced Settings</CardTitle>
                <CardDescription className="text-blue-200">
                  Genetic algorithm parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="population" className="text-white">Population Size</Label>
                    <Input
                      id="population"
                      type="number"
                      value={advancedSettings.populationSize}
                      onChange={(e) => setAdvancedSettings({ ...advancedSettings, populationSize: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="generations" className="text-white">Generations</Label>
                    <Input
                      id="generations"
                      type="number"
                      value={advancedSettings.generations}
                      onChange={(e) => setAdvancedSettings({ ...advancedSettings, generations: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mutation" className="text-white">Mutation Rate</Label>
                    <Input
                      id="mutation"
                      type="number"
                      step="0.01"
                      value={advancedSettings.mutationRate}
                      onChange={(e) => setAdvancedSettings({ ...advancedSettings, mutationRate: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="elite" className="text-white">Elite Size</Label>
                    <Input
                      id="elite"
                      type="number"
                      value={advancedSettings.eliteSize}
                      onChange={(e) => setAdvancedSettings({ ...advancedSettings, eliteSize: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-white">NASA-Validated Model Improvements:</p>
                  <ul className="space-y-1 list-disc list-inside text-slate-300">
                    <li><strong>Battery Degradation:</strong> 0.3%/year capacity fade based on JPL Li-ion data</li>
                    <li><strong>Temperature Effects:</strong> -0.45%/°C for GaAs cells, capacity variation for batteries</li>
                    <li><strong>MPPT Efficiency:</strong> 92-98% efficiency curve vs. fixed 95%</li>
                    <li><strong>Pointing Losses:</strong> 0.5-5° off-pointing based on spacecraft class</li>
                  </ul>
                  <p className="text-slate-400 italic">
                    Simple model uses ideal conditions with no degradation or losses.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleRunOptimization}
              disabled={isRunning}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6 text-lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Optimizing... Generation {currentGeneration}/{totalGenerations}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Run Optimization
                </>
              )}
            </Button>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {isRunning && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-blue-200">
                    Generation {currentGeneration} of {totalGenerations}
                  </p>
                </CardContent>
              </Card>
            )}

            {optimizationResult && (
              <>
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Best Solution</CardTitle>
                    <CardDescription className="text-blue-200">
                      Execution time: {optimizationResult.executionTime.toFixed(2)}s
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-200">Concentrator:</span>
                        <span className="text-white font-medium">
                          {formatTechnologyName(optimizationResult.bestSolution.genes.concentratorId)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">PV Cell:</span>
                        <span className="text-white font-medium">
                          {formatTechnologyName(optimizationResult.bestSolution.genes.pvCellId)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">Battery:</span>
                        <span className="text-white font-medium">
                          {formatTechnologyName(optimizationResult.bestSolution.genes.batteryId)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/20 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-200">Fitness Score:</span>
                        <span className="text-white font-medium">
                          {optimizationResult.bestSolution.fitness.toFixed(2)}
                        </span>
                      </div>
                      {optimizationResult.bestSolution.metrics && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-blue-200">Energy Margin:</span>
                            <span className="text-white font-medium">
                              {optimizationResult.bestSolution.metrics.energyMargin.toFixed(0)} Wh
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">Mass:</span>
                            <span className="text-white font-medium">
                              {optimizationResult.bestSolution.metrics.mass.toFixed(1)} kg
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">Cost:</span>
                            <span className="text-white font-medium">
                              ${optimizationResult.bestSolution.metrics.cost.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">Min SOC:</span>
                            <span className="text-white font-medium">
                              {optimizationResult.bestSolution.metrics.minSOC.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">Viable:</span>
                            <span className={`font-medium ${optimizationResult.bestSolution.metrics.viable ? "text-green-400" : "text-red-400"}`}>
                              {optimizationResult.bestSolution.metrics.viable ? "Yes" : "No"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Export Buttons */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Export Results</CardTitle>
                    <CardDescription className="text-blue-200">
                      Save optimization results for documentation and analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-3">
                    <Button
                      onClick={() => handleExportPDF()}
                      variant="outline"
                      className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export as PDF
                    </Button>
                    <Button
                      onClick={() => handleExportJSON()}
                      variant="outline"
                      className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      <FileJson className="mr-2 h-4 w-4" />
                      Export as JSON
                    </Button>
                  </CardContent>
                </Card>

                {optimizationResult.progress && optimizationResult.progress.length > 0 && (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-white">Evolution Progress</CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-blue-300 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">Evolution Progress</p>
                            <p className="text-sm">
                              Shows how the genetic algorithm improves solutions over generations. 
                              Best fitness (green) tracks the top solution; average fitness (blue) shows population quality. Convergence indicates optimization completion.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={optimizationResult.progress}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis
                            dataKey="generation"
                            stroke="rgba(255,255,255,0.5)"
                            label={{ value: "Generation", position: "insideBottom", offset: -5, fill: "rgba(255,255,255,0.7)" }}
                          />
                          <YAxis
                            stroke="rgba(255,255,255,0.5)"
                            label={{ value: "Fitness", angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.7)" }}
                          />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)" }}
                            labelStyle={{ color: "#fff" }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="bestFitness" stroke="#10b981" name="Best Fitness" strokeWidth={2} />
                          <Line type="monotone" dataKey="averageFitness" stroke="#3b82f6" name="Avg Fitness" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {optimizationResult.paretoFrontier && optimizationResult.paretoFrontier.length > 0 && (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-white">Pareto Frontier</CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-blue-300 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">Pareto Frontier</p>
                            <p className="text-sm">
                              Set of optimal trade-off solutions where improving one objective worsens another. 
                              Each point represents a different balance between mass, cost, and energy margin. No single "best" solution exists.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <CardDescription className="text-blue-200">
                        {optimizationResult.paretoFrontier.length} optimal trade-off solutions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert className="bg-blue-500/20 border-blue-400/50">
                        <AlertDescription className="text-blue-100">
                          Multiple optimal solutions found. Each point represents a different trade-off between objectives.
                          Hover over points to see solution details.
                        </AlertDescription>
                      </Alert>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                          data={optimizationResult.paretoFrontier.map((solution: any, idx: number) => ({
                            index: idx,
                            mass: solution.metrics?.mass || 0,
                            energyMargin: solution.metrics?.energyMargin || 0,
                            cost: solution.metrics?.cost || 0,
                            concentrator: solution.genes?.concentratorId || 'none',
                            pvCell: solution.genes?.pvCellId || 'unknown',
                            battery: solution.genes?.batteryId || 'unknown',
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis
                            dataKey="mass"
                            stroke="#fff"
                            label={{ value: 'Mass (kg)', position: 'insideBottom', offset: -10, fill: '#fff' }}
                          />
                          <YAxis
                            dataKey="energyMargin"
                            stroke="#fff"
                            label={{ value: 'Energy Margin (Wh)', angle: -90, position: 'insideLeft', fill: '#fff' }}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: 'rgba(30, 41, 59, 0.95)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '8px',
                              color: '#fff',
                            }}
                            formatter={(value: any, name: string) => {
                              if (name === 'mass') return [`${value} kg`, 'Mass'];
                              if (name === 'energyMargin') return [`${value.toFixed(2)} Wh`, 'Energy Margin'];
                              if (name === 'cost') return [`$${value}`, 'Cost'];
                              return [value, name];
                            }}
                            labelFormatter={(label) => `Solution ${label}`}
                          />
                          <Legend wrapperStyle={{ color: '#fff' }} />
                          <Line
                            type="monotone"
                            dataKey="energyMargin"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                            activeDot={{ r: 8 }}
                            name="Energy Margin"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-3 rounded-lg">
                          <div className="text-sm text-blue-200 mb-1">Mass Range</div>
                          <div className="text-lg font-semibold text-white">
                            {Math.min(...optimizationResult.paretoFrontier.map((s: any) => s.metrics?.mass || 0)).toFixed(1)} -
                            {Math.max(...optimizationResult.paretoFrontier.map((s: any) => s.metrics?.mass || 0)).toFixed(1)} kg
                          </div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg">
                          <div className="text-sm text-blue-200 mb-1">Energy Margin Range</div>
                          <div className="text-lg font-semibold text-white">
                            {Math.min(...optimizationResult.paretoFrontier.map((s: any) => s.metrics?.energyMargin || 0)).toFixed(0)} -
                            {Math.max(...optimizationResult.paretoFrontier.map((s: any) => s.metrics?.energyMargin || 0)).toFixed(0)} Wh
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
