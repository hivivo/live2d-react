import { useMemo, useState } from 'react';

import { Live2D, type Live2DRenderOptions } from './lib';
import './App.css';

type FitMode = NonNullable<Live2DRenderOptions['fitMode']>;
type AnchorX = NonNullable<Live2DRenderOptions['anchorX']>;
type AnchorY = NonNullable<Live2DRenderOptions['anchorY']>;

type ModelPreset = {
  id: string;
  label: string;
  modelJsonPath: string;
};

type SnippetInput = Live2DRenderOptions & { modelJsonPath: string };

const usageCoreScriptSrc = '<Your Live2D Cubism Core Url>';
const defaultModelJsonPath = '/models/Hiyori/Hiyori.model3.json';
const demoBasePath = import.meta.env.BASE_URL;
const fitModes: FitMode[] = ['none', 'contain', 'cover', 'width', 'height'];
const anchorXOptions: AnchorX[] = ['left', 'center', 'right'];
const anchorYOptions: AnchorY[] = ['top', 'center', 'bottom'];
const installSnippet = `npm install live2d-react`;
const minimalUsageSnippet = `import { Live2D } from 'live2d-react';

<Live2D
  modelJsonPath="/models/Hiyori/Hiyori.model3.json"
  coreScriptSrc="/cubism/core/live2dcubismcore.min.js"
  style={{ width: 420, height: 420 }}
/>;
`;

const modelPresets: ModelPreset[] = [
  {
    id: 'hiyori',
    label: 'Hiyori',
    modelJsonPath: defaultModelJsonPath
  },
  {
    id: 'haru',
    label: 'Haru',
    modelJsonPath: '/models/Haru/Haru.model3.json'
  },
  {
    id: 'custom',
    label: 'Custom',
    modelJsonPath: ''
  }
];

const propDocs = [
  {
    name: 'modelJsonPath',
    description: "Required path or URL to the model's .model3.json file."
  },
  {
    name: 'coreScriptSrc',
    description: 'Required URL to live2dcubismcore.min.js.'
  },
  {
    name: 'style',
    description: 'Wrapper sizing. Set width and height here for the stage.'
  },
  {
    name: 'canvasStyle',
    description: 'Optional styling applied directly to the internal canvas.'
  },
  {
    name: 'idleMotionGroup',
    description: "Optional motion group name. Defaults to 'Idle'."
  },
  {
    name: 'tapBodyMotionGroup',
    description: "Optional tap motion group name. Defaults to 'TapBody'."
  },
  {
    name: 'headHitAreaName',
    description: "Optional hit area name. Defaults to 'Head'."
  },
  {
    name: 'bodyHitAreaName',
    description: "Optional hit area name. Defaults to 'Body'."
  },
  {
    name: 'renderOptions',
    description: 'Optional fitting, anchoring, offset, and zoom controls.'
  }
] as const;

const renderOptionDocs = [
  {
    name: 'fitMode',
    description: "How the model should scale in the stage: 'none', 'contain', 'cover', 'width', or 'height'."
  },
  {
    name: 'anchorX',
    description: "Horizontal placement: 'left', 'center', or 'right'."
  },
  {
    name: 'anchorY',
    description: "Vertical placement: 'top', 'center', or 'bottom'."
  },
  {
    name: 'offsetX',
    description: 'Extra horizontal adjustment after fitting and anchoring.'
  },
  {
    name: 'offsetY',
    description: 'Extra vertical adjustment after fitting and anchoring.'
  },
  {
    name: 'zoom',
    description: 'Extra scale multiplier applied after fitMode.'
  }
] as const;

function formatNumber(value: number) {
  return Number.parseFloat(value.toFixed(2)).toString();
}

function resolveDemoAssetPath(path: string) {
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  const normalizedBasePath = demoBasePath.endsWith('/')
    ? demoBasePath
    : `${demoBasePath}/`;

  if (path.startsWith(normalizedBasePath)) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${normalizedBasePath}${path.slice(1)}`;
  }

  return `${normalizedBasePath}${path}`;
}

function buildRenderOptions({
  fitMode,
  anchorX,
  anchorY,
  offsetX,
  offsetY,
  zoom
}: {
  fitMode: FitMode;
  anchorX: AnchorX;
  anchorY: AnchorY;
  offsetX: number;
  offsetY: number;
  zoom: number;
}): Live2DRenderOptions {
  const nextOptions: Live2DRenderOptions = {};

  if (fitMode !== 'none') {
    nextOptions.fitMode = fitMode;
  }
  if (anchorX !== 'center') {
    nextOptions.anchorX = anchorX;
  }
  if (anchorY !== 'center') {
    nextOptions.anchorY = anchorY;
  }
  if (offsetX !== 0) {
    nextOptions.offsetX = offsetX;
  }
  if (offsetY !== 0) {
    nextOptions.offsetY = offsetY;
  }
  if (zoom !== 1) {
    nextOptions.zoom = zoom;
  }

  return nextOptions;
}

function toCodeBlock(config: SnippetInput) {
  const lines = [
    "import { Live2D } from 'live2d-react';",
    '',
    '<Live2D',
    `  modelJsonPath="${config.modelJsonPath}"`,
    `  coreScriptSrc="${usageCoreScriptSrc}"`
  ];

  const renderOptionLines = [
    config.fitMode ? `    fitMode: '${config.fitMode}',` : null,
    config.anchorX ? `    anchorX: '${config.anchorX}',` : null,
    config.anchorY ? `    anchorY: '${config.anchorY}',` : null,
    config.offsetX !== undefined
      ? `    offsetX: ${formatNumber(config.offsetX)},`
      : null,
    config.offsetY !== undefined
      ? `    offsetY: ${formatNumber(config.offsetY)},`
      : null,
    config.zoom !== undefined ? `    zoom: ${formatNumber(config.zoom)}` : null
  ].filter((line): line is string => line !== null);

  if (renderOptionLines.length > 0) {
    lines.push('  renderOptions={{');
    lines.push(...renderOptionLines);
    lines.push('  }}');
  }

  lines.push('/>;');
  return lines.join('\n');
}

function App() {
  const [selectedPresetId, setSelectedPresetId] = useState('hiyori');
  const [customModelJsonPath, setCustomModelJsonPath] = useState('');
  const [modelJsonPath, setModelJsonPath] = useState(
    defaultModelJsonPath
  );
  const [fitMode, setFitMode] = useState<FitMode>('none');
  const [anchorX, setAnchorX] = useState<AnchorX>('center');
  const [anchorY, setAnchorY] = useState<AnchorY>('center');
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [viewerKey, setViewerKey] = useState(0);

  const activePreset =
    modelPresets.find(preset => preset.id === selectedPresetId) ?? modelPresets[0];

  const renderOptions = useMemo<Live2DRenderOptions>(
    () =>
      buildRenderOptions({
        fitMode,
        anchorX,
        anchorY,
        offsetX,
        offsetY,
        zoom
      }),
    [anchorX, anchorY, fitMode, offsetX, offsetY, zoom]
  );

  const usageSnippet = useMemo(
    () =>
      toCodeBlock({
        ...renderOptions,
        modelJsonPath
      }),
    [modelJsonPath, renderOptions]
  );
  const resolvedModelJsonPath = useMemo(
    () => resolveDemoAssetPath(modelJsonPath),
    [modelJsonPath]
  );
  const embeddedCoreScriptSrc = useMemo(
    () => resolveDemoAssetPath('/cubism/core/live2dcubismcore.min.js'),
    []
  );

  const handlePresetSelect = (preset: ModelPreset) => {
    setSelectedPresetId(preset.id);
    if (preset.modelJsonPath) {
      setModelJsonPath(preset.modelJsonPath);
      setViewerKey(value => value + 1);
      return;
    }

    if (preset.id === 'custom' && customModelJsonPath) {
      setModelJsonPath(customModelJsonPath);
      setViewerKey(value => value + 1);
    }
  };

  const applyCustomPath = () => {
    setSelectedPresetId('custom');
    setModelJsonPath(customModelJsonPath);
    setViewerKey(value => value + 1);
  };

  const resetPlayground = () => {
    setSelectedPresetId('hiyori');
    setModelJsonPath(defaultModelJsonPath);
    setFitMode('none');
    setAnchorX('center');
    setAnchorY('center');
    setOffsetX(0);
    setOffsetY(0);
    setZoom(1);
    setViewerKey(value => value + 1);
  };

  return (
    <main className="playground-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">live2d-react</p>
          <h1>Playground</h1>
          <p className="lede">
            Preview Live2D rendering in the browser, switch hosted models, and
            tune grounding controls until different characters share the same
            floor line.
          </p>
        </div>
      </section>

      <section className="playground-grid">
        <div className="viewer-column">
          <div className="code-card">
            <div className="panel-header">
              <div>
                <p className="section-kicker">Usage</p>
                <h2>Snippet</h2>
              </div>
            </div>
            <pre>{usageSnippet}</pre>
            <div className="snippet-actions">
              <button type="button" onClick={resetPlayground}>
                Reset Playground
              </button>
              <p>Restore the sample model and default controls.</p>
            </div>
          </div>

          <div className="viewer-card">
            <div className="viewer-header">
              <div>
                <p className="section-kicker">Live Preview</p>
                <h2>{activePreset.label}</h2>
              </div>
            </div>
            <div className="viewer-frame">
              <div className="ground-line" />
              <div className="viewer-stage">
                <Live2D
                  key={viewerKey}
                  modelJsonPath={resolvedModelJsonPath}
                  coreScriptSrc={embeddedCoreScriptSrc}
                  renderOptions={renderOptions}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="controls-column">
          <div className="controls-card">
            <div className="control-group">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Models</p>
                  <h2>Choose a model</h2>
                </div>
                <p>Pick Hiyori, Haru, or your own hosted model.</p>
              </div>
              <div className="preset-tabs">
                {modelPresets.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    className={
                      preset.id === selectedPresetId
                        ? 'preset-tab is-active'
                        : 'preset-tab'
                    }
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {selectedPresetId === 'custom' ? (
                <div className="custom-model-row">
                  <label>
                    <span>Custom model JSON path</span>
                    <input
                      value={customModelJsonPath}
                      onChange={event => setCustomModelJsonPath(event.target.value)}
                      placeholder="https://example.com/model.model3.json"
                    />
                  </label>
                  <button
                    type="button"
                    className="apply-button"
                    onClick={applyCustomPath}
                  >
                    Apply
                  </button>
                </div>
              ) : null}
            </div>

            <div className="control-group">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Alignment</p>
                  <h2>Grounding controls</h2>
                </div>
                <p>Place the model inside the stage.</p>
              </div>

              <label>
                <span>Fit mode</span>
                <select
                  value={fitMode}
                  onChange={event => setFitMode(event.target.value as FitMode)}
                >
                  {fitModes.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="inline-fields">
                <label>
                  <span>Anchor X</span>
                  <select
                    value={anchorX}
                    onChange={event => setAnchorX(event.target.value as AnchorX)}
                  >
                    {anchorXOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Anchor Y</span>
                  <select
                    value={anchorY}
                    onChange={event => setAnchorY(event.target.value as AnchorY)}
                  >
                    {anchorYOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="control-group">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Tuning</p>
                  <h2>Offsets and zoom</h2>
                </div>
                <p>Dial in the final pose after choosing the main fit strategy.</p>
              </div>
              <label>
                <span>Offset X: {offsetX.toFixed(2)}</span>
                <input
                  type="range"
                  min={-2}
                  max={2}
                  step={0.01}
                  value={offsetX}
                  onChange={event => setOffsetX(Number(event.target.value))}
                />
              </label>
              <label>
                <span>Offset Y: {offsetY.toFixed(2)}</span>
                <input
                  type="range"
                  min={-2}
                  max={2}
                  step={0.01}
                  value={offsetY}
                  onChange={event => setOffsetY(Number(event.target.value))}
                />
              </label>
              <label>
                <span>Zoom: {zoom.toFixed(2)}</span>
                <input
                  type="range"
                  min={0.2}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={event => setZoom(Number(event.target.value))}
                />
              </label>
            </div>

          </div>
        </div>
      </section>

      <section className="docs-grid">
        <article className="docs-card">
          <div className="panel-header">
            <div>
              <p className="section-kicker">Guide</p>
              <h2>Usage Guide</h2>
            </div>
            <p>Start from the basic setup, then add grounding controls only when you need them.</p>
          </div>

          <div className="docs-stack">
            <div className="doc-block">
              <h3>1. Install</h3>
              <pre>{installSnippet}</pre>
            </div>

            <div className="doc-block">
              <h3>2. Host your assets</h3>
              <ul className="docs-list">
                <li>Serve `live2dcubismcore.min.js` from your own app.</li>
                <li>Serve your model folder so the `.model3.json` and textures stay reachable.</li>
                <li>Use public URLs or same-origin paths that the browser can fetch directly.</li>
              </ul>
            </div>

            <div className="doc-block">
              <h3>3. Render a model</h3>
              <pre>{minimalUsageSnippet}</pre>
            </div>

            <div className="doc-block">
              <h3>4. Normalize multiple models</h3>
              <p className="doc-copy">
                A good starting point for keeping different characters on the same floor line is
                `fitMode: 'height'` with `anchorY: 'bottom'`, then small `offsetY` and `zoom`
                adjustments if needed.
              </p>
            </div>
          </div>
        </article>

        <article className="docs-card">
          <div className="panel-header">
            <div>
              <p className="section-kicker">Reference</p>
              <h2>API Reference</h2>
            </div>
            <p>The main API stays small. Most apps only need `modelJsonPath` and `coreScriptSrc`.</p>
          </div>

          <div className="api-section">
            <h3>`Live2D` props</h3>
            <dl className="api-list">
              {propDocs.map(item => (
                <div key={item.name} className="api-row">
                  <dt>{item.name}</dt>
                  <dd>{item.description}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="api-section">
            <h3>`renderOptions`</h3>
            <dl className="api-list">
              {renderOptionDocs.map(item => (
                <div key={item.name} className="api-row">
                  <dt>{item.name}</dt>
                  <dd>{item.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </article>
      </section>
    </main>
  );
}

export default App;
