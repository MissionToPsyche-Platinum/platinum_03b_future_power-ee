# 16 Psyche Power System Simulator — GitHub Pages Deployment

This is a fully static, standalone build of the 16 Psyche Power System Simulator. It runs entirely in the browser with no server, no OAuth, and no database.

## Quick Start

### Option 1: GitHub Pages (Recommended)

1. Create a new GitHub repository
2. Upload all files from this directory to the repository
3. Go to **Settings → Pages**
4. Set **Source** to "Deploy from a branch"
5. Select **Branch: main** and **Folder: / (root)**
6. Click **Save**
7. Wait 1-2 minutes for deployment
8. Your site will be live at `https://[username].github.io/[repo-name]/`

### Option 2: Local Testing

```bash
# Install a simple HTTP server (if you don't have one)
npm install -g serve

# Serve the directory
serve .

# Open http://localhost:3000 in your browser
```

### Option 3: Any Static Host

Upload all files to any static hosting service:
- Netlify (drag & drop the folder)
- Vercel (import from GitHub)
- Cloudflare Pages
- AWS S3 + CloudFront
- Azure Static Web Apps

## Features

All simulator features work fully offline:

- **Power System Simulator** — run multi-day power simulations with real spacecraft models
- **Component Sizing** — optimize solar array and battery sizes for mission requirements
- **Cost-Benefit Analysis** — compare technology trade-offs (mass, cost, performance)
- **Mission Timeline** — simulate power across multi-year mission phases
- **Optimization** — find optimal configurations via grid search
- **Accuracy Comparison** — compare simple vs. advanced simulation models
- **Compare Configurations** — side-by-side comparison of saved configurations
- **Compare Scenarios** — batch comparison of sizing and cost-benefit scenarios
- **PDF/Excel Export** — generate reports and data exports (all browser-based)

## Data Persistence

All saved configurations and scenarios are stored in **browser localStorage**. This means:

- ✅ Data persists across browser sessions
- ✅ No account or login required
- ✅ Works completely offline
- ⚠️ Data is browser-specific (not synced across devices)
- ⚠️ Clearing browser data will delete all saved items

To back up your data:
1. Go to **Compare Configurations** or **Compare Scenarios**
2. Select all items
3. Click **Export to Excel**
4. Save the file to your computer

## Technical Details

- **Frontend:** React 19 + TypeScript + Tailwind CSS 4
- **Simulation Engine:** Pure TypeScript (no Node.js dependencies)
- **Charts:** Recharts
- **PDF Generation:** jsPDF + html2canvas
- **Excel Export:** xlsx
- **Storage:** Browser localStorage API
- **Bundle Size:** ~3 MB (gzipped: ~700 KB)

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any modern browser with ES2020 support

## License

This simulator is based on the 16 Psyche mission (NASA Discovery Mission #14). All simulation models are derived from published spacecraft data and peer-reviewed research.

## Support

For questions or issues, please open an issue on the GitHub repository.
