`live2d-react` contains multiple licensing layers.

## Original Wrapper Code

Files outside `src/cubism` are provided for use under the MIT License:

Copyright (c) 2026 Vivo Xu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Vendored Live2D Files

Files under `src/cubism/framework` are vendored from the official
Live2D Cubism Web Framework `Framework/dist` output.

Files under `src/cubism/runtime` are derived from the Live2D web sample runtime.

These vendored files remain subject to the applicable Live2D license terms.

Relevant upstream materials:

- Live2D Cubism Web Framework:
  [LICENSE.md](https://github.com/Live2D/CubismWebFramework/blob/develop/LICENSE.md)
- Live2D Open Software License:
  [agreement](https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html)
- Live2D Cubism Core license:
  [agreement](https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html)

## Not Included

This repository does not grant rights to redistribute:

- Live2D Cubism Core
- third-party model assets

Users of this package are responsible for obtaining those assets and complying
with their respective licenses.
