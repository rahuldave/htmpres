---
name: htmpres-installer
description: Install and initialize htmpres for a Quarto presentation project. Use when Codex needs to install the htmpres Quarto extension, set up a presentation workspace, avoid Justfile collisions, create a starter deck, or explain the separate installation paths for htmpres skills and the htmpres extension.
---

# Htmpres Installer

## Install Model

Keep the two install paths separate:

- Install skills with the Vercel skills CLI:

  ```sh
  npx skills add rahuldave/htmpres -a codex --skill htmpres-installer --skill htmpres-authoring
  ```

- Install the Quarto extension into each deck workspace:

  ```sh
  quarto add rahuldave/htmpres
  ```

Skills teach agents how to operate htmpres. The extension supplies the actual
renderer, templates, runtime, and authoring CLI.

## Setup Workflow

1. Check prerequisites:

   ```sh
   quarto --version
   just --version
   ```

   `quarto` is required. `just` is optional but recommended for humans.

2. Choose a presentation workspace. Prefer a subfolder such as
   `presentations/` so generated files do not collide with an application
   repo's root `Justfile`.

3. Install the extension from the workspace:

   ```sh
   mkdir -p presentations
   cd presentations
   quarto add rahuldave/htmpres
   ```

   For local development, use `quarto add /path/to/htmpres`.

4. Initialize workspace commands:

   ```sh
   quarto run _extensions/htmpres/htmpres.ts workspace init .
   ```

   This writes a generated `Justfile`. If a non-htmpres `Justfile` exists, the
   CLI writes `htmpres.just` instead of overwriting it.

5. Create a starter deck when requested:

   ```sh
   quarto run _extensions/htmpres/htmpres.ts deck new demo --title "Demo Deck" --theme sage
   ```

6. Verify the setup:

   ```sh
   quarto run _extensions/htmpres/htmpres.ts slide list demo/index.qmd --json
   quarto run _extensions/htmpres/htmpres.ts render demo/index.qmd
   ```

## Collision Policy

Do not edit a host project's root `Justfile` during setup. Keep htmpres
convenience commands in the presentation workspace. If the user wants root
integration later, suggest a manual namespaced include after the generated
workspace file exists.

## Theme Defaults

Starter decks can use `sage`, `mono-grid`, or `blank`. Custom user themes are
deck-local CSS blocks added after setup with:

```sh
quarto run _extensions/htmpres/htmpres.ts theme add demo/index.qmd my-theme --from sage
quarto run _extensions/htmpres/htmpres.ts theme set demo/index.qmd my-theme
```

After setup, use `htmpres-authoring` for slide edits.
