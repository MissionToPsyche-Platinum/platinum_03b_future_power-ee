# 16 Psyche Power System Simulator - Quick Start Guide

**Welcome!** This guide will help you get started with the 16 Psyche Power System Simulator, a tool for designing and testing spacecraft power systems for NASA's mission to the metallic asteroid 16 Psyche.

---

## What is This Simulator?

The 16 Psyche Power System Simulator helps you design the "electrical heart" of a spacecraft traveling to asteroid 16 Psyche, located 2.9 AU (astronomical units) from the Sun in the main asteroid belt. Think of it as a planning tool that answers: "Will my spacecraft have enough power to complete its mission?"

**You don't need to be an engineer to use this!** The simulator is designed for students, educators, space enthusiasts, and anyone curious about spacecraft power systems.

---

## The Basics: What You're Designing

Every spacecraft needs three main power components:

1. **Solar Panels (Photovoltaic Cells)** - Convert sunlight into electricity (like solar panels on rooftops, but for space!)
2. **Solar Concentrators** - Optional "magnifying glasses" that focus more sunlight onto the solar panels to boost power
3. **Batteries** - Store energy during sunny periods and provide power during eclipses or high-demand operations

Your job is to pick the right combination and size them correctly so the spacecraft never runs out of power during its multi-year journey.

---

## Getting Started: The Home Page

When you first open the simulator, you'll see the **Home Page** with three main technology cards:

### Solar Concentrators
- **What they do:** Focus sunlight onto solar panels using mirrors or lenses
- **Choose from:** 9 different types (parabolic dishes, Fresnel lenses, metamaterial optics, etc.)
- **Concentration ratios:** 5x to 30x (means they can multiply the sun's power by that amount!)
- **When to use:** Essential for deep space missions where sunlight is weak

### Photovoltaic Cells  
- **What they do:** Convert sunlight directly into electricity
- **Choose from:** 11 technologies ranging from 10% to 45% efficiency
- **Types include:** Silicon (like rooftop solar), multi-junction cells (used on Mars rovers), quantum dot cells (experimental)
- **Efficiency matters:** Higher efficiency = more power from the same panel size

### Battery Systems
- **What they do:** Store energy and provide power when solar panels can't (during eclipses or nighttime)
- **Choose from:** 12 technologies with energy densities from 50 to 800 Wh/kg
- **Types include:** Lithium-ion (like phone batteries), NASA-validated systems, solid-state batteries
- **Degradation:** Batteries lose capacity over time—NASA models account for this!

---

## Page-by-Page Guide

### 1. Power Simulator (Main Tool)

**What it does:** Run a complete power system simulation over your mission duration to see if your design works.

**Step-by-Step:**

1. **Select Technologies**
   - Choose a solar concentrator (or "None" for missions close to the Sun)
   - Pick a photovoltaic cell type
   - Select a battery system

2. **Choose Spacecraft Class**
   - **Flagship:** Large, stable spacecraft (0.5° pointing accuracy) - like Cassini
   - **New Frontiers:** Medium missions (1° accuracy) - like New Horizons  
   - **Discovery:** Smaller missions (2° accuracy) - like Dawn
   - **SmallSat:** Tiny spacecraft (5° accuracy) - like CubeSats
   - *Pointing accuracy affects how well solar panels stay aimed at the Sun*

3. **Set System Parameters**
   - **Concentrator Area:** Size of the focusing mirror/lens (m²)
   - **PV Cell Area:** Size of the solar panel (m²)  
   - **Battery Capacity:** How much energy the battery can store (Wh)
   - **Base Load:** Constant power draw from spacecraft systems (W)
   - **Mission Duration:** How long each simulation cycle runs (hours)
   - **Years in Operation:** Total mission lifetime (1-15 years)

4. **Choose Accuracy Model**
   - ☑ **NASA-Validated Models** (recommended): Includes battery degradation, temperature effects, MPPT efficiency curves, and pointing losses
   - ☐ **Simple Models**: Ideal conditions with no degradation (useful for quick comparisons)
   - *Hover over the ⓘ icon to see what each model includes!*

5. **Click "Run Simulation"**

**Understanding Results:**

- **Power Generation Profile Chart:** Orange line = solar power generated, Blue line = power consumed. Orange should stay above blue!
- **Battery State of Charge Chart:** Shows battery level (0-100%). Should stay above 20% to prevent damage.
- **Energy Balance:** Green positive number = surplus energy (good!), Red negative = power deficit (bad—redesign needed!)
- **System Status:** ✓ Viable (design works!) or ✗ Non-viable (needs changes)

**Color-Coded Indicators:**
- 🟢 Green = Good, healthy, surplus
- 🔴 Red = Problem, deficit, danger
- 🟡 Yellow = Caution, borderline

### 2. Compare Configurations

**What it does:** Test multiple power system designs side-by-side to find the best one.

**When to use:** You have 2-4 different ideas and want to see which performs best.

**How it works:**
1. Create configurations by naming them and selecting technologies
2. Add 2-4 configurations to compare
3. Click "Run Comparison"
4. See results in a table showing average power, min battery SOC, energy balance, and viability for each design

**Pro tip:** Try comparing different battery types with the same solar setup to see which lasts longest!

### 3. Optimization Engine

**What it does:** Uses artificial intelligence (genetic algorithm) to automatically find the best power system design.

**When to use:** You don't know where to start, or you want to find the absolute optimal solution.

**Step-by-Step:**

1. **Choose Optimization Objective:**
   - **Minimize Mass:** Lightest possible system (saves launch costs!)
   - **Maximize Energy Margin:** Maximum power surplus (safest design)
   - **Minimize Cost:** Cheapest system (budget-conscious)
   - **Multi-Objective:** Balance all three factors (finds trade-off solutions)

2. **Set Constraints:**
   - Minimum energy margin (safety buffer)
   - Maximum mass (launch vehicle limit)
   - Maximum cost (budget limit)

3. **Click "Run Optimization"**

**Understanding Results:**

- **Best Solution:** The AI's recommended design with technology selections and sizing
- **Evolution Progress Chart:** Shows how the AI improved solutions over generations (should trend upward)
- **Pareto Frontier** (multi-objective only): Shows multiple optimal trade-off solutions—pick based on your priorities!

**What's a Genetic Algorithm?** Inspired by biological evolution! The AI creates a "population" of random designs, tests them, keeps the best ones, "breeds" them to create new designs, and repeats for many generations until it finds the optimal solution.

### 4. Mission Timeline

**What it does:** Visualize power system performance over the entire multi-year mission.

**When to use:** You want to see how battery degradation and solar panel aging affect power over years, not just hours.

**Key features:**
- Shows power generation declining over time (due to radiation damage and degradation)
- Displays battery capacity fade year-by-year
- Helps you plan for end-of-life performance

### 5. Component Sizing

**What it does:** Calculate the minimum required sizes for solar panels and batteries based on your power needs.

**When to use:** You know how much power you need but don't know how big to make the components.

**How it works:**
1. Enter your power requirements (average load, peak load, eclipse duration)
2. Select technologies
3. Get recommended minimum sizes with safety margins

**Pro tip:** Add 20-30% safety margin to account for uncertainties!

### 6. Accuracy Comparison Dashboard

**What it does:** Run the same design with both Simple and NASA-Validated models to see the difference.

**When to use:** You want to understand how much accuracy improvements matter for your specific design.

**What you'll see:**
- Side-by-side comparison of power generation and battery SOC
- Percentage differences between models
- Explanation of which accuracy factors had the biggest impact

**Key insight:** NASA models typically predict 5-15% lower performance due to real-world degradation and losses—critical for mission planning!

### 7. Cost-Benefit Analysis

**What it does:** Evaluate the economic trade-offs of different power system designs.

**When to use:** You need to justify costs or compare return-on-investment for different technologies.

**Metrics calculated:**
- Total system cost (hardware + launch)
- Cost per Watt
- Cost per Wh of storage
- Reliability scores

### 8. Compare Scenarios

**What it does:** Test how your power system performs under different mission scenarios (solar flares, equipment failures, orbit changes).

**When to use:** You want to stress-test your design for worst-case situations.

**Scenarios include:**
- Increased eclipse duration
- Solar panel degradation from radiation
- Battery failure (reduced capacity)
- Off-nominal sun angles

### 9. Help & Documentation

**What it does:** Provides detailed technical information, references, and this Quick Start Guide!

**Sections:**
- **Getting Started:** Basic concepts and terminology
- **Data References:** Links to NASA technical reports and academic papers
- **Technology Database:** Detailed specs for all 32 technologies in the simulator
- **Accuracy Models:** Explanation of NASA-validated vs. simple models
- **FAQ:** Answers to common questions

---

## Tips for Beginners

### Start Simple
1. Begin with the **Power Simulator** page
2. Use the "Current NASA Standard" preset (click the preset button)
3. Run a simulation with default values to see how it works
4. Then start changing one parameter at a time to see the effects

### Use Simple Models First
- Uncheck "Use NASA-validated accuracy models" for your first few simulations
- This gives you a best-case scenario that's easier to understand
- Once comfortable, enable NASA models to see realistic performance

### Watch the Charts
- If the orange line (power generated) dips below blue (power consumed), you need bigger solar panels or a concentrator
- If battery SOC drops below 20%, you need more battery capacity
- If energy balance is negative (red), your system won't work long-term

### Try Presets
- Click preset buttons like "Current NASA Standard" or "Budget Option" to load proven configurations
- Modify them slightly rather than starting from scratch

---

## Tips for Advanced Users

### Use Optimization First
- Let the AI find a good starting point with the **Optimization Engine**
- Then manually fine-tune the design in the **Power Simulator**

### Validate with NASA Models
- Always run final designs with "Use NASA-validated accuracy models" checked
- The 5-15% performance reduction is real and must be accounted for!

### Compare Multiple Scenarios
- Use **Compare Scenarios** to test your design under worst-case conditions
- If it survives solar flares and battery degradation, it's robust!

### Check Mission Timeline
- Don't just simulate 48 hours—check the full multi-year **Mission Timeline**
- Battery degradation compounds over years and can cause late-mission failures

### Leverage Accuracy Comparison
- Use the **Accuracy Comparison Dashboard** to justify why you need NASA-validated models
- Show stakeholders the quantitative difference in predictions

---

## Understanding the Accuracy Models

### Simple Model (Ideal Conditions)
- No battery degradation
- No temperature effects  
- Fixed 95% MPPT efficiency
- Perfect solar panel pointing
- **Use for:** Quick comparisons, educational demos, best-case scenarios

### NASA-Validated Model (Realistic)
- **Battery Degradation:** 0.3%/year capacity fade (based on JPL Li-ion data)
- **Temperature Effects:** -0.45%/°C for GaAs cells, capacity variation for batteries
- **MPPT Efficiency:** 92-98% curve based on load (vs. fixed 95%)
- **Pointing Losses:** 0.5-5° off-pointing based on spacecraft class
- **Use for:** Mission planning, final designs, realistic performance predictions

**Why it matters:** A design that works with simple models might fail in reality! Always validate with NASA models before finalizing.

---

## Common Mistakes to Avoid

### 1. Oversizing Everything
- **Mistake:** Making solar panels and batteries huge "just to be safe"
- **Problem:** Adds mass and cost unnecessarily
- **Solution:** Use the **Optimization Engine** to find the right balance

### 2. Ignoring Spacecraft Class
- **Mistake:** Not selecting a spacecraft class or using wrong pointing accuracy
- **Problem:** Pointing losses can reduce power by 10-30%!
- **Solution:** Choose the class that matches your mission size and budget

### 3. Forgetting Degradation
- **Mistake:** Only testing with simple models
- **Problem:** Real batteries lose 3% capacity over 10 years—can cause late-mission failures
- **Solution:** Always validate final designs with NASA models

### 4. Unrealistic Load Estimates
- **Mistake:** Underestimating power consumption
- **Problem:** System looks viable in simulation but fails in reality
- **Solution:** Add 20-30% margin to your power requirements

### 5. Not Testing Scenarios
- **Mistake:** Only simulating nominal (perfect) conditions
- **Problem:** Spacecraft face solar flares, equipment failures, and orbit changes
- **Solution:** Use **Compare Scenarios** to stress-test your design

---

## Frequently Asked Questions

### Do I need to be an engineer to use this?
**No!** The simulator is designed for anyone interested in space exploration. We use plain language, tooltips (hover over ⓘ icons), and visual feedback to make it accessible.

### How accurate are the results?
The NASA-validated models use real data from JPL technical reports, academic papers, and spacecraft design textbooks. Results are suitable for preliminary mission planning and educational purposes. For actual spacecraft design, consult aerospace engineers!

### What's the difference between Simple and NASA-Validated models?
- **Simple:** Ideal conditions, no degradation, fixed efficiencies (best-case scenario)
- **NASA-Validated:** Realistic degradation, temperature effects, variable efficiencies (realistic scenario)
- **Difference:** Typically 5-15% lower performance with NASA models

### Can I save my designs?
Yes! Use the "Export as JSON" button to save your configuration. You can reload it later or share it with others.

### Can I export results?
Yes! Most pages have "Export as PDF" or "Export as JSON" buttons. PDFs are great for reports and presentations.

### Which spacecraft class should I choose?
- **Flagship:** Large, expensive missions with high stability (Cassini, Voyager)
- **New Frontiers:** Medium-cost missions (New Horizons, Juno)
- **Discovery:** Lower-cost missions (Dawn, InSight)
- **SmallSat:** CubeSats and small satellites

### Why is my system showing as "Non-viable"?
Common reasons:
1. Solar panels too small (not enough power generation)
2. Battery too small (can't survive eclipses)
3. Load too high (consuming more than generating)
4. Mission duration too long (battery degradation exceeds capacity)

**Fix:** Increase solar panel area, add a concentrator, or increase battery capacity.

### What's a good energy margin?
- **Minimum:** 10-15% (risky but lightweight)
- **Recommended:** 20-30% (balanced)
- **Conservative:** 40-50% (very safe but heavier)

### How do I know if I need a concentrator?
- **Missions close to Sun (<1.5 AU):** Usually not needed
- **Missions far from Sun (>2 AU):** Highly recommended or required
- **16 Psyche (2.9 AU):** Concentrator strongly recommended (sunlight is 12x weaker than Earth!)

### Can I use this for other missions (not Psyche)?
Absolutely! The simulator works for any solar-powered spacecraft. Just adjust the mission parameters (distance from Sun, duration, power requirements).

---

## Next Steps

### For Students and Educators
1. Start with the **Power Simulator** using presets
2. Try the **Optimization Engine** to see AI in action
3. Compare Simple vs. NASA models in **Accuracy Comparison Dashboard**
4. Read the **Help & Documentation** for deeper technical details

### For Mission Planners
1. Use **Optimization Engine** to find candidate designs
2. Validate with **Accuracy Comparison Dashboard** (NASA models)
3. Stress-test with **Compare Scenarios**
4. Check long-term performance in **Mission Timeline**
5. Export results as PDF for reports

### For Researchers
1. Explore the **Technology Database** in Help & Documentation
2. Review the **Data References** section for academic sources
3. Use **Cost-Benefit Analysis** for economic studies
4. Export results as JSON for further analysis in external tools

---

## Getting Help

### In-App Help
- **Hover over ⓘ icons** for instant explanations of any parameter or chart
- **Visit Help & Documentation** page for detailed technical information
- **Check FAQ section** for answers to common questions

### External Resources
- NASA's 16 Psyche Mission: https://psyche.asu.edu/
- Spacecraft Power Systems: NASA Technical Reports Server (NTRS)
- Solar Array Design: SMAD (Space Mission Analysis and Design) textbook

---

## About This Simulator

The 16 Psyche Power System Simulator was developed to support NASA's mission to the metallic asteroid 16 Psyche, scheduled to arrive in 2029. It combines:

- **32 technologies** from NASA databases and academic research
- **NASA-validated models** for battery degradation, temperature effects, and MPPT efficiency
- **Genetic algorithm optimization** for automated design
- **Comprehensive validation** with 71 unit tests (100% pass rate)

**Version:** 1.4 (February 2026)

**Technical Report:** Available in project documentation

---

## Quick Reference: Button Guide

- **Run Simulation** - Execute power system simulation
- **Run Optimization** - Start AI-powered design optimization
- **Run Comparison** - Compare multiple configurations side-by-side
- **Export as PDF** - Download results as professional report
- **Export as JSON** - Save configuration data for later use
- **Preset buttons** (Current NASA Standard, Budget Option, etc.) - Load pre-configured designs

---

## Quick Reference: Color Codes

- 🟢 **Green** - Good, healthy, surplus energy, viable system
- 🔴 **Red** - Problem, deficit, danger, non-viable system
- 🔵 **Blue** - Information, NASA-validated model active
- 🟡 **Yellow** - Caution, borderline, warning
- ⚪ **Gray** - Simple model, baseline comparison

---

## Conclusion

You're now ready to design spacecraft power systems! Remember:

1. **Start simple** - Use presets and simple models first
2. **Experiment freely** - Try different technologies and see what happens
3. **Validate realistically** - Always check with NASA models before finalizing
4. **Have fun!** - Spacecraft design is challenging but incredibly rewarding

**Welcome to the exciting world of spacecraft power system engineering!** 🚀

---

*For technical support, detailed documentation, or to report issues, visit the Help & Documentation page within the simulator.*
