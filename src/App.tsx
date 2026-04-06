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

const embeddedCoreScriptSrc = '/cubism/core/live2dcubismcore.min.js';
const usageCoreScriptSrc = '<Your Live2D Cubism Core Url>';
const defaultModelJsonPath = '/models/Hiyori/Hiyori.model3.json';
const fitModes: FitMode[] = ['none', 'contain', 'cover', 'width', 'height'];
const anchorXOptions: AnchorX[] = ['left', 'center', 'right'];
const anchorYOptions: AnchorY[] = ['top', 'center', 'bottom'];

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

function formatNumber(value: number) {
  return Number.parseFloat(value.toFixed(2)).toString();
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
                  modelJsonPath={modelJsonPath}
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
    </main>
  );
}

export default App;
