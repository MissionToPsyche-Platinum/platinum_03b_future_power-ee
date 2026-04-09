import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Rocket, Zap, Battery, Sun, ArrowRight, Github, Sparkles, Calendar, Calculator, DollarSign, GitCompare, BookOpen, Target, Info } from "lucide-react";
import { APP_TITLE } from "@/const";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Rocket className="w-12 h-12 text-blue-400" />
            <h1 className="text-5xl font-bold text-white">{APP_TITLE}</h1>
          </div>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Design and simulate advanced power systems for NASA's mission to the metallic asteroid 16 Psyche,
            located 2.9 AU from the Sun in the main asteroid belt.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <Sun className="w-8 h-8 text-yellow-400 mb-2" />
              <CardTitle className="text-white">Solar Concentrators</CardTitle>
              <CardDescription className="text-blue-200">
                Choose from 9 concentrator types spanning historical, current, and theoretical technologies
              </CardDescription>
            </CardHeader>
            <CardContent className="text-blue-100">
              <ul className="space-y-1 text-sm">
                <li>• Parabolic & Fresnel designs</li>
                <li>• 5x to 30x concentration ratios</li>
                <li>• Advanced metamaterial optics</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <Zap className="w-8 h-8 text-orange-400 mb-2" />
              <CardTitle className="text-white">Photovoltaic Cells</CardTitle>
              <CardDescription className="text-blue-200">
                Select from 11 PV cell technologies with efficiencies from 10% to 45%
              </CardDescription>
            </CardHeader>
            <CardContent className="text-blue-100">
              <ul className="space-y-1 text-sm">
                <li>• Silicon to multi-junction cells</li>
                <li>• Quantum dot & perovskite</li>
                <li>• Temperature-compensated models</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <Battery className="w-8 h-8 text-green-400 mb-2" />
              <CardTitle className="text-white">Battery Systems</CardTitle>
              <CardDescription className="text-blue-200">
                Compare 12 battery technologies with NASA-validated degradation models
              </CardDescription>
            </CardHeader>
            <CardContent className="text-blue-100">
              <ul className="space-y-1 text-sm">
                <li>• 50 to 800 Wh/kg energy density</li>
                <li>• NASA battery degradation models</li>
                <li>• Temperature-dependent performance</li>
                <li>• MPPT converter efficiency curves</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-4">
          <div className="flex flex-wrap gap-4 justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/simulator">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                    Power Simulator
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                Design a solar photovoltaic electrical system and simulate its operational performance for a mission to 16 Psyche.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/comparison">
                  <Button size="lg" variant="outline" className="border-blue-400 text-blue-400 hover:bg-blue-400/10 px-8 py-6 text-lg">
                    Compare Configurations
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                Evaluate and compare up to four distinct power system configurations to assess relative performance, efficiency, and mission suitability.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/optimization">
                  <Button size="lg" variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400/10 px-8 py-6 text-lg">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Optimization Engine
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                Apply advanced computational algorithms to identify the power system architecture best aligned with mission requirements and constraints.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/timeline">
                  <Button size="lg" variant="outline" className="border-green-400 text-green-400 hover:bg-green-400/10 px-8 py-6 text-lg">
                    <Calendar className="w-5 h-5 mr-2" />
                    Mission Timeline
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                Select specific power technologies and model their performance degradation over the duration of the mission lifecycle.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/sizing">
                  <Button size="lg" variant="outline" className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 px-8 py-6 text-lg">
                    <Calculator className="w-5 h-5 mr-2" />
                    Component Sizing
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                Input mission requirements and automatically calculate the required sizing of power system components to meet operational demands.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/cost-benefit">
                  <Button size="lg" variant="outline" className="border-amber-400 text-amber-400 hover:bg-amber-400/10 px-8 py-6 text-lg">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Cost-Benefit Analysis
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                Perform comprehensive economic evaluations, including lifecycle cost modeling, mass budget analysis, and Technology Readiness Level (TRL) risk assessment.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/compare">
                  <Button size="lg" variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400/10 px-8 py-6 text-lg">
                    <GitCompare className="w-5 h-5 mr-2" />
                    Compare Scenarios
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                Compare multiple mission scenarios side-by-side to evaluate different design choices and operational strategies.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/accuracy">
                  <Button size="lg" variant="outline" className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 px-8 py-6 text-lg">
                    <Target className="w-5 h-5 mr-2" />
                    Accuracy Comparison
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                Compare simple vs. NASA-validated simulation models to see the impact of accuracy improvements.
              </TooltipContent>
            </Tooltip>
            <Link href="/help">
              <Button size="lg" variant="outline" className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 px-8 py-6 text-lg">
                <BookOpen className="w-5 h-5 mr-2" />
                Help & Documentation
              </Button>
            </Link>
          </div>
          <p className="text-blue-200 text-sm">
            Run simulations with sun-tracking sensors and real-time power analysis
          </p>
        </div>

        {/* Power System Diagram */}
        <div className="mt-16 max-w-5xl mx-auto">
          <Card className="bg-white/5 backdrop-blur border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-400" />
                Power System Architecture
              </CardTitle>
              <CardDescription className="text-blue-200">
                Complete system diagram showing all components, variables, and electrical connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663141697743/FGuqTzHlfZTdtffU.png" 
                alt="Power System Architecture Diagram showing solar concentrators, PV cells, batteries, charge controller, and inverter with all variables and connections"
                className="w-full rounded-lg border border-white/20"
              />
              <p className="text-blue-200 text-sm mt-4 text-center">
                This diagram illustrates the complete power system architecture including environmental variables, 
                component specifications, load profiles, and electrical connections between all subsystems.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mission Info */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="bg-white/5 backdrop-blur border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-2xl">About the 16 Psyche Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-100 space-y-4">
              <p>
                The 16 Psyche asteroid is the first predominantly metallic surface object NASA has sent a spacecraft to study.
                Located in the main asteroid belt between Mars and Jupiter, Psyche orbits at approximately 2.9 astronomical units
                (AU) from the Sun, where solar irradiance is only 161.83 W/m² compared to 1361 W/m² at Earth.
              </p>
              <p>
                This simulator helps design power systems capable of operating in this extreme low-irradiance environment,
                accounting for the asteroid's rapid 4.2-hour rotation period, temperature cycling from 100 K to 270 K,
                and long-term component degradation over the mission's 10-year operational lifetime.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 bg-white/5 rounded">
                <div>
                  <div className="text-sm text-blue-300">Distance</div>
                  <div className="text-xl font-bold text-white">2.9 AU</div>
                </div>
                <div>
                  <div className="text-sm text-blue-300">Solar Flux</div>
                  <div className="text-xl font-bold text-white">161.83 W/m²</div>
                </div>
                <div>
                  <div className="text-sm text-blue-300">Rotation</div>
                  <div className="text-xl font-bold text-white">4.2 hours</div>
                </div>
                <div>
                  <div className="text-sm text-blue-300">Temperature</div>
                  <div className="text-xl font-bold text-white">100-270 K</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Partner Logos */}
        <div className="mt-16 mb-8">
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-wrap items-center justify-center gap-12">
              <a 
                href="https://engineering.asu.edu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663141697743/tuLJEtzTGnvWRhsU.png" 
                  alt="ASU Ira A. Fulton Schools of Engineering" 
                  className="h-16 w-auto"
                />
              </a>
              <a 
                href="https://www.nasa.gov" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663141697743/uLFrZqwtVdrizcWW.png" 
                  alt="NASA" 
                  className="h-16 w-auto"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-blue-300 text-sm">
          <p>Simulation based on NASA mission parameters and peer-reviewed space power systems research</p>
        </div>
      </div>
    </div>
  );
}
