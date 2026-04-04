export type Live2DModelSource = {
  modelJsonPath: string;
};

export type ResolvedLive2DModel = {
  modelDirUrl: string;
  modelJsonFile: string;
};

export function resolveLive2DModel(
  source: Live2DModelSource
): ResolvedLive2DModel {
  const { modelJsonPath } = source;
  const lastSlashIndex = modelJsonPath.lastIndexOf('/');

  if (lastSlashIndex === -1) {
    return {
      modelDirUrl: './',
      modelJsonFile: modelJsonPath
    };
  }

  return {
    modelDirUrl: `${modelJsonPath.slice(0, lastSlashIndex + 1)}`,
    modelJsonFile: modelJsonPath.slice(lastSlashIndex + 1)
  };
}
