import type { CSSProperties, HTMLAttributes } from 'react';
import { useEffect, useRef, useState } from 'react';

import { ensureCubismCore } from './loadCubismCore';

export type Live2DProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  modelJsonPath: string;
  coreScriptSrc?: string;
  idleMotionGroup?: string;
  tapBodyMotionGroup?: string;
  headHitAreaName?: string;
  bodyHitAreaName?: string;
  canvasStyle?: CSSProperties;
};

type ViewerInstance = {
  mount(): Promise<void>;
  setModel(modelJsonPath: string): Promise<void>;
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
  ...rest
}: Live2DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<ViewerInstance | null>(null);
  const initialModelJsonPathRef = useRef(modelJsonPath);
  const [error, setError] = useState<string | null>(null);

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
          bodyHitAreaName
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
