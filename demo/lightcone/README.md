# Light Cone in Spacetime

An interactive teaching webpage for explaining light cones, causality, timelike/lightlike/spacelike intervals, and spacetime diagrams.

## Features

- 3D future and past light cones
- Interactive sliders for the reference event and explored event
- Automatic classification: timelike, lightlike, or spacelike
- Animated cone glow and movable event marker
- Works as a static teaching webpage
- Ready for GitHub Pages, Netlify, Vercel, or local Vite hosting

## Local setup

```bash
npm install
npm run start
```

Then open the local URL shown in the terminal.

## Build for deployment

```bash
npm run build
```

The production files will be created in `dist/`.

## Deploy to GitHub Pages

1. Create a new GitHub repository, for example `light-cone-spacetime-demo`.
2. Upload these files to the repository.
3. In GitHub, go to **Settings → Pages**.
4. Choose **GitHub Actions** or deploy the built `dist/` folder.

A simple alternative is to deploy with Vercel or Netlify by importing the GitHub repository.

## Teaching note

The demo uses the simplified interval:

```text
s² = c²Δt² − Δx² − Δy² − Δz²
```

For classroom purposes, the visualization sets `c = 1`, so the cone boundary is where spatial distance equals elapsed time.

- `s² > 0`: timelike, causal influence possible
- `s² = 0`: lightlike, only light-speed connection possible
- `s² < 0`: spacelike, no causal connection possible
