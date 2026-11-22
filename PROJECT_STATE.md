# PROJECT_STATE

## Done
- Prompt 1: Vite multi-page scaffold (/, /pro/, /world/), content.js, entry chooser page, quality tier detection, placeholder pages, git init.
- Prompt 2: Full /pro site (sticky nav, hero, about, grouped skills, project cards, timeline, contact, footer), light/dark toggle, scroll reveal, a11y basics, 'Try the 3D version' link.
- Prompt 3: /world night camp scene (Three.js): canvas-made blocky textures, instanced ground with hills, trees, campfire with flicker + point light, stars, square moon, slow orbit camera, reduced-motion still frame, WebGL fallback message.
- Prompt 4: Anchor demo mode built (kDemo flag, fake Firebase, seeded data, Patient/Circle switch, fake Rakshak result, map preview), output copied to public/anchor-demo/.
- Prompt 5: Flutter demo build copied to public/anchor-demo/. Reusable phone frame (src/shared/phoneFrame.js + phoneFrame.css) with mountPhone, openPhoneModal, closePhone. /pro demo button opens the phone in a modal. Floating phone card in the /pro hero.

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
  public/anchor-demo/ (Flutter web demo build)
  src/
    main.js
    entry.css
    content.js
    shared/ (fonts.js, tokens.css, qualityTier.js, phoneFrame.js, phoneFrame.css)
    pro/ (main.js, pro.css, heroPhone.css)
    world/
      main.js
      world.css
      engine/ (textures.js, camp.js, world.js)
      shaders/.gitkeep
      entities/.gitkeep
      ui/.gitkeep

## Decisions
- Vite + plain JS + Three.js (npm). No React, no paid services.
- base is './' so the site works on GitHub Pages in a sub-folder.
- Fonts from npm (@fontsource): Press Start 2P for headings/labels, Inter for body.
- Weak device = touch, memory < 4 GB, fewer than 4 cores, or screen under 800px. Pro is highlighted; both buttons always work.
- Last choice saved in localStorage key 'srix-choice' (set when /pro or /world loads).
- Both versions read only from src/content.js (now also skillGroups, project tags/links/note, timeline).
- /world always has a 'Switch to Professional view' button.
- Theme: tokens.css is dark by default; light colours apply only when <html data-theme="light">. Only /pro sets it (inline script in pro/index.html head, saved in localStorage key 'srix-theme', follows system until user picks). / and /world stay dark.
- Tokens added in tokens.css: spacing (--space-1..6), --radius, --maxw, --focus.
- Reveal animation only hides content when <html class="js"> is set and motion is allowed.
- /world textures: 16x16 canvas pixels with seeded random (makeRng), NearestFilter for the blocky look. No image files.
- /world ground: one InstancedMesh (31x31 columns, one block each). Weak devices: fewer trees/stars, pixel ratio 1, no antialias.
- /world reduced motion: one still frame, no flicker, no orbit. Changing the OS setting reloads the page.
- /world body has overflow hidden for now. Scroll/camera prompt must change this for scroll.
- startWorld(container, weak) returns false if WebGL fails; main.js then shows #fallback.
- Anchor demo is built with --dart-define=DEMO=true and --base-href /anchor-demo/ (if hosted at username.github.io/REPO, use /REPO/anchor-demo/).
- Anchor demo uses fake_cloud_firestore ^3.1.0 and firebase_auth_mocks ^0.14.2 (matched to cloud_firestore 5 / firebase_auth 5). Demo data lives only in the visitor's browser tab. No real Firebase is used.
- Phone frame: screen is 390x844 inside a 418x872 body, scaled with CSS transform to fit its container (min scale 0.3). API: mountPhone(container, {url, maxHeight, autoLoad}) returns {load, restart, destroy, refit}; openPhoneModal(); closePhone().
- Phone frame demo URL is new URL('../anchor-demo/', location.href), so it works from /pro/ and /world/. The iframe is created only when the frame loads (modal open). It checks the demo exists with fetch first, shows a skeleton, falls back to a screenshot strip after a failure or 25 s.
- Modal: Escape and overlay click close it, focus is trapped, focus returns to the opener.
- The Anchor demo button on /pro is always enabled and opens the modal. projects[0].demoUrl in content.js is no longer used (left as null).
- Hero phone card styles live in src/pro/heroPhone.css (floats on wide screens, not with reduced motion).

## Known bugs
- None yet.
- TODO: GitHub links in content.js projects point to the profile, not exact repos.
- TODO: Srix screenshots and phone fallback strip are placeholders (add images to public/images/ later).
- TODO: Light values (fire 40, hemisphere 0.9) are untested on other screens. Tune if too dark/bright.
- TODO: Demo alerts in Anchor have no map location on purpose (alert_screen.dart still uses Google Maps).
- TODO: Phone modal not yet tested on a real phone.

## Next prompt
- Put the Anchor demo in the /world chest using mountPhone from src/shared/phoneFrame.js.
- Still to do: scroll moves camera from orbit into first-person, WASD + mouse walking, content text (about, skills) in the world.