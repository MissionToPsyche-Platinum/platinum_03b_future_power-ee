/**
 * Scenario Comparison Page
 * 
 * Allows users to select and compare multiple saved scenarios side-by-side
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, GitCompare, Trash2, ArrowLeft, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import HomeButton from "@/components/HomeButton";
import { exportMultipleSizingScenariosAsJSON, exportMultipleCostBenefitScenariosAsJSON } from "@/lib/scenarioExport";
import { generateBatchSizingComparisonPDF, generateBatchCostBenefitComparisonPDF } from "@/lib/batchComparisonPdfGenerator";
import { exportSizingScenariosToCSV, exportSizingScenariosToExcel, exportCostBenefitScenariosToCSV, exportCostBenefitScenariosToExcel } from "@/lib/scenarioExcelExport";
import { SizingComparisonChart } from "@/components/SizingComparisonChart";
import { CostBenefitComparisonChart } from "@/components/CostBenefitComparisonChart";
import { SizingRadarChart } from "@/components/SizingRadarChart";
import { CostBenefitRadarChart } from "@/components/CostBenefitRadarChart";

import { Input } from "@/components/ui/input";
import { localSizing, localCostBenefit } from "@/lib/localStore";

export default function CompareScenarios() {
  const [selectedSizingIds, setSelectedSizingIds] = useState<number[]>([]);
  const [selectedCostBenefitIds, setSelectedCostBenefitIds] = useState<number[]>([]);
  const [comparisonType, setComparisonType] = useState<"sizing" | "costBenefit">("sizing");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  const { user } = useAuth();

  // Local (unauthenticated) scenario lists from localStorage
  const [localSizingList, setLocalSizingList] = useState<ReturnType<typeof localSizing.list>>([]);
  const [localCostBenefitList, setLocalCostBenefitList] = useState<ReturnType<typeof localCostBenefit.list>>([]);

  useEffect(() => {
    setLocalSizingList(localSizing.list());
    setLocalCostBenefitList(localCostBenefit.list());
  }, []);

  // Queries (only run when authenticated)
  const sizingScenariosQuery = trpc.scenarios.sizing.list.useQuery(undefined, {
    enabled: !!user,
  });
  
  const costBenefitScenariosQuery = trpc.scenarios.costBenefit.list.useQuery(undefined, {
    enabled: !!user,
  });
  
  const sizingComparisonQuery = trpc.scenarios.sizing.compare.useQuery(
    { ids: selectedSizingIds },
    { enabled: !!user && selectedSizingIds.length > 0 && comparisonType === "sizing" }
  );
  
  const costBenefitComparisonQuery = trpc.scenarios.costBenefit.compare.useQuery(
    { ids: selectedCostBenefitIds },
    { enabled: !!user && selectedCostBenefitIds.length > 0 && comparisonType === "costBenefit" }
  );
  
  // Delete mutations
  const deleteSizingMutation = trpc.scenarios.sizing.delete.useMutation({
    onSuccess: () => {
      toast.success("Scenario deleted");
      sizingScenariosQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
  
  const deleteCostBenefitMutation = trpc.scenarios.costBenefit.delete.useMutation({
    onSuccess: () => {
      toast.success("Scenario deleted");
      costBenefitScenariosQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
  

  
  const toggleSizingSelection = (id: number) => {
    setSelectedSizingIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const toggleCostBenefitSelection = (id: number) => {
    setSelectedCostBenefitIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  

  
  // Merge server + local data depending on auth state
  const sizingScenarios = user ? (sizingScenariosQuery.data || []) : localSizingList;
  const costBenefitScenarios = user ? (costBenefitScenariosQuery.data || []) : localCostBenefitList;

  // For local comparison, filter by selected IDs directly
  const sizingComparison = user
    ? (sizingComparisonQuery.data || [])
    : localSizing.compare(selectedSizingIds);
  const costBenefitComparison = user
    ? (costBenefitComparisonQuery.data || [])
    : localCostBenefit.compare(selectedCostBenefitIds);
  
  // Debug logging
  console.log('Selected sizing IDs:', selectedSizingIds);
  console.log('Sizing comparison query enabled:', selectedSizingIds.length > 0 && comparisonType === "sizing");
  console.log('Sizing comparison data:', sizingComparison);
  console.log('Sizing comparison query status:', sizingComparisonQuery.status);
  console.log('Sizing comparison query error:', sizingComparisonQuery.error);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-purple-500/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <GitCompare className="w-8 h-8 text-purple-400" />
                <div>
                  <h1 className="text-3xl font-bold text-white">Compare Scenarios</h1>
                  <p className="text-purple-200 mt-1">
                    Select and compare multiple saved scenarios side-by-side
                  </p>
                </div>
              </div>
          <HomeButton />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Type Selector */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setComparisonType("sizing")}
            className={comparisonType === "sizing" ? "bg-blue-600" : "bg-slate-700"}
          >
            Component Sizing ({sizingScenarios.length})
          </Button>
          <Button
            onClick={() => setComparisonType("costBenefit")}
            className={comparisonType === "costBenefit" ? "bg-purple-600" : "bg-slate-700"}
          >
            Cost-Benefit ({costBenefitScenarios.length})
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario List */}
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Saved Scenarios</CardTitle>
              <CardDescription className="text-purple-200">
                Select scenarios to compare (max 4)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Search scenarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-700/50 border-purple-500/20 text-white placeholder:text-purple-300/50"
                />
              </div>
              {comparisonType === "sizing" ? (
                <div className="space-y-3">
                  {sizingScenarios.length === 0 ? (
                    <p className="text-purple-200 text-sm text-center py-8">
                      No saved sizing scenarios yet
                    </p>
                  ) : (
                    sizingScenarios
                      .filter(scenario => 
                        scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        scenario.description?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((scenario) => (
                      <div
                        key={scenario.id}
                        className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg"
                      >
                        <Checkbox
                          checked={selectedSizingIds.includes(scenario.id)}
                          onCheckedChange={() => toggleSizingSelection(scenario.id)}
                          disabled={
                            !selectedSizingIds.includes(scenario.id) &&
                            selectedSizingIds.length >= 4
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold text-sm">{scenario.name}</h4>
                          {scenario.description && (
                            <p className="text-purple-200 text-xs mt-1 line-clamp-2">
                              {scenario.description}
                            </p>
                          )}
                          <p className="text-purple-300 text-xs mt-1">
                            {new Date(scenario.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSizingMutation.mutate({ id: scenario.id })}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {costBenefitScenarios.length === 0 ? (
                    <p className="text-purple-200 text-sm text-center py-8">
                      No saved cost-benefit scenarios yet
                    </p>
                  ) : (
                    costBenefitScenarios
                      .filter(scenario => 
                        scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        scenario.description?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((scenario) => (
                      <div
                        key={scenario.id}
                        className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg"
                      >
                        <Checkbox
                          checked={selectedCostBenefitIds.includes(scenario.id)}
                          onCheckedChange={() => toggleCostBenefitSelection(scenario.id)}
                          disabled={
                            !selectedCostBenefitIds.includes(scenario.id) &&
                            selectedCostBenefitIds.length >= 4
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold text-sm">{scenario.name}</h4>
                          {scenario.description && (
                            <p className="text-purple-200 text-xs mt-1 line-clamp-2">
                              {scenario.description}
                            </p>
                          )}
                          <p className="text-purple-300 text-xs mt-1">
                            {new Date(scenario.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCostBenefitMutation.mutate({ id: scenario.id })}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comparison View */}
          <div className="lg:col-span-2">
            {comparisonType === "sizing" && selectedSizingIds.length > 0 ? (
              <>
                <div className="mb-4 flex justify-end gap-2 flex-wrap">
                  <Button
                    onClick={() => {
                      try {
                        console.log("PDF BUTTON CLICKED!", sizingComparison);
                        const pdf = generateBatchSizingComparisonPDF(sizingComparison);
                        pdf.save(`sizing-comparison-${new Date().toISOString().split('T')[0]}.pdf`);
                        toast.success("PDF downloaded successfully");
                      } catch (error) {
                        console.error("PDF export error:", error);
                        toast.error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    onClick={() => {
                      try {
                        exportSizingScenariosToCSV(sizingComparison);
                        toast.success("CSV downloaded successfully");
                      } catch (error) {
                        console.error("CSV export error:", error);
                        toast.error(`CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    onClick={() => {
                      try {
                        exportSizingScenariosToExcel(sizingComparison);
                        toast.success("Excel file downloaded successfully");
                      } catch (error) {
                        console.error("Excel export error:", error);
                        toast.error(`Excel export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                  <Button
                    onClick={() => exportMultipleSizingScenariosAsJSON(sizingComparison)}
                    className="bg-slate-600 hover:bg-slate-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    JSON
                  </Button>
                </div>
                
                {selectedSizingIds.length >= 2 && (
                  <Card className="bg-slate-800/50 border-blue-500/20 mb-6">
                    <CardHeader>
                      <CardTitle className="text-white">Comparison Charts</CardTitle>
                      <CardDescription className="text-blue-200">
                        Visual comparison of key metrics across selected scenarios
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SizingComparisonChart scenarios={sizingComparison} />
                    </CardContent>
                  </Card>
                )}
                
                {selectedSizingIds.length >= 2 && (
                  <Card className="bg-slate-800/50 border-blue-500/20 mb-6">
                    <CardHeader>
                      <CardTitle className="text-white">Performance Radar</CardTitle>
                      <CardDescription className="text-blue-200">
                        Multi-dimensional performance comparison
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SizingRadarChart scenarios={sizingComparison} />
                    </CardContent>
                  </Card>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sizingComparison.map((scenario) => {
                  const results = JSON.parse(scenario.resultsJson);
                  const solution = results.solution;
                  
                  return (
                    <Card key={scenario.id} className="bg-slate-800/50 border-blue-500/20">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">{scenario.name}</CardTitle>
                        {scenario.description && (
                          <CardDescription className="text-blue-200 text-sm">
                            {scenario.description}
                          </CardDescription>
                        )}
                        {scenario.notes && (
                          <div className="mt-2 p-2 bg-slate-700/50 rounded text-xs text-blue-100">
                            <p className="font-semibold text-blue-300 mb-1">Notes:</p>
                            <p className="whitespace-pre-wrap">{scenario.notes}</p>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-blue-200 text-sm font-semibold mb-2">Technologies</h4>
                          <div className="space-y-1">
                            <p className="text-white text-sm">PV: {scenario.pvCell}</p>
                            <p className="text-white text-sm">Battery: {scenario.battery}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-blue-200 text-sm font-semibold mb-2">Component Sizes</h4>
                          <div className="space-y-1">
                            <p className="text-white text-sm">PV Area: {solution.pvArea.toFixed(2)} m²</p>
                            <p className="text-white text-sm">Battery: {solution.batteryCapacity.toFixed(0)} Wh</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-blue-200 text-sm font-semibold mb-2">Metrics</h4>
                          <div className="space-y-1">
                            <p className="text-white text-sm">Mass: {solution.totalMass.toFixed(1)} kg</p>
                            <p className="text-white text-sm">Cost: ${(solution.totalCost / 1000000).toFixed(2)}M</p>
                            <p className="text-white text-sm">Energy Margin: {solution.energyMargin.toFixed(1)}%</p>
                          </div>
                        </div>
                        
                        <Badge className={solution.feasible ? "bg-green-600" : "bg-red-600"}>
                          {solution.feasible ? "Feasible" : "Infeasible"}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              </>
            ) : comparisonType === "costBenefit" && selectedCostBenefitIds.length > 0 ? (
              <>
                <div className="mb-4 flex justify-end gap-2 flex-wrap">
                  <Button
                    onClick={() => {
                      try {
                        const pdf = generateBatchCostBenefitComparisonPDF(costBenefitComparison);
                        pdf.save(`cost-benefit-comparison-${new Date().toISOString().split('T')[0]}.pdf`);
                        toast.success("PDF downloaded successfully");
                      } catch (error) {
                        console.error("PDF export error:", error);
                        toast.error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    onClick={() => {
                      try {
                        exportCostBenefitScenariosToCSV(costBenefitComparison);
                        toast.success("CSV downloaded successfully");
                      } catch (error) {
                        console.error("CSV export error:", error);
                        toast.error(`CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    onClick={() => {
                      try {
                        exportCostBenefitScenariosToExcel(costBenefitComparison);
                        toast.success("Excel file downloaded successfully");
                      } catch (error) {
                        console.error("Excel export error:", error);
                        toast.error(`Excel export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                  <Button
                    onClick={() => exportMultipleCostBenefitScenariosAsJSON(costBenefitComparison)}
                    className="bg-slate-600 hover:bg-slate-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    JSON
                  </Button>
                </div>
                
                {selectedCostBenefitIds.length >= 2 && (
                  <Card className="bg-slate-800/50 border-purple-500/20 mb-6">
                    <CardHeader>
                      <CardTitle className="text-white">Comparison Charts</CardTitle>
                      <CardDescription className="text-purple-200">
                        Visual comparison of key metrics across selected scenarios
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CostBenefitComparisonChart scenarios={costBenefitComparison} />
                    </CardContent>
                  </Card>
                )}
                
                {selectedCostBenefitIds.length >= 2 && (
                  <Card className="bg-slate-800/50 border-purple-500/20 mb-6">
                    <CardHeader>
                      <CardTitle className="text-white">Performance Radar</CardTitle>
                      <CardDescription className="text-purple-200">
                        Multi-dimensional performance comparison
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CostBenefitRadarChart scenarios={costBenefitComparison} />
                    </CardContent>
                  </Card>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {costBenefitComparison.map((scenario) => {
                  const analysis = JSON.parse(scenario.resultsJson);
                  
                  return (
                    <Card key={scenario.id} className="bg-slate-800/50 border-purple-500/20">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">{scenario.name}</CardTitle>
                        {scenario.description && (
                          <CardDescription className="text-purple-200 text-sm">
                            {scenario.description}
                          </CardDescription>
                        )}
                        {scenario.notes && (
                          <div className="mt-2 p-2 bg-slate-700/50 rounded text-xs text-purple-100">
                            <p className="font-semibold text-purple-300 mb-1">Notes:</p>
                            <p className="whitespace-pre-wrap">{scenario.notes}</p>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-purple-200 text-sm font-semibold mb-2">Technologies</h4>
                          <div className="space-y-1">
                            <p className="text-white text-sm">PV: {scenario.pvCell}</p>
                            <p className="text-white text-sm">Battery: {scenario.battery}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-purple-200 text-sm font-semibold mb-2">Lifecycle Costs</h4>
                          <div className="space-y-1">
                            <p className="text-white text-sm">
                              Total: ${((analysis.lifecycle?.totalLifecycle || 0) / 1000000).toFixed(2)}M
                            </p>
                            <p className="text-white text-sm">
                              Per Watt: ${((analysis.lifecycle?.costPerWatt || 0) / 1000).toFixed(1)}k/W
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-purple-200 text-sm font-semibold mb-2">Mass Budget</h4>
                          <div className="space-y-1">
                            <p className="text-white text-sm">
                              Total: {(analysis.mass?.totalMass || 0).toFixed(1)} kg
                            </p>
                            <p className="text-white text-sm">
                              Power/Mass: {(analysis.mass?.powerToMassRatio || 0).toFixed(2)} W/kg
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-purple-200 text-sm font-semibold mb-2">Performance</h4>
                          <Badge className="bg-purple-600">
                            Score: {analysis.performanceScore?.toFixed(1) || '0.0'}/100
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              </>
            ) : (
              <Card className="bg-slate-800/50 border-purple-500/20">
                <CardContent className="py-16 text-center">
                  <GitCompare className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
                  <p className="text-purple-200">
                    Select scenarios from the list to compare them side-by-side
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
