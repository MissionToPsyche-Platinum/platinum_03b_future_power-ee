/**
 * Help Documentation Page
 * 
 * Comprehensive user guide for the 16 Psyche Power System Simulator
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, Rocket, Calculator, DollarSign, Clock, GitCompare, Zap, BookOpen, Download, HelpCircle } from "lucide-react";

export default function Help() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 border-b border-blue-500/20 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-300" />
              <div>
                <h1 className="text-3xl font-bold text-white">Help & Documentation</h1>
                <p className="text-blue-200 mt-1">Complete guide to using the 16 Psyche Power System Simulator</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" className="bg-transparent border-blue-400 text-blue-200 hover:bg-blue-800/50">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Quick Start */}
        <Card className="bg-slate-800/50 border-blue-500/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Rocket className="w-6 h-6 text-blue-400" />
              Quick Start Guide
            </CardTitle>
            <CardDescription className="text-blue-200">
              Get started with your first simulation in 3 easy steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-white">
            <div className="mb-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link href="/quick-start-guide">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Online
                  </Button>
                </Link>
                <a href="/Quick_Start_Guide.pdf" download="16_Psyche_Quick_Start_Guide.pdf">
                  <Button className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </a>
              </div>
              <p className="text-sm text-slate-400 text-center">
                Comprehensive 5,000+ word guide covering all features, tips for beginners and advanced users, and FAQ
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="font-semibold text-blue-300">Select Technologies</h3>
                <p className="text-slate-300 text-sm">Choose your solar concentrator, PV cell, and battery from the dropdown menus. Each technology has different efficiency, mass, and cost characteristics.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="font-semibold text-blue-300">Configure Parameters</h3>
                <p className="text-slate-300 text-sm">Set your component sizes (concentrator area, PV area, battery capacity) and mission parameters (base load, duration, years of operation).</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="font-semibold text-blue-300">Run Simulation</h3>
                <p className="text-slate-300 text-sm">Click "Run Simulation" to see power generation profiles, battery state of charge, and system viability assessment.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Overview */}
        <Card className="bg-slate-800/50 border-purple-500/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Feature Overview</CardTitle>
            <CardDescription className="text-purple-200">
              Explore all the tools available in the simulator
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Power System Simulator</h3>
              </div>
              <p className="text-slate-300 text-sm">Run real-time simulations with 32 different technology combinations. Visualize power generation, battery SOC, and energy balance over time.</p>
            </div>

            <div className="bg-slate-700/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Component Sizing</h3>
              </div>
              <p className="text-slate-300 text-sm">Calculate optimal PV array area and battery capacity based on your power requirements, energy margin targets, and mission constraints.</p>
            </div>

            <div className="bg-slate-700/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <h3 className="font-semibold text-white">Cost-Benefit Analysis</h3>
              </div>
              <p className="text-slate-300 text-sm">Evaluate lifecycle costs, mass budgets, and TRL risk assessment. Compare cost per watt and power density across different technologies.</p>
            </div>

            <div className="bg-slate-700/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-white">Mission Timeline</h3>
              </div>
              <p className="text-slate-300 text-sm">Simulate 10-year missions with multi-phase architecture. Track degradation from radiation, thermal cycling, and micrometeorite impacts.</p>
            </div>

            <div className="bg-slate-700/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">Optimization Engine</h3>
              </div>
              <p className="text-slate-300 text-sm">Use genetic algorithms to find optimal technology combinations. Minimize mass, minimize cost, or balance multiple objectives with Pareto frontier analysis.</p>
            </div>

            <div className="bg-slate-700/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <GitCompare className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-white">Scenario Comparison</h3>
              </div>
              <p className="text-slate-300 text-sm">Save and compare multiple scenarios side-by-side. Export comparisons to PDF, CSV, Excel, or JSON formats for further analysis.</p>
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card className="bg-slate-800/50 border-green-500/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Download className="w-6 h-6 text-green-400" />
              Data Export Options
            </CardTitle>
            <CardDescription className="text-green-200">
              Export your results in multiple formats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-white">
            <div className="bg-slate-700/50 p-3 rounded">
              <h4 className="font-semibold text-green-300 mb-1">PDF Reports</h4>
              <p className="text-slate-300 text-sm">Professional reports with NASA/ASU branding, charts, and detailed metrics. Perfect for presentations and documentation.</p>
            </div>
            <div className="bg-slate-700/50 p-3 rounded">
              <h4 className="font-semibold text-blue-300 mb-1">CSV Files</h4>
              <p className="text-slate-300 text-sm">Comma-separated values for easy import into spreadsheet applications. Includes all configuration and results data.</p>
            </div>
            <div className="bg-slate-700/50 p-3 rounded">
              <h4 className="font-semibold text-purple-300 mb-1">Excel Workbooks</h4>
              <p className="text-slate-300 text-sm">Multi-sheet Excel files with summary, detailed data, cost breakdown, and mass budget tabs. Ready for advanced analysis.</p>
            </div>
            <div className="bg-slate-700/50 p-3 rounded">
              <h4 className="font-semibold text-slate-300 mb-1">JSON Data</h4>
              <p className="text-slate-300 text-sm">Machine-readable format for programmatic access and integration with other tools.</p>
            </div>
          </CardContent>
        </Card>

        {/* Tips & Best Practices */}
        <Card className="bg-slate-800/50 border-yellow-500/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-yellow-400" />
              Tips & Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-white">
            <div className="flex gap-3">
              <div className="text-yellow-400 text-xl">💡</div>
              <div>
                <h4 className="font-semibold text-yellow-300">Start with Presets</h4>
                <p className="text-slate-300 text-sm">Use the optimization presets (Minimize Mass, Minimize Cost, Balanced) to quickly find good starting configurations.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-yellow-400 text-xl">💡</div>
              <div>
                <h4 className="font-semibold text-yellow-300">Save Your Scenarios</h4>
                <p className="text-slate-300 text-sm">Use the "Save Scenario" button to preserve interesting configurations. You can compare them later in the Scenario Comparison page.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-yellow-400 text-xl">💡</div>
              <div>
                <h4 className="font-semibold text-yellow-300">Check System Viability</h4>
                <p className="text-slate-300 text-sm">Green "System Viable" badge means your power system can sustain the load. Red "System Not Viable" means you need more PV area or battery capacity.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-yellow-400 text-xl">💡</div>
              <div>
                <h4 className="font-semibold text-yellow-300">Use Energy Margins</h4>
                <p className="text-slate-300 text-sm">Aim for 20-30% energy margin to account for uncertainties and degradation. Higher margins increase mass and cost but improve reliability.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-yellow-400 text-xl">💡</div>
              <div>
                <h4 className="font-semibold text-yellow-300">Consider TRL Levels</h4>
                <p className="text-slate-300 text-sm">Higher Technology Readiness Levels (TRL 7-9) mean lower development risk but may have lower performance than emerging technologies (TRL 3-5).</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mission Context */}
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white">Mission Context</CardTitle>
            <CardDescription className="text-blue-200">
              Understanding the 16 Psyche environment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-white">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-700/50 p-3 rounded">
                <h4 className="font-semibold text-blue-300 mb-1">Low Solar Irradiance</h4>
                <p className="text-slate-300 text-sm">At 2.9 AU, solar flux is only 161.83 W/m² (12% of Earth). Requires larger PV arrays or high-efficiency cells.</p>
              </div>
              <div className="bg-slate-700/50 p-3 rounded">
                <h4 className="font-semibold text-blue-300 mb-1">Rapid Rotation</h4>
                <p className="text-slate-300 text-sm">4.2-hour rotation period creates frequent eclipse cycles. Battery must sustain load during 2.1-hour eclipses.</p>
              </div>
              <div className="bg-slate-700/50 p-3 rounded">
                <h4 className="font-semibold text-blue-300 mb-1">Extreme Temperatures</h4>
                <p className="text-slate-300 text-sm">Temperature cycling from 100 K to 270 K affects PV efficiency and battery performance. Thermal management is critical.</p>
              </div>
              <div className="bg-slate-700/50 p-3 rounded">
                <h4 className="font-semibold text-blue-300 mb-1">Long Mission Duration</h4>
                <p className="text-slate-300 text-sm">10-year operational lifetime requires accounting for radiation damage, thermal fatigue, and micrometeorite impacts.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data References */}
        <Card className="bg-slate-800/50 border-green-500/20 mt-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-green-400" />
              Data References & Sources
            </CardTitle>
            <CardDescription className="text-green-200">
              Scientific and technical sources used in the simulator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-white">
            {/* NASA Mission Data */}
            <div>
              <h3 className="font-semibold text-green-300 mb-2">NASA Mission Data</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">16 Psyche Mission Overview</p>
                  <p>NASA Science. (n.d.). <em>Psyche mission overview</em>.</p>
                  <a href="https://science.nasa.gov/mission/psyche/mission-overview/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://science.nasa.gov/mission/psyche/mission-overview/
                  </a>
                </div>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">Asteroid 16 Psyche</p>
                  <p>NASA Science. (n.d.). <em>Asteroid Psyche</em>.</p>
                  <a href="https://science.nasa.gov/solar-system/asteroids/16-psyche/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://science.nasa.gov/solar-system/asteroids/16-psyche/
                  </a>
                </div>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">Solar Electric Propulsion</p>
                  <p>NASA JPL. (2021). <em>Solar electric propulsion makes NASA's Psyche spacecraft go</em>.</p>
                  <a href="https://www.jpl.nasa.gov/news/solar-electric-propulsion-makes-nasas-psyche-spacecraft-go/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://www.jpl.nasa.gov/news/solar-electric-propulsion-makes-nasas-psyche-spacecraft-go/
                  </a>
                </div>
              </div>
            </div>

            {/* Solar Cell Technology */}
            <div>
              <h3 className="font-semibold text-green-300 mb-2">Solar Cell Technology & Radiation Effects</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">GaAs Solar Cell Radiation Handbook</p>
                  <p>Anspaugh, B. E. (1996). <em>GaAs solar cell radiation handbook</em> (JPL Publication 96-9). NASA Technical Reports Server.</p>
                  <a href="https://ntrs.nasa.gov/citations/19970037642" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://ntrs.nasa.gov/citations/19970037642
                  </a>
                </div>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">Radiation-Induced Degradation of III-V Photovoltaic Cells</p>
                  <p>Raya-Armenta, J. M., et al. (2021). A short review of radiation-induced degradation of III–V photovoltaic cells for space applications. <em>Solar Energy Materials and Solar Cells</em>, 233, 111379.</p>
                  <a href="https://www.sciencedirect.com/science/article/pii/S0927024821004219" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://www.sciencedirect.com/science/article/pii/S0927024821004219
                  </a>
                </div>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">ESA Power Systems</p>
                  <p>European Space Agency. (n.d.). <em>Power systems</em>. ESA Engineering & Technology.</p>
                  <a href="https://www.esa.int/Enabling_Support/Space_Engineering_Technology/Power_Systems" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://www.esa.int/Enabling_Support/Space_Engineering_Technology/Power_Systems
                  </a>
                </div>
              </div>
            </div>

            {/* Spacecraft Power Systems */}
            <div>
              <h3 className="font-semibold text-green-300 mb-2">Spacecraft Power Systems Engineering</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">Spacecraft Electrical Power Systems</p>
                  <p>Cunningham, K. (2018). <em>Spacecraft electrical power systems</em> (NASA/TM-2018-219761). NASA Technical Reports Server.</p>
                  <a href="https://ntrs.nasa.gov/api/citations/20180007969/downloads/20180007969.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://ntrs.nasa.gov/api/citations/20180007969/downloads/20180007969.pdf
                  </a>
                </div>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">MESSENGER Spacecraft Power System Design</p>
                  <p>Dakermanji, G., et al. (2009). The MESSENGER spacecraft power system design and early mission performance. <em>Johns Hopkins APL Technical Digest</em>, 28(2), 144-155.</p>
                  <a href="https://messenger.jhuapl.edu/Resources/Publications/Dakermanji.et.al.2005.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://messenger.jhuapl.edu/Resources/Publications/Dakermanji.et.al.2005.pdf
                  </a>
                </div>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">Design Considerations for Spacecraft Solar Arrays</p>
                  <p>Osborne Electronics. (2023). <em>Design considerations for a spacecraft solar array</em>.</p>
                  <a href="https://www.osborneee.com/spacecraft-solar-array/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://www.osborneee.com/spacecraft-solar-array/
                  </a>
                </div>
              </div>
            </div>

            {/* Battery Technology */}
            <div>
              <h3 className="font-semibold text-green-300 mb-2">Battery Technology for Space Applications</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">Challenges and Advances of Photovoltaic Power and Rechargeable Battery Systems</p>
                  <p>Boonmongkolras, P., et al. (2025). Challenges and advances of photovoltaic power and rechargeable battery systems for space applications. <em>Advanced Functional Materials</em>, 35(1), 2525129.</p>
                  <a href="https://advanced.onlinelibrary.wiley.com/doi/abs/10.1002/adfm.2525129" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://advanced.onlinelibrary.wiley.com/doi/abs/10.1002/adfm.2525129
                  </a>
                </div>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">Thermo-Electrochemical Evaluation of Lithium-Ion Batteries</p>
                  <p>Walker, W., et al. (2015). Thermo-electrochemical evaluation of lithium-ion batteries for space applications. <em>Journal of Power Sources</em>, 296, 293-303.</p>
                  <a href="https://www.sciencedirect.com/science/article/pii/S0378775315302081" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://www.sciencedirect.com/science/article/pii/S0378775315302081
                  </a>
                </div>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">Lithium-Ion Batteries for JPL's Mars Missions</p>
                  <p>Smart, M. C., et al. (2018). The use of lithium-ion batteries for JPL's Mars missions. <em>Electrochimica Acta</em>, 268, 27-40.</p>
                  <a href="https://www.sciencedirect.com/science/article/pii/S0013468618303025" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://www.sciencedirect.com/science/article/pii/S0013468618303025
                  </a>
                </div>
              </div>
            </div>

            {/* Accuracy Model Enhancements */}
            <div>
              <h3 className="font-semibold text-green-300 mb-2">Accuracy Model Enhancements</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">Li-ion Battery Aging Datasets</p>
                  <p>NASA Ames Research Center. (2024). <em>Li-ion Battery Aging Datasets</em>. NASA Open Data Portal.</p>
                  <a href="https://data.nasa.gov/dataset/li-ion-battery-aging-datasets" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://data.nasa.gov/dataset/li-ion-battery-aging-datasets
                  </a>
                  <p className="mt-1 text-xs text-slate-400">Used for battery degradation modeling (0.3%/year capacity fade)</p>
                </div>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">Guidelines on Lithium-ion Battery Use in Space Applications</p>
                  <p>Jeevarajan, J. A., et al. (2009). <em>Guidelines on Lithium-ion Battery Use in Space Applications</em>. NASA/TM-2009-215751. NASA Johnson Space Center.</p>
                  <a href="https://ntrs.nasa.gov/api/citations/20090023862/downloads/20090023862.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://ntrs.nasa.gov/api/citations/20090023862/downloads/20090023862.pdf
                  </a>
                  <p className="mt-1 text-xs text-slate-400">Temperature-dependent battery performance curves</p>
                </div>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">Advanced DC/DC Converters for Space Applications</p>
                  <p>NASA Goddard Space Flight Center. (2005). <em>Advanced DC/DC Converters for Space Applications</em>. NASA Technical Report.</p>
                  <a href="https://ntrs.nasa.gov/api/citations/20050182004/downloads/20050182004.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://ntrs.nasa.gov/api/citations/20050182004/downloads/20050182004.pdf
                  </a>
                  <p className="mt-1 text-xs text-slate-400">MPPT efficiency curves (92-98% vs. fixed 95%)</p>
                </div>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">Space Mission Analysis and Design</p>
                  <p>Wertz, J. R., & Larson, W. J. (Eds.). (1999). <em>Space Mission Analysis and Design</em> (3rd ed.). Microcosm Press. Chapter 11: Attitude Determination and Control.</p>
                  <p className="mt-1 text-xs text-slate-400">Spacecraft attitude control accuracy and pointing losses (0.5-5°)</p>
                </div>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">Space Vehicle Dynamics and Control</p>
                  <p>Wie, B. (2008). <em>Space Vehicle Dynamics and Control</em> (2nd ed.). AIAA. Chapter 7: Solar Array Pointing and Tracking Systems.</p>
                  <p className="mt-1 text-xs text-slate-400">Solar array gimbal compensation and pointing dynamics</p>
                </div>
              </div>
            </div>

            {/* Software Libraries */}
            <div>
              <h3 className="font-semibold text-green-300 mb-2">Software Libraries & Tools</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">jsPDF - PDF Generation Library</p>
                  <p>Parallax. (2024). <em>jsPDF: Client-side JavaScript PDF generation</em>. GitHub.</p>
                  <a href="https://github.com/parallax/jsPDF" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://github.com/parallax/jsPDF
                  </a>
                  <p className="mt-1 text-xs text-slate-400">Used for generating PDF reports with charts and technical specifications</p>
                </div>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">SheetJS (xlsx) - Excel Export Library</p>
                  <p>SheetJS Community Edition. (2024). <em>SheetJS Community Edition: Spreadsheet data toolkit</em>. GitHub.</p>
                  <a href="https://github.com/SheetJS/sheetjs" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://github.com/SheetJS/sheetjs
                  </a>
                  <p className="mt-1 text-xs text-slate-400">Used for exporting scenario comparison data to Excel format (.xlsx)</p>
                </div>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="font-medium text-blue-300">Recharts - Data Visualization Library</p>
                  <p>Recharts. (2024). <em>Recharts: A composable charting library built on React components</em>. GitHub.</p>
                  <a href="https://recharts.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    https://recharts.org/
                  </a>
                  <p className="mt-1 text-xs text-slate-400">Used for interactive power generation, battery SOC, and comparison charts</p>
                </div>
              </div>
            </div>

            {/* Technology Database Note */}
            <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Technology Database
              </h4>
              <p className="text-slate-300 text-sm">
                The simulator's technology database includes specifications for 32 technologies (9 solar concentrators, 11 photovoltaic cells, 12 battery systems) compiled from manufacturer datasheets, NASA technical reports, academic research papers, and industry standards current as of 2026. Users should verify critical specifications against current datasheets for actual mission planning.
              </p>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-300 mb-2">Disclaimer</h4>
              <p className="text-slate-300 text-sm">
                This simulator uses simplified models for complex physical phenomena to enable fast execution. While models are based on published research and empirical data, results should be validated with detailed analysis tools for actual mission planning. The simulator has not been validated against flight data from the Psyche spacecraft or similar deep-space missions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
