import { useState } from "react";
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
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, Download, Info } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AccuracyComparison() {
  const { data: technologies } = trpc.simulation.getTechnologies.useQuery();
  const compareMutation = trpc.accuracy.compare.useMutation();

  // Configuration state
  const [selectedConcentrator, setSelectedConcentrator] = useState<string>("None");
  const [selectedPV, setSelectedPV] = useState<string>("Multi-Junction GaAs");
  const [selectedBattery, setSelectedBattery] = useState<string>("Lithium-Ion");
  const [concentratorArea, setConcentratorArea] = useState<number>(3);
  const [pvArea, setPvArea] = useState<number>(1);
  const [batteryCapacity, setBatteryCapacity] = useState<number>(8000);
  const [baseLoad, setBaseLoad] = useState<number>(100);
  const [durationHours, setDurationHours] = useState<number>(48);
  const [yearsOperation, setYearsOperation] = useState<number>(5);

  const handleRunComparison = () => {
    compareMutation.mutate({
      concentrator: selectedConcentrator,
      pv_cell: selectedPV,
      battery: selectedBattery,
      concentrator_area_m2: concentratorArea,
      pv_area_m2: pvArea,
      battery_capacity_wh: batteryCapacity,
      base_load_w: baseLoad,
      duration_hours: durationHours,
      years_operation: yearsOperation,
    });
  };

  const handleExportPDF = async () => {
    if (!results) {
      toast.error("No comparison results to export");
      return;
    }

    try {
      toast.info("Generating PDF report...");
      
      // Dynamic import of jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Accuracy Comparison Report", 105, 20, { align: "center" });
      
      // Subtitle
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("16 Psyche Power System Simulator", 105, 28, { align: "center" });
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 35, { align: "center" });
      
      // Configuration section
      let yPos = 50;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Configuration", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Concentrator: ${selectedConcentrator}`, 20, yPos);
      yPos += 6;
      doc.text(`PV Cell: ${selectedPV}`, 20, yPos);
      yPos += 6;
      doc.text(`Battery: ${selectedBattery}`, 20, yPos);
      yPos += 6;
      doc.text(`Concentrator Area: ${concentratorArea} m²`, 20, yPos);
      yPos += 6;
      doc.text(`PV Area: ${pvArea} m²`, 20, yPos);
      yPos += 6;
      doc.text(`Battery Capacity: ${batteryCapacity} Wh`, 20, yPos);
      yPos += 6;
      doc.text(`Base Load: ${baseLoad} W`, 20, yPos);
      yPos += 6;
      doc.text(`Duration: ${durationHours} hours`, 20, yPos);
      yPos += 6;
      doc.text(`Years in Operation: ${yearsOperation}`, 20, yPos);
      yPos += 10;
      
      // Metrics comparison section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Metrics Comparison", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      // Average Power Generated
      doc.text("Average Power Generated:", 20, yPos);
      yPos += 6;
      doc.text(`  Simple Model: ${results.simple.metrics?.avg_power_generated?.toFixed(1) || 0} W`, 25, yPos);
      yPos += 6;
      doc.text(`  NASA Model: ${results.advanced.metrics?.avg_power_generated?.toFixed(1) || 0} W`, 25, yPos);
      yPos += 6;
      const powerDiff = calculateDiff(
        results.simple.metrics?.avg_power_generated || 0,
        results.advanced.metrics?.avg_power_generated || 0
      );
      doc.text(`  Difference: ${powerDiff.toFixed(1)}%`, 25, yPos);
      yPos += 8;
      
      // Min Battery SOC
      doc.text("Minimum Battery SOC:", 20, yPos);
      yPos += 6;
      doc.text(`  Simple Model: ${((results.simple.metrics?.min_soc || 0) * 100).toFixed(1)}%`, 25, yPos);
      yPos += 6;
      doc.text(`  NASA Model: ${((results.advanced.metrics?.min_soc || 0) * 100).toFixed(1)}%`, 25, yPos);
      yPos += 6;
      const socDiff = calculateDiff(
        results.simple.metrics?.min_soc || 0,
        results.advanced.metrics?.min_soc || 0
      );
      doc.text(`  Difference: ${socDiff.toFixed(1)}%`, 25, yPos);
      yPos += 8;
      
      // Energy Balance
      doc.text("Energy Balance:", 20, yPos);
      yPos += 6;
      doc.text(`  Simple Model: ${results.simple.metrics?.energy_balance?.toFixed(0) || 0} Wh`, 25, yPos);
      yPos += 6;
      doc.text(`  NASA Model: ${results.advanced.metrics?.energy_balance?.toFixed(0) || 0} Wh`, 25, yPos);
      yPos += 6;
      const balanceDiff = calculateDiff(
        results.simple.metrics?.energy_balance || 0,
        results.advanced.metrics?.energy_balance || 0
      );
      doc.text(`  Difference: ${balanceDiff.toFixed(1)}%`, 25, yPos);
      yPos += 8;
      
      // System Viability
      doc.text("System Viability:", 20, yPos);
      yPos += 6;
      doc.text(`  Simple Model: ${results.simple.metrics?.viable ? "Viable" : "Not Viable"}`, 25, yPos);
      yPos += 6;
      doc.text(`  NASA Model: ${results.advanced.metrics?.viable ? "Viable" : "Not Viable"}`, 25, yPos);
      yPos += 10;
      
      // New page for accuracy improvements
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Accuracy Improvements Summary", 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      doc.text("NASA-Validated Models Applied:", 20, yPos);
      yPos += 8;
      
      doc.text("1. Battery Degradation Model", 25, yPos);
      yPos += 5;
      doc.text("   - Cycle-dependent capacity fade (30% EOL criterion)", 30, yPos);
      yPos += 5;
      doc.text("   - Temperature-dependent aging acceleration", 30, yPos);
      yPos += 5;
      doc.text("   - Depth-of-discharge impact on cycle life", 30, yPos);
      yPos += 8;
      
      doc.text("2. Temperature-Dependent Li-ion Performance", 25, yPos);
      yPos += 5;
      doc.text("   - Capacity derating curves (-40°C to +60°C)", 30, yPos);
      yPos += 5;
      doc.text("   - Efficiency penalties at extreme temperatures", 30, yPos);
      yPos += 5;
      doc.text("   - Optimal performance at 20-40°C", 30, yPos);
      yPos += 8;
      
      doc.text("3. MPPT Converter Efficiency", 25, yPos);
      yPos += 5;
      doc.text("   - Load-dependent efficiency curves (65-97%)", 30, yPos);
      yPos += 5;
      doc.text("   - Voltage ratio effects on conversion losses", 30, yPos);
      yPos += 5;
      doc.text("   - Temperature-dependent performance degradation", 30, yPos);
      yPos += 8;
      
      doc.text("4. Solar Array Pointing Losses", 25, yPos);
      yPos += 5;
      doc.text("   - Spacecraft attitude dynamics modeling", 30, yPos);
      yPos += 5;
      doc.text("   - Gimbal compensation with ±90° range", 30, yPos);
      yPos += 5;
      doc.text("   - Off-pointing angle cosine losses", 30, yPos);
      yPos += 10;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text("This report was generated by the 16 Psyche Power System Simulator.", 105, 280, { align: "center" });
      doc.text("All models are based on NASA/JPL validated research and flight data.", 105, 285, { align: "center" });
      
      // Save the PDF
      doc.save(`psyche-accuracy-comparison-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF report generated successfully!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  const results = compareMutation.data;

  // Calculate percentage differences
  const calculateDiff = (simple: number, advanced: number) => {
    if (simple === 0) return 0;
    return ((advanced - simple) / simple) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-white">Accuracy Comparison Dashboard</h1>
              <p className="text-slate-300 mt-2">
                Compare simple vs. NASA-validated simulation models to see the impact of accuracy improvements
              </p>
            </div>
          </div>
          {results && (
            <Button
              onClick={() => handleExportPDF()}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF Report
            </Button>
          )}
        </div>

        {/* Configuration Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Simulation Configuration</CardTitle>
            <CardDescription>
              Configure the power system to compare simple and advanced accuracy models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Concentrator */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Solar Concentrator</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Optical devices that focus sunlight onto PV cells. Concentration ratio shows power multiplication factor.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={selectedConcentrator} onValueChange={setSelectedConcentrator}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {technologies?.concentrators.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name} ({c.concentration_ratio}×)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PV Cell */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Photovoltaic Cell</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Solar panels converting sunlight to electricity. Efficiency percentage shows conversion rate.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={selectedPV} onValueChange={setSelectedPV}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {technologies?.pv_cells.map((pv) => (
                      <SelectItem key={pv.name} value={pv.name}>
                        {pv.name} ({(pv.efficiency * 100).toFixed(1)}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Battery */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Battery Technology</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Energy storage system. Energy density (Wh/kg) determines battery mass for given capacity.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={selectedBattery} onValueChange={setSelectedBattery}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {technologies?.batteries.map((b) => (
                      <SelectItem key={b.name} value={b.name}>
                        {b.name} ({b.energy_density} Wh/kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Areas and Capacity */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Concentrator Area (m²)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Total concentrator optics area. Larger area collects more sunlight.
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
                      Total solar panel area. Directly affects power generation capacity.
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
                      Energy storage capacity. Must support spacecraft during eclipses.
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

              {/* Load and Duration */}
              <div className="space-y-2">
                <Label>Base Load (W)</Label>
                <Input
                  type="number"
                  value={baseLoad}
                  onChange={(e) => setBaseLoad(Number(e.target.value))}
                  min={1}
                  step={10}
                />
              </div>

              <div className="space-y-2">
                <Label>Duration (hours)</Label>
                <Input
                  type="number"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  min={1}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Years in Operation</Label>
                <Input
                  type="number"
                  value={yearsOperation}
                  onChange={(e) => setYearsOperation(Number(e.target.value))}
                  min={0}
                  step={1}
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
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
              onClick={handleRunComparison}
              disabled={compareMutation.isPending}
              className="mt-6 w-full md:w-auto"
            >
              {compareMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run Accuracy Comparison
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Metrics Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics Comparison</CardTitle>
                <CardDescription>
                  Side-by-side comparison of simple vs. NASA-validated models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Average Power Generated */}
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">Avg Power Generated</div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold">
                        {results.advanced.metrics?.avg_power_generated?.toFixed(1) || 0}W
                      </span>
                      <span className="text-sm text-muted-foreground">
                        vs {results.simple.metrics?.avg_power_generated?.toFixed(1) || 0}W
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {calculateDiff(
                        results.simple.metrics?.avg_power_generated || 0,
                        results.advanced.metrics?.avg_power_generated || 0
                      ) >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span>
                        {Math.abs(
                          calculateDiff(
                            results.simple.metrics?.avg_power_generated || 0,
                            results.advanced.metrics?.avg_power_generated || 0
                          )
                        ).toFixed(1)}
                        % difference
                      </span>
                    </div>
                  </div>

                  {/* Min Battery SOC */}
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">Min Battery SOC</div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold">
                        {((results.advanced.metrics?.min_soc || 0) * 100).toFixed(1)}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        vs {((results.simple.metrics?.min_soc || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {calculateDiff(
                        results.simple.metrics?.min_soc || 0,
                        results.advanced.metrics?.min_soc || 0
                      ) >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span>
                        {Math.abs(
                          calculateDiff(
                            results.simple.metrics?.min_soc || 0,
                            results.advanced.metrics?.min_soc || 0
                          )
                        ).toFixed(1)}
                        % difference
                      </span>
                    </div>
                  </div>

                  {/* Energy Balance */}
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">Energy Balance</div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold">
                        {results.advanced.metrics?.energy_balance?.toFixed(0) || 0}Wh
                      </span>
                      <span className="text-sm text-muted-foreground">
                        vs {results.simple.metrics?.energy_balance?.toFixed(0) || 0}Wh
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {calculateDiff(
                        results.simple.metrics?.energy_balance || 0,
                        results.advanced.metrics?.energy_balance || 0
                      ) >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span>
                        {Math.abs(
                          calculateDiff(
                            results.simple.metrics?.energy_balance || 0,
                            results.advanced.metrics?.energy_balance || 0
                          )
                        ).toFixed(1)}
                        % difference
                      </span>
                    </div>
                  </div>

                  {/* System Viability */}
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">System Viability</div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold">
                        {results.advanced.metrics?.viable ? "✓ Viable" : "✗ Not Viable"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Simple model: {results.simple.metrics?.viable ? "✓ Viable" : "✗ Not Viable"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Power Generation Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Power Generation Comparison</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Power Generation Comparison</p>
                      <p className="text-sm">
                        Compares simple model (gray) vs. NASA-validated model (blue) power output over time. 
                        The NASA model accounts for degradation, temperature effects, and pointing losses, typically showing lower power.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription>
                  Time-series comparison showing the impact of accuracy improvements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={results.advanced.power_generated?.map((val, idx) => ({
                      time: idx,
                      simple: results.simple.power_generated?.[idx] || 0,
                      advanced: val,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" label={{ value: "Time (hours)", position: "insideBottom", offset: -5 }} />
                    <YAxis label={{ value: "Power (W)", angle: -90, position: "insideLeft" }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="simple" stroke="#94a3b8" name="Simple Model" />
                    <Line type="monotone" dataKey="advanced" stroke="#3b82f6" name="NASA-Validated Model" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Battery SOC Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Battery State of Charge Comparison</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Battery SOC Comparison</p>
                      <p className="text-sm">
                        Shows how battery degradation and temperature effects impact charge levels. 
                        NASA model (green) typically shows lower SOC due to capacity fade and temperature derating.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription>
                  Shows the impact of battery degradation and temperature effects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={results.advanced.battery_soc?.map((val, idx) => ({
                      time: idx,
                      simple: results.simple.battery_soc?.[idx] || 0,
                      advanced: val,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" label={{ value: "Time (hours)", position: "insideBottom", offset: -5 }} />
                    <YAxis label={{ value: "SOC (%)", angle: -90, position: "insideLeft" }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="simple" stroke="#94a3b8" name="Simple Model" />
                    <Line type="monotone" dataKey="advanced" stroke="#10b981" name="NASA-Validated Model" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Accuracy Improvements Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Accuracy Improvements Applied</CardTitle>
                <CardDescription>
                  NASA-validated models included in the advanced simulation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Battery Degradation</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Cycle-dependent capacity fade with 30% EOL criterion
                    </p>
                    <div className="text-xs space-y-1">
                      <div>Years: {yearsOperation} years operation</div>
                      <div>
                        Simple Model: No degradation modeled
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Temperature Effects</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Capacity derating and safety checks for extreme temperatures
                    </p>
                    <div className="text-xs space-y-1">
                      <div>
                        Avg Temp: {((results.advanced.metrics?.avg_battery_temp_k || 273) - 273).toFixed(1)}°C
                      </div>
                      <div>Simple Model: Fixed 25°C</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">MPPT & Pointing</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Load-dependent converter efficiency and pointing losses
                    </p>
                    <div className="text-xs space-y-1">
                      <div>
                        MPPT Eff: {((results.advanced.metrics?.avg_mppt_efficiency || 0) * 100).toFixed(1)}%
                      </div>
                      <div>Simple Model: Fixed 95%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!results && !compareMutation.isPending && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Configure the simulation parameters above and click "Run Accuracy Comparison" to see the results
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
