# PROJECT_STATE

## Done
- Prompt 1: Vite multi-page scaffold (/, /pro/, /world/), content.js, entry chooser page, quality tier detection, placeholder pages, git init.

## File tree
portfolio/
  index.html
  vite.config.js
  package.json
  .gitignore
  PROJECT_STATE.md
  pro/index.html
  world/index.html
  public/images/.gitkeep
  public/anchor-demo/.gitkeep
  src/
    main.js
    entry.css
    content.js
    shared/ (fonts.js, tokens.css, qualityTier.js)
    pro/main.js
    world/main.js
    world/engine/.gitkeep
    world/shaders/.gitkeep
    world/entities/.gitkeep
    world/ui/.gitkeep

## Decisions
- Vite + plain JS + Three.js (npm). No React, no paid services.
- base is './' so the site works on GitHub Pages in a sub-folder.
- Fonts from npm (@fontsource): Press Start 2P for headings/labels, Inter for body.
- Weak device = touch, memory < 4 GB, fewer than 4 cores, or screen under 800px. Pro is highlighted; both buttons always work.
- Last choice saved in localStorage key 'srix-choice' (set when /pro or /world loads).
- Both versions read only from src/content.js.
- /world always has a 'Switch to Professional view' button.

## Known bugs
- None yet.

## Next prompt
- Prompt 2.