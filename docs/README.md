# 16 Psyche Power System Simulator — GitHub Pages Deployment

## Repository Name Required

This build is configured for the GitHub repository named **`platinum_03b_future_power-ee`**.
All asset paths are prefixed with `/platinum_03b_future_power-ee/`.

If your repository has a different name, the site will not load. Contact the build team for a rebuild with a different base path.

---

## Deployment Steps

1. Create a GitHub repository named exactly: `platinum_03b_future_power-ee`
2. Upload **all files in this folder** to the repository root (including `.nojekyll` and `404.html`)
3. Go to **Settings → Pages**
4. Set Source to **"Deploy from a branch"**, select **main** / **(root)**
5. Click **Save**

The site will be live at:
`https://[your-github-username].github.io/platinum_03b_future_power-ee/`

---

## Files in This Package

| File | Purpose |
|---|---|
| `index.html` | App entry point |
| `404.html` | SPA routing redirect for GitHub Pages |
| `.nojekyll` | Prevents GitHub from ignoring underscore-prefixed asset files |
| `assets/` | Compiled JavaScript and CSS bundles |
| `logos/` | NASA and ASU logo images |
| `Quick_Start_Guide.pdf` | Downloadable user guide |

---

## No Server Required

- The entire simulation engine runs in the browser
- All saves use browser localStorage — no login or OAuth required
- PDF and Excel exports are generated entirely in the browser
- No network requests are made during simulation
