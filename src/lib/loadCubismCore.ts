let cubismCorePromise: Promise<void> | null = null;

export function isCubismCoreLoaded(): boolean {
  return typeof window !== 'undefined' && Boolean(window.Live2DCubismCore);
}

export async function ensureCubismCore(coreScriptSrc: string): Promise<void> {
  if (isCubismCoreLoaded()) {
    return;
  }

  if (cubismCorePromise) {
    return cubismCorePromise;
  }

  cubismCorePromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-live2d-react-cubism-core="${coreScriptSrc}"]`
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error(`Failed to load Cubism Core from ${coreScriptSrc}.`)),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = coreScriptSrc;
    script.async = true;
    script.dataset.live2dReactCubismCore = coreScriptSrc;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener(
      'error',
      () => reject(new Error(`Failed to load Cubism Core from ${coreScriptSrc}.`)),
      { once: true }
    );
    document.head.appendChild(script);
  }).finally(() => {
    if (!isCubismCoreLoaded()) {
      cubismCorePromise = null;
    }
  });

  return cubismCorePromise;
}
