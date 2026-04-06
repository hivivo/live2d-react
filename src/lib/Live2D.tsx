import type { CSSProperties, HTMLAttributes } from 'react';
import { useEffect, useRef, useState } from 'react';

import { ensureCubismCore } from './loadCubismCore';

export type Live2DRenderFitMode =
  | 'none'
  | 'contain'
  | 'cover'
  | 'width'
  | 'height';

export type Live2DHorizontalAnchor = 'left' | 'center' | 'right';
export type Live2DVerticalAnchor = 'top' | 'center' | 'bottom';

export type Live2DRenderOptions = {
  fitMode?: Live2DRenderFitMode;
  anchorX?: Live2DHorizontalAnchor;
  anchorY?: Live2DVerticalAnchor;
  offsetX?: number;
  offsetY?: number;
  zoom?: number;
};

export type Live2DProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  modelJsonPath: string;
  coreScriptSrc?: string;
  idleMotionGroup?: string;
  tapBodyMotionGroup?: string;
  headHitAreaName?: string;
  bodyHitAreaName?: string;
  canvasStyle?: CSSProperties;
  renderOptions?: Live2DRenderOptions;
};

type ViewerInstance = {
  mount(): Promise<void>;
  setModel(modelJsonPath: string): Promise<void>;
  setRenderOptions(renderOptions?: Live2DRenderOptions): void;
  dispose(): void;
};

export function Live2D({
  modelJsonPath,
  coreScriptSrc = '/cubism/core/live2dcubismcore.min.js',
  idleMotionGroup = 'Idle',
  tapBodyMotionGroup = 'TapBody',
  headHitAreaName = 'Head',
  bodyHitAreaName = 'Body',
  style,
  canvasStyle,
  renderOptions,
  ...rest
}: Live2DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<ViewerInstance | null>(null);
  const initialModelJsonPathRef = useRef(modelJsonPath);
  const latestRenderOptionsRef = useRef(renderOptions);
  const [error, setError] = useState<string | null>(null);

  latestRenderOptionsRef.current = renderOptions;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let cancelled = false;
    let viewer: ViewerInstance | null = null;

    ensureCubismCore(coreScriptSrc)
      .then(() => import('./Live2DViewer'))
      .then(({ Live2DViewer }) => {
        if (cancelled) {
          return null;
        }

        viewer = new Live2DViewer({
          canvas,
          coreScriptSrc,
          idleMotionGroup,
          tapBodyMotionGroup,
          headHitAreaName,
          bodyHitAreaName,
          renderOptions: latestRenderOptionsRef.current
        });
        viewerRef.current = viewer;

        return viewer.mount().then(() =>
          viewer?.setModel(initialModelJsonPathRef.current)
        );
      })
      .catch((mountError: unknown) => {
        if (!cancelled) {
          const message =
            mountError instanceof Error
              ? mountError.message
              : 'Failed to initialize the Live2D viewer.';
          setError(message);
        }
      });

    return () => {
      cancelled = true;
      viewer?.dispose();
      if (viewerRef.current === viewer && viewer) {
        viewerRef.current = null;
      }
    };
  }, [
    bodyHitAreaName,
    coreScriptSrc,
    headHitAreaName,
    idleMotionGroup,
    tapBodyMotionGroup
  ]);

  useEffect(() => {
    setError(null);
    viewerRef.current?.setModel(modelJsonPath).catch((nextError: unknown) => {
      const message =
        nextError instanceof Error
          ? nextError.message
          : 'Failed to switch Live2D model.';
      setError(message);
    });
  }, [modelJsonPath]);

  useEffect(() => {
    viewerRef.current?.setRenderOptions(renderOptions);
  }, [renderOptions]);

  return (
    <div
      {...rest}
      style={{
        position: 'relative',
        width: 320,
        height: 320,
        ...style
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          ...canvasStyle
        }}
      />
      {error ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            textAlign: 'center',
            color: '#f4f0ea',
            background: 'rgba(27, 23, 20, 0.82)',
            fontSize: 14,
            lineHeight: 1.5
          }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
