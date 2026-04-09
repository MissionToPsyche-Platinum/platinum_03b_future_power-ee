/**
 * Quick Start Guide Page
 * 
 * Displays the comprehensive Quick Start Guide in browser
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import HomeButton from "@/components/HomeButton";
import { Home, Download, BookOpen } from "lucide-react";

export default function QuickStartGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 border-b border-blue-500/20 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-300" />
              <div>
                <h1 className="text-3xl font-bold text-white">Quick Start Guide</h1>
                <p className="text-blue-200 mt-1">Complete beginner-friendly guide to the 16 Psyche Power System Simulator</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="/Quick_Start_Guide.pdf" download="16_Psyche_Quick_Start_Guide.pdf">
                <Button variant="outline" className="bg-transparent border-green-400 text-green-200 hover:bg-green-800/50">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </a>
          <HomeButton />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardContent className="prose prose-invert max-w-none p-8">
            {/* Quick Start Guide Content */}
            <div className="text-white space-y-6">
              
              <section>
                <p className="text-lg text-blue-200">
                  <strong>Welcome!</strong> This guide will help you get started with the 16 Psyche Power System Simulator, 
                  a tool for designing and testing spacecraft power systems for NASA's mission to the metallic asteroid 16 Psyche.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-blue-300 border-b border-blue-500/30 pb-2">What is This Simulator?</h2>
                <p className="text-slate-300">
                  The 16 Psyche Power System Simulator helps you design the "electrical heart" of a spacecraft traveling to asteroid 16 Psyche, 
                  located 2.9 AU (astronomical units) from the Sun in the main asteroid belt. Think of it as a planning tool that answers: 
                  "Will my spacecraft have enough power to complete its mission?"
                </p>
                <p className="text-slate-300">
                  <strong className="text-blue-300">You don't need to be an engineer to use this!</strong> The simulator is designed for students, 
                  educators, space enthusiasts, and anyone curious about spacecraft power systems.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-blue-300 border-b border-blue-500/30 pb-2">The Basics: What You're Designing</h2>
                <p className="text-slate-300">Every spacecraft needs three main power components:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                  <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
                    <h3 className="font-bold text-blue-300 mb-2">1. Solar Panels</h3>
                    <p className="text-sm text-slate-300">Convert sunlight into electricity (like solar panels on rooftops, but for space!)</p>
                  </div>
                  <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
                    <h3 className="font-bold text-purple-300 mb-2">2. Solar Concentrators</h3>
                    <p className="text-sm text-slate-300">Optional "magnifying glasses" that focus more sunlight onto panels</p>
                  </div>
                  <div className="p-4 bg-green-900/30 rounded-lg border border-green-500/30">
                    <h3 className="font-bold text-green-300 mb-2">3. Batteries</h3>
                    <p className="text-sm text-slate-300">Store energy during sunny periods and provide power during eclipses</p>
                  </div>
                </div>
                <p className="text-slate-300">
                  Your job is to pick the right combination and size them correctly so the spacecraft never runs out of power during its multi-year journey.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-blue-300 border-b border-blue-500/30 pb-2">Getting Started: 5 Simple Steps</h2>
                <div className="space-y-4">
                  {[
                    { num: 1, title: "Select Technologies", desc: "Choose solar concentrator, PV cell, and battery from dropdown menus" },
                    { num: 2, title: "Choose Spacecraft Class", desc: "Pick Flagship, New Frontiers, Discovery, or SmallSat based on mission size" },
                    { num: 3, title: "Set Parameters", desc: "Enter component sizes (areas, capacity) and mission requirements (load, duration)" },
                    { num: 4, title: "Choose Accuracy Model", desc: "Use NASA-validated models for realistic results or simple models for quick tests" },
                    { num: 5, title: "Run Simulation", desc: "Click the button and review power generation, battery SOC, and energy balance" }
                  ].map((step) => (
                    <div key={step.num} className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-lg">
                        {step.num}
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-300 text-lg">{step.title}</h3>
                        <p className="text-slate-300">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-blue-300 border-b border-blue-500/30 pb-2">Understanding Results</h2>
                <div className="space-y-3">
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <h3 className="font-bold text-orange-300 mb-2">📊 Power Generation Profile Chart</h3>
                    <p className="text-sm text-slate-300">
                      Orange line = solar power generated, Blue line = power consumed. Orange should stay above blue!
                    </p>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <h3 className="font-bold text-green-300 mb-2">🔋 Battery State of Charge Chart</h3>
                    <p className="text-sm text-slate-300">
                      Shows battery level (0-100%). Should stay above 20% to prevent damage.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <h3 className="font-bold text-blue-300 mb-2">⚡ Energy Balance</h3>
                    <p className="text-sm text-slate-300">
                      Green positive number = surplus energy (good!), Red negative = power deficit (bad—redesign needed!)
                    </p>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <h3 className="font-bold text-purple-300 mb-2">✓ System Status</h3>
                    <p className="text-sm text-slate-300">
                      Viable (design works!) or Non-viable (needs changes)
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-blue-300 border-b border-blue-500/30 pb-2">Color-Coded Indicators</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-green-900/30 border border-green-500/50 rounded">
                    <div className="text-2xl mb-1">🟢</div>
                    <p className="text-sm font-semibold text-green-300">Green</p>
                    <p className="text-xs text-slate-300">Good, healthy, surplus</p>
                  </div>
                  <div className="p-3 bg-red-900/30 border border-red-500/50 rounded">
                    <div className="text-2xl mb-1">🔴</div>
                    <p className="text-sm font-semibold text-red-300">Red</p>
                    <p className="text-xs text-slate-300">Problem, deficit, danger</p>
                  </div>
                  <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded">
                    <div className="text-2xl mb-1">🔵</div>
                    <p className="text-sm font-semibold text-blue-300">Blue</p>
                    <p className="text-xs text-slate-300">NASA model active</p>
                  </div>
                  <div className="p-3 bg-yellow-900/30 border border-yellow-500/50 rounded">
                    <div className="text-2xl mb-1">🟡</div>
                    <p className="text-sm font-semibold text-yellow-300">Yellow</p>
                    <p className="text-xs text-slate-300">Caution, borderline</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-blue-300 border-b border-blue-500/30 pb-2">Tips for Beginners</h2>
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                  <li><strong className="text-blue-300">Start Simple:</strong> Use the "Current NASA Standard" preset first</li>
                  <li><strong className="text-blue-300">Use Simple Models First:</strong> Uncheck NASA models for easier understanding</li>
                  <li><strong className="text-blue-300">Watch the Charts:</strong> Orange above blue = good power generation</li>
                  <li><strong className="text-blue-300">Check Battery SOC:</strong> Should never drop below 20%</li>
                  <li><strong className="text-blue-300">Hover Over Icons:</strong> Click ⓘ icons for instant explanations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-blue-300 border-b border-blue-500/30 pb-2">Tips for Advanced Users</h2>
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                  <li><strong className="text-purple-300">Use Optimization First:</strong> Let AI find a good starting point</li>
                  <li><strong className="text-purple-300">Validate with NASA Models:</strong> Always check realistic performance</li>
                  <li><strong className="text-purple-300">Compare Scenarios:</strong> Test worst-case conditions</li>
                  <li><strong className="text-purple-300">Check Mission Timeline:</strong> View multi-year degradation effects</li>
                  <li><strong className="text-purple-300">Export Results:</strong> Download PDFs for reports and presentations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-blue-300 border-b border-blue-500/30 pb-2">Common Mistakes to Avoid</h2>
                <div className="space-y-3">
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <h3 className="font-bold text-red-300 mb-1">❌ Oversizing Everything</h3>
                    <p className="text-sm text-slate-300">Making components huge "just to be safe" adds unnecessary mass and cost</p>
                  </div>
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <h3 className="font-bold text-red-300 mb-1">❌ Ignoring Spacecraft Class</h3>
                    <p className="text-sm text-slate-300">Pointing losses can reduce power by 10-30%!</p>
                  </div>
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <h3 className="font-bold text-red-300 mb-1">❌ Forgetting Degradation</h3>
                    <p className="text-sm text-slate-300">Batteries lose 3% capacity over 10 years—can cause late-mission failures</p>
                  </div>
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <h3 className="font-bold text-red-300 mb-1">❌ Unrealistic Load Estimates</h3>
                    <p className="text-sm text-slate-300">Add 20-30% margin to power requirements for safety</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-blue-300 border-b border-blue-500/30 pb-2">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-blue-300 mb-1">Do I need to be an engineer?</h3>
                    <p className="text-slate-300">No! The simulator is designed for anyone interested in space exploration.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-300 mb-1">How accurate are the results?</h3>
                    <p className="text-slate-300">NASA-validated models use real JPL data—suitable for preliminary mission planning and education.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-300 mb-1">What's the difference between Simple and NASA models?</h3>
                    <p className="text-slate-300">Simple = ideal conditions (best-case). NASA = realistic degradation (5-15% lower performance).</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-300 mb-1">Why is my system "Non-viable"?</h3>
                    <p className="text-slate-300">Solar panels too small, battery too small, load too high, or mission too long. Increase sizes or add concentrator.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-300 mb-1">Do I need a concentrator?</h3>
                    <p className="text-slate-300">For 16 Psyche (2.9 AU), strongly recommended—sunlight is 12x weaker than Earth!</p>
                  </div>
                </div>
              </section>

              <section className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-6 rounded-lg border border-blue-500/30">
                <h2 className="text-2xl font-bold text-white mb-3">Ready to Start?</h2>
                <p className="text-blue-200 mb-4">
                  You're now equipped to design spacecraft power systems! Remember: start simple, experiment freely, 
                  validate realistically, and have fun! 🚀
                </p>
                <div className="flex gap-3">
                  <Link href="/simulator">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Start Simulating
                    </Button>
                  </Link>
                  <Link href="/help">
                    <Button variant="outline" className="border-blue-400 text-blue-200 hover:bg-blue-800/50">
                      Full Documentation
                    </Button>
                  </Link>
                </div>
              </section>

              <section className="text-center text-slate-400 text-sm pt-6 border-t border-slate-700">
                <p>16 Psyche Power System Simulator | Version 1.4 | February 2026</p>
                <p className="mt-2">
                  For detailed technical information, visit the <Link href="/help" className="text-blue-400 hover:underline">Help & Documentation</Link> page
                </p>
              </section>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
