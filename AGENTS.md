# AGENTS.md

This file explains the working rules, maintenance boundaries, and release
guidance for `live2d-react`.

## Project Goal

`live2d-react` is a lightweight React wrapper around Live2D Cubism Web.

Developer experience is a top priority:

- consumers should only need to provide:
  - `live2dcubismcore.min.js`
  - model assets
- consumers should not need to:
  - copy shader files
  - pass a shader path
  - understand internal Cubism sample/runtime structure

The intended public usage is:

```tsx
import { Live2D } from 'live2d-react';

<Live2D
  modelJsonPath="/models/Hiyori/Hiyori.model3.json"
  coreScriptSrc="/cubism/core/live2dcubismcore.min.js"
/>;
```

## Architecture

There are three important layers:

1. `src/lib`
   Public React API and wrapper behavior.

2. `src/cubism/runtime`
   Adapted runtime/sample-derived integration code.
   This is where repo-specific Cubism glue should live.

3. `src/cubism/framework`
   Vendored official Live2D Cubism Web Framework build output.

## Hard Boundaries

### `src/lib`

Safe place for feature work, DX improvements, and public API changes.

Examples:

- React props
- loading Core
- viewer lifecycle
- error handling
- docs-facing ergonomics

### `src/cubism/runtime`

Safe place for integration changes that are specific to this library.

Examples:

- model loading flow
- interaction defaults
- simplified subdelegate behavior
- runtime wiring to the framework

### `src/cubism/framework`

Treat this as vendored upstream code.

Rules:

- do not casually edit files here
- prefer keeping this subtree as close to upstream as possible
- if changes are necessary, document why
- avoid mixing app/library logic into this folder

Current expectation:

- this folder should track the official Cubism SDK `Framework/dist` output as
  closely as possible
- embedded shader support is currently implemented by patching
  `rendering/cubismshader_webgl.js` and adding
  `rendering/cubismshader_sources.js`

If future work can move those changes out of vendored framework code, prefer
that.

## DX Principles

When making changes, optimize for:

- minimal required setup for users
- sensible defaults
- fewer required props
- fewer manual asset-copy steps
- fewer “read the source to understand usage” moments

Avoid introducing:

- extra runtime asset hosting requirements unless unavoidable
- sample-app concepts into the public API
- configuration knobs that most users should never need

## Current Public API Expectations

The main exported API is:

- `Live2D`
- `Live2DProps`
- `resolveLive2DModel`

Keep the common path simple:

- `modelJsonPath` should be required
- `coreScriptSrc` may be configurable
- advanced behavior should remain optional

Do not reintroduce `shaderPath` unless there is a strong technical reason.

## Core and Licensing Rules

The published library package does not bundle:

- Live2D Cubism Core
- third-party model assets

For avoidance of doubt:

- the npm package published from this repo must not include Core or model assets
- the demo app in `public/` may include Core and sample model assets when they
  are intentionally added for the playground and their license terms have been
  reviewed
- keep the distinction between demo assets and published library contents clear

Remember:

- files outside `src/cubism` are your wrapper/library code
- vendored Cubism files remain subject to Live2D licensing
- do not describe the entire repo as plain MIT without the current license split

## Updating the Vendored Framework

Preferred maintenance workflow:

1. Obtain the matching official Cubism SDK for Web version.
2. Replace `src/cubism/framework` from official `Framework/dist`.
3. Reapply only the minimal library-specific framework changes that still
   remain necessary.
4. Run:
   - `npm run lint`
   - `npm run build`
   - `npm pack --dry-run`
5. Verify a real model renders in a consumer app.

When updating upstream, note:

- this repo currently uses the official built framework output, not raw TS
  source
- this is intentional to reduce maintenance cost

## Possible Future Improvement

A future maintenance improvement could be:

- a scripted vendor sync from a pinned SDK version, or
- a submodule-based workflow for the official framework

A scripted sync may be easier for contributors than a git submodule.

If this is added later, document the exact sync command here.

## Local Dev App

Files:

- `src/main.tsx`
- `src/App.tsx`

These are only for the local Vite dev app in this repo.

They are not the published library entrypoint.

Published entrypoint:

- `src/lib/index.ts`

Keep the local app useful, but do not let it dictate the public API.

## Release Checklist

Before publishing:

1. run `npm run lint`
2. run `npm run build`
3. run `npm pack --dry-run`
4. confirm README examples are still correct
5. confirm `package.json` metadata is correct
6. confirm no Core or model assets were accidentally added to the published
   library package
7. confirm a real consumer app can still render a model

## Practical Rule of Thumb

If a change makes `live2d-react` easier for end users but moves complexity into
our internal maintenance workflow, that is often the right tradeoff.

If a change makes end users do more manual setup, be skeptical.
