import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Rocket, Zap, Battery, Sun, TrendingUp, AlertCircle, Download, Save, Home, Info } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { PresetSelector } from "./SimulatorPresets";
import { generatePDFReport, downloadPDF } from "@/lib/pdfGenerator";
import { validateSimulationConfig, ValidationWarning } from "@/lib/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/_core/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export default function Simulator() {
  const { user } = useAuth();
  
  // Fetch available technologies
  const { data: technologies, isLoading: techLoading } = trpc.simulation.getTechnologies.useQuery();
  
  // Save configuration dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");

  // Simulation state
  const [selectedConcentrator, setSelectedConcentrator] = useState<string>("");
  const [selectedPV, setSelectedPV] = useState<string>("");
  const [selectedBattery, setSelectedBattery] = useState<string>("");
  const [concentratorArea, setConcentratorArea] = useState(3);
  const [pvArea, setPvArea] = useState(1);
  const [batteryCapacity, setBatteryCapacity] = useState(8000);
  const [baseLoad, setBaseLoad] = useState(100);
  const [durationHours, setDurationHours] = useState(48);
  const [yearsOperation, setYearsOperation] = useState(0);
  const [spacecraftClass, setSpacecraftClass] = useState<string>("flagship");
  const [useAdvancedModels, setUseAdvancedModels] = useState(true);

  // Validate parameters and generate warnings
  const validationWarnings = useMemo(() => {
    return validateSimulationConfig({
      concentratorArea,
      pvArea,
      batteryCapacity,
      baseLoad,
      simulationDuration: durationHours,
      yearsInOperation: yearsOperation,
      missionDuration: 10, // Assume 10-year mission for validation
    });
  }, [concentratorArea, pvArea, batteryCapacity, baseLoad, durationHours, yearsOperation]);

  // Handle preset selection
  const handlePresetSelect = (preset: any) => {
    setSelectedConcentrator(preset.concentrator);
    setSelectedPV(preset.pvCell);
    setSelectedBattery(preset.battery);
    setConcentratorArea(preset.parameters.concentratorArea);
    setPvArea(preset.parameters.pvArea);
    setBatteryCapacity(preset.parameters.batteryCapacity);
    setBaseLoad(preset.parameters.baseLoad);
    setDurationHours(preset.parameters.duration);
    setYearsOperation(preset.parameters.years);
    toast.success(`Loaded ${preset.name} configuration`);
  };

  // Simulation mutation
  const runSimMutation = trpc.simulation.run.useMutation({
    onSuccess: () => {
      toast.success("Simulation completed successfully!");
    },
    onError: (error) => {
      toast.error(`Simulation failed: ${error.message}`);
    },
  });

  // Handle simulation run
  const handleRunSimulation = () => {
    if (!selectedConcentrator || !selectedPV || !selectedBattery) {
      toast.error("Please select all technologies");
      return;
    }

    runSimMutation.mutate({
      concentrator: selectedConcentrator,
      pv_cell: selectedPV,
      battery: selectedBattery,
      concentrator_area_m2: concentratorArea,
      pv_area_m2: pvArea,
      battery_capacity_wh: batteryCapacity,
      base_load_w: baseLoad,
      duration_hours: durationHours,
      years_operation: yearsOperation,
      spacecraft_class: spacecraftClass,
      use_simple_model: !useAdvancedModels,
      save: false,
    });
  };

  // Save configuration mutation
  const saveConfigMutation = trpc.configurations.save.useMutation({
    onSuccess: () => {
      toast.success("Configuration saved successfully!");
      setSaveDialogOpen(false);
      setConfigName("");
      setConfigDescription("");
    },
    onError: (error) => {
      toast.error(`Failed to save configuration: ${error.message}`);
    },
  });

  // Handle save configuration
  const handleSaveConfiguration = () => {
    if (!user) {
      toast.error("Please log in to save configurations");
      return;
    }
    if (!configName.trim()) {
      toast.error("Please enter a configuration name");
      return;
    }
    if (!selectedPV || !selectedBattery) {
      toast.error("Please select PV cell and battery");
      return;
    }

    saveConfigMutation.mutate({
      name: configName,
      description: configDescription || undefined,
      concentrator: selectedConcentrator || undefined,
      pvCell: selectedPV,
      battery: selectedBattery,
      concentratorArea,
      pvArea,
      batteryCapacity,
      baseLoad,
      durationHours,
      yearsOperation,
    });
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    const simData = runSimMutation.data;
    if (!simData || !simData.metrics) {
      toast.error("No simulation results to export");
      return;
    }

    try {
      toast.info("Generating PDF report...");
      
      // Transform data to match PDF generator interface
      const pdfResults = {
        metrics: {
          avg_power_generated: simData.metrics.avg_power_generated,
          peak_power_generated: simData.metrics.peak_power_generated,
          avg_power_consumed: simData.metrics.avg_power_consumed,
          min_soc: simData.metrics.min_soc,
          max_soc: 1.0,
          final_soc: simData.metrics.final_soc,
          energy_balance: simData.metrics.energy_balance,
          viable: simData.metrics.viable,
        },
        time_series: simData.time.map((t: number, i: number) => ({
          time_hours: t,
          power_generated_w: simData.power_generated[i],
          battery_soc: simData.battery_soc[i],
        })),
      };
      
      const pdfBlob = await generatePDFReport(
        {
          concentrator: selectedConcentrator,
          pvCell: selectedPV,
          battery: selectedBattery,
          concentratorArea,
          pvArea,
          batteryCapacity,
          baseLoad,
          durationHours,
          yearsOperation,
        },
        pdfResults,
        {
          concentrator: concentratorDetails,
          pvCell: pvDetails,
          battery: batteryDetails,
        }
      );
      
      const filename = `psyche-simulation-${new Date().toISOString().slice(0, 10)}.pdf`;
      downloadPDF(pdfBlob, filename);
      toast.success("PDF report generated successfully!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  // Get selected technology details
  const concentratorDetails = useMemo(() => {
    if (!technologies || !selectedConcentrator) return null;
    return technologies.concentrators.find((c) => c.name === selectedConcentrator);
  }, [technologies, selectedConcentrator]);

  const pvDetails = useMemo(() => {
    if (!technologies || !selectedPV) return null;
    return technologies.pv_cells.find((p) => p.name === selectedPV);
  }, [technologies, selectedPV]);

  const batteryDetails = useMemo(() => {
    if (!technologies || !selectedBattery) return null;
    return technologies.batteries.find((b) => b.name === selectedBattery);
  }, [technologies, selectedBattery]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!runSimMutation.data) return [];
    const { time, power_generated, power_consumed, battery_soc } = runSimMutation.data;
    return time.map((t: number, i: number) => ({
      time: t,
      generated: power_generated[i],
      consumed: power_consumed[i],
      soc: battery_soc[i] * 100, // Convert to percentage
    }));
  }, [runSimMutation.data]);

  const results = runSimMutation.data?.metrics;

  if (techLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8C1D40] via-[#FFC627] to-[#8C1D40] py-8">
    <div className="container mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Rocket className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">16 Psyche Power System Simulator</h1>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="w-4 h-4" />
              Return Home
            </Button>
          </Link>
        </div>
        <p className="text-muted-foreground text-lg">
          Design and simulate power systems for NASA's mission to asteroid 16 Psyche at 2.9 AU from the Sun
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Preset Selector */}
          <PresetSelector onSelectPreset={handlePresetSelect} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5" />
                Technology Selection
              </CardTitle>
              <CardDescription>Choose components for your power system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Solar Concentrator */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Solar Concentrator</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Solar Concentrator</p>
                      <p className="text-sm">
                        Optical devices that focus sunlight onto PV cells to increase power output. 
                        Higher concentration ratios (5x-30x) produce more power but add mass and complexity. 
                        "None" uses flat panels without concentration.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={selectedConcentrator} onValueChange={setSelectedConcentrator}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select concentrator" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {technologies?.concentrators.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name} ({c.era})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {concentratorDetails && (
                  <div className="text-sm text-muted-foreground space-y-1 p-2 bg-muted rounded">
                    <div>Concentration: {concentratorDetails.concentration_ratio}x</div>
                    <div>Efficiency: {((concentratorDetails.efficiency || 0) * 100).toFixed(1)}%</div>
                    <Badge variant={concentratorDetails.era === "Theoretical" ? "default" : "secondary"}>
                      {concentratorDetails.era}
                    </Badge>
                  </div>
                )}
              </div>

              {/* PV Cell */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Photovoltaic Cell</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Photovoltaic Cell</p>
                      <p className="text-sm">
                        Solar panels that convert sunlight into electricity. Efficiency ranges from 10% (Silicon) to 45% (advanced multi-junction cells). 
                        Higher efficiency cells cost more but generate more power per square meter.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={selectedPV} onValueChange={setSelectedPV}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select PV cell" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {technologies?.pv_cells.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name} ({p.era})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pvDetails && (
                  <div className="text-sm text-muted-foreground space-y-1 p-2 bg-muted rounded">
                    <div>Efficiency: {((pvDetails.efficiency || 0) * 100).toFixed(1)}%</div>
                    <div>Degradation: {((pvDetails.degradation_per_year || 0) * 100).toFixed(2)}%/year</div>
                    <Badge variant={pvDetails.era === "Theoretical" ? "default" : "secondary"}>
                      {pvDetails.era}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Battery */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Battery System</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Battery System</p>
                      <p className="text-sm">
                        Energy storage for eclipses and high-power operations. Energy density (Wh/kg) affects spacecraft mass. 
                        Cycle life determines how many charge/discharge cycles the battery can handle before degradation.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={selectedBattery} onValueChange={setSelectedBattery}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select battery" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {technologies?.batteries.map((b) => (
                      <SelectItem key={b.name} value={b.name}>
                        {b.name} ({b.era})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {batteryDetails && (
                  <div className="text-sm text-muted-foreground space-y-1 p-2 bg-muted rounded">
                    <div>Energy Density: {batteryDetails.energy_density} Wh/kg</div>
                    <div>Cycle Life: {(batteryDetails.cycle_life || 0).toLocaleString()} cycles</div>
                    <Badge variant={batteryDetails.era === "Theoretical" ? "default" : "secondary"}>
                      {batteryDetails.era}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Spacecraft Class Selector */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Spacecraft Class</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Spacecraft Class</p>
                      <p className="text-sm">
                        Mission category affecting pointing accuracy and cost. Flagship missions (like Psyche) have the best attitude control (~0.5°), 
                        while SmallSats have looser pointing (~2°). Better pointing means less power loss from solar array misalignment.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={spacecraftClass} onValueChange={setSpacecraftClass}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select spacecraft class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flagship">Flagship (~0.5° pointing)</SelectItem>
                    <SelectItem value="new-frontiers">New Frontiers (~1° pointing)</SelectItem>
                    <SelectItem value="discovery">Discovery (~1.5° pointing)</SelectItem>
                    <SelectItem value="smallsat">SmallSat (~2° pointing)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Affects solar array pointing accuracy and power generation losses</p>
              </div>

              {/* Accuracy Toggle */}
              <div className="flex items-center space-x-2 p-3 bg-muted rounded">
                <input
                  type="checkbox"
                  id="accuracy-toggle"
                  checked={useAdvancedModels}
                  onChange={(e) => setUseAdvancedModels(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="accuracy-toggle" className="text-sm cursor-pointer">
                      Use NASA-validated accuracy models
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2 text-xs">
                          <p className="font-semibold">NASA-Validated Model Improvements:</p>
                          <ul className="space-y-1 list-disc list-inside">
                            <li><strong>Battery Degradation:</strong> 0.3%/year capacity fade based on JPL Li-ion data</li>
                            <li><strong>Temperature Effects:</strong> -0.45%/°C for GaAs cells, capacity variation for batteries</li>
                            <li><strong>MPPT Efficiency:</strong> 92-98% efficiency curve vs. fixed 95%</li>
                            <li><strong>Pointing Losses:</strong> 0.5-5° off-pointing based on spacecraft class</li>
                          </ul>
                          <p className="text-muted-foreground italic mt-2">
                            Simple model uses ideal conditions with no degradation or losses.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="block text-xs text-muted-foreground mt-1">
                    Includes battery degradation, temperature effects, MPPT efficiency, and pointing losses
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Parameters</CardTitle>
              <CardDescription>Configure sizing and mission duration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Concentrator Area (m²)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Total area of concentrator optics. Larger area collects more sunlight but adds mass. Typical: 1-5 m².
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={concentratorArea}
                    onChange={(e) => setConcentratorArea(Number(e.target.value))}
                    min={0.1}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>PV Area (m²)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Total solar panel area. More area generates more power but increases spacecraft size and cost. Typical: 10-50 m².
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={pvArea}
                    onChange={(e) => setPvArea(Number(e.target.value))}
                    min={0.1}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Battery Capacity (Wh)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Energy storage capacity in watt-hours. Must support spacecraft during eclipses and peak loads. Typical: 5000-15000 Wh.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={batteryCapacity}
                    onChange={(e) => setBatteryCapacity(Number(e.target.value))}
                    min={100}
                    step={100}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Base Load (W)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Continuous power draw from spacecraft systems (instruments, computers, communications). Typical: 500-1500 W.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={baseLoad}
                    onChange={(e) => setBaseLoad(Number(e.target.value))}
                    min={10}
                    step={10}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Duration (hours)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Defines the total operational time span of the simulation, measured in hours.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    min={4}
                    step={4}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Years in Operation</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Specifies the mission year in which the simulation scenario is conducted.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={yearsOperation}
                    onChange={(e) => setYearsOperation(Number(e.target.value))}
                    min={0}
                    max={20}
                  />
                </div>
              </div>

              {/* Validation Warnings */}
              {validationWarnings.length > 0 && (
                <div className="space-y-2">
                  {validationWarnings.map((warning, idx) => (
                    <Alert key={idx} variant={warning.type === 'error' ? 'destructive' : 'default'} className="bg-yellow-500/10 border-yellow-500/50">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription className="text-yellow-200">
                        {warning.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              <Button
                onClick={handleRunSimulation}
                disabled={runSimMutation.isPending || !selectedConcentrator || !selectedPV || !selectedBattery}
                className="w-full"
                size="lg"
              >
                {runSimMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Run Simulation
                  </>
                )}
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!selectedPV || !selectedBattery}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Config
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Configuration</DialogTitle>
                      <DialogDescription>
                        Save this configuration for future comparison and analysis.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="config-name">Configuration Name</Label>
                        <Input
                          id="config-name"
                          value={configName}
                          onChange={(e) => setConfigName(e.target.value)}
                          placeholder="e.g., High-Power Configuration"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="config-desc">Description (Optional)</Label>
                        <Input
                          id="config-desc"
                          value={configDescription}
                          onChange={(e) => setConfigDescription(e.target.value)}
                          placeholder="Brief description of this configuration"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleSaveConfiguration}
                        disabled={saveConfigMutation.isPending || !configName.trim()}
                      >
                        {saveConfigMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Configuration"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                  disabled={!results}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {results ? (
            <>
              {/* Accuracy Model Indicator */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Simulation Results</h2>
                <Badge 
                  variant={useAdvancedModels ? "default" : "secondary"}
                  className={`text-sm px-3 py-1 ${useAdvancedModels ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {useAdvancedModels ? '✓ NASA-Validated Model' : 'Simple Model'}
                </Badge>
              </div>
              
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Avg Power</CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          Represents the mean electrical power output (in watts) generated over the entire simulation period.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{results.avg_power_generated.toFixed(1)} W</div>
                    <p className="text-xs text-muted-foreground mt-1">Generated</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Max Power</CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          Indicates the peak electrical power (in watts) produced by the photovoltaic cells at any point during the simulation.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{results.peak_power_generated.toFixed(1)} W</div>
                    <p className="text-xs text-muted-foreground mt-1">Peak output</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Min SOC</CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          Identifies the lowest battery charge level reached during the simulation, reflecting the maximum depth of discharge.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(results.min_soc * 100).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Battery low</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          Overall system viability. "Viable" means the power system can sustain the mission. "Non-viable" indicates insufficient power generation or battery capacity.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={results.viable ? "default" : "destructive"} className="text-sm">
                      {results.viable ? "Viable" : "Non-viable"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {results.viable ? "Mission ready" : "Insufficient power"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Power Generation Profile</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Power Generation Profile</p>
                        <p className="text-sm">
                          Shows solar array power output (orange) vs. spacecraft power consumption (blue) over time. 
                          Generated power should exceed consumed power for a viable design. Gaps indicate eclipse periods or insufficient solar illumination.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription>Power output and consumption over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" label={{ value: "Time (hours)", position: "insideBottom", offset: -5 }} />
                      <YAxis label={{ value: "Power (W)", angle: -90, position: "insideLeft" }} />
                      <RechartsTooltip />
                      <Legend />
                      <Area type="monotone" dataKey="generated" stroke="#f97316" fill="#f97316" fillOpacity={0.3} name="Generated" />
                      <Area type="monotone" dataKey="consumed" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Consumed" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Battery State of Charge</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Battery State of Charge</p>
                        <p className="text-sm">
                          Tracks battery charge level (0-100%) throughout the mission. Should stay above 20% to prevent damage. 
                          Drops during eclipses or high-power operations, recharges when solar arrays generate excess power.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription>Battery charge level over mission duration</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" label={{ value: "Time (hours)", position: "insideBottom", offset: -5 }} />
                      <YAxis label={{ value: "SOC (%)", angle: -90, position: "insideLeft" }} domain={[0, 100]} />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="soc" stroke="#10b981" strokeWidth={2} name="Battery SOC" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Energy Balance */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <CardTitle>Energy Balance</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Represents the net energy difference between total energy generated and total energy consumed by the spacecraft throughout the simulation period.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Generated</div>
                      <div className="text-2xl font-bold">{((results.avg_power_generated * 48) / 1000).toFixed(2)} kWh</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Consumed</div>
                      <div className="text-2xl font-bold">{((results.avg_power_consumed * 48) / 1000).toFixed(2)} kWh</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Balance</div>
                      <div className={`text-2xl font-bold ${results.energy_balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {results.energy_balance >= 0 ? "+" : ""}
                        {(results.energy_balance / 1000).toFixed(2)} kWh
                      </div>
                    </div>
                  </div>
                  {!results.viable && (
                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                      <div className="text-sm">
                        <div className="font-semibold text-destructive">System Non-viable</div>
                        <div className="text-muted-foreground mt-1">
                          {results.min_soc <= 0.2
                            ? "Battery depletes below safe threshold (20%). Increase solar array size or battery capacity."
                            : "Energy deficit detected. System cannot sustain operations long-term."}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center">
                <Rocket className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Simulate</h3>
                <p className="text-muted-foreground">
                  Select your technologies and click "Run Simulation" to see the results
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
