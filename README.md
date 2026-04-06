# live2d-react

`live2d-react` is a React wrapper around the Live2D Cubism Web Framework.

It is built for developers who want a React-native way to render Live2D models
without wiring low-level Cubism runtime pieces by hand.

It currently targets the official Cubism SDK for Web 5 line used in this repo.

It is intentionally designed like a generic integration library, not an asset pack:

- you provide your own `live2dcubismcore.min.js`
- you provide your own model assets
- this package provides the React component and the Cubism framework glue

## Why `live2d-react`

- React-first API
  Use a component instead of stitching model rendering into a custom canvas
  integration layer.
- Less setup friction
  No external shader hosting step and no shader-path configuration.
- Cubism 5-ready foundation
  Built around the official Cubism SDK for Web 5 generation used by this repo.
- Cubism-focused
  Designed for apps that just need to render and interact with a Live2D model.
- Small mental model
  Most users only need `modelJsonPath` and `coreScriptSrc`.
- Good fit for app teams
  Especially useful when the rest of the product is already standard React UI.

## Install

```bash
npm install live2d-react
```

Then:

1. add `live2dcubismcore.min.js` to your app's public assets
2. add your model folder to your app's public assets

## Playground

This repo also includes a Vite playground app for trying hosted models and the
render normalization controls.

- `npm run dev`: run the local playground
- `npm run build:demo`: build the playground as a static site

## Usage

```tsx
import { Live2D } from 'live2d-react';

export function Example() {
  return (
    <Live2D
      modelJsonPath="/models/Hiyori/Hiyori.model3.json"
      coreScriptSrc="/cubism/core/live2dcubismcore.min.js"
      style={{ width: 420, height: 420 }}
      renderOptions={{
        fitMode: 'height',
        anchorY: 'bottom'
      }}
    />
  );
}
```

## Props

- `modelJsonPath`: URL path to the model's `.model3.json`
- `coreScriptSrc`: URL path to `live2dcubismcore.min.js`
- `idleMotionGroup`: defaults to `Idle`
- `tapBodyMotionGroup`: defaults to `TapBody`
- `headHitAreaName`: defaults to `Head`
- `bodyHitAreaName`: defaults to `Body`
- `renderOptions`: optional render normalization controls

`renderOptions` supports:

- `fitMode`: `none`, `contain`, `cover`, `width`, or `height`
- `anchorX`: `left`, `center`, or `right`
- `anchorY`: `top`, `center`, or `bottom`
- `offsetX` / `offsetY`: extra logical-scene offsets after fitting and anchoring
- `zoom`: extra scale multiplier applied after fit mode

For keeping different models standing on the same ground line, a good default is:

```tsx
<Live2D
  modelJsonPath="/models/Hiyori/Hiyori.model3.json"
  coreScriptSrc="/cubism/core/live2dcubismcore.min.js"
  renderOptions={{
    fitMode: 'height',
    anchorY: 'bottom'
  }}
/>
```

## Important

This package does **not** include:

- Live2D Cubism Core
- model assets

You must obtain and serve those yourself.

## Licensing

This repository contains:

- original wrapper code for `live2d-react`
- vendored files from Live2D Cubism Web Framework in `src/cubism/framework`
- adapted runtime/sample-derived files in `src/cubism/runtime`

The framework subtree is vendored from the official Cubism SDK for Web
`Framework/dist` output to keep local modifications to a minimum.

See [LICENSE.md](LICENSE.md) for distribution notes.

This package is not legal advice. If you plan to publish commercial software, verify your obligations under the relevant Live2D licenses.
