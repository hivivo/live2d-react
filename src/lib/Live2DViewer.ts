import { CubismFramework, Option } from '../cubism/framework/live2dcubismframework';
import { CubismMatrix44 } from '../cubism/framework/math/cubismmatrix44';
import { CubismViewMatrix } from '../cubism/framework/math/cubismviewmatrix';
import { CubismWebGLOffscreenManager } from '../cubism/framework/rendering/cubismoffscreenmanager';

import * as LAppDefine from '../cubism/runtime/lappdefine';
import { LAppGlManager } from '../cubism/runtime/lappglmanager';
import { LAppModel } from '../cubism/runtime/lappmodel';
import { LAppPal } from '../cubism/runtime/lapppal';
import { LAppSubdelegate } from '../cubism/runtime/lappsubdelegate';
import { LAppTextureManager } from '../cubism/runtime/lapptexturemanager';
import { TouchManager } from '../cubism/runtime/touchmanager';
import { ensureCubismCore } from './loadCubismCore';
import type { Live2DRenderOptions } from './Live2D';
import { resolveLive2DModel } from './model';

type Live2DViewerOptions = {
  canvas: HTMLCanvasElement;
  coreScriptSrc: string;
  idleMotionGroup: string;
  tapBodyMotionGroup: string;
  headHitAreaName: string;
  bodyHitAreaName: string;
  renderOptions?: Live2DRenderOptions;
};

type ModelBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

let frameworkBooted = false;

function initializeFramework() {
  if (frameworkBooted) {
    return;
  }

  const option = new Option();
  option.logFunction = LAppPal.printMessage;
  option.loggingLevel = LAppDefine.CubismLoggingLevel;
  CubismFramework.startUp(option);
  CubismFramework.initialize();
  frameworkBooted = true;
}

export class Live2DViewer {
  private readonly canvas: HTMLCanvasElement;
  private readonly glManager = new LAppGlManager();
  private readonly textureManager = new LAppTextureManager();
  private readonly touchManager = new TouchManager();
  private readonly deviceToScreen = new CubismMatrix44();
  private readonly viewMatrix = new CubismViewMatrix();
  private readonly coreScriptSrc: string;
  private readonly idleMotionGroup: string;
  private readonly tapBodyMotionGroup: string;
  private readonly headHitAreaName: string;
  private readonly bodyHitAreaName: string;

  private host: LAppSubdelegate | null = null;
  private model: LAppModel | null = null;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private disposed = false;
  private renderOptions: Live2DRenderOptions | undefined;
  private rawModelMatrix: Float32Array | null = null;
  private logicalLeft = -1;
  private logicalRight = 1;
  private logicalTop = 1;
  private logicalBottom = -1;

  public constructor({
    canvas,
    coreScriptSrc,
    idleMotionGroup,
    tapBodyMotionGroup,
    headHitAreaName,
    bodyHitAreaName,
    renderOptions
  }: Live2DViewerOptions) {
    this.canvas = canvas;
    this.coreScriptSrc = coreScriptSrc;
    this.idleMotionGroup = idleMotionGroup;
    this.tapBodyMotionGroup = tapBodyMotionGroup;
    this.headHitAreaName = headHitAreaName;
    this.bodyHitAreaName = bodyHitAreaName;
    this.renderOptions = renderOptions;
    this.canvas.style.touchAction = 'none';
  }

  public async mount(): Promise<void> {
    await ensureCubismCore(this.coreScriptSrc);
    LAppDefine.setInteractionConfig({
      idleMotionGroup: this.idleMotionGroup,
      tapBodyMotionGroup: this.tapBodyMotionGroup,
      headHitAreaName: this.headHitAreaName,
      bodyHitAreaName: this.bodyHitAreaName
    });
    initializeFramework();

    if (!this.glManager.initialize(this.canvas)) {
      throw new Error('WebGL2 is required to render Live2D models.');
    }

    this.textureManager.setGlManager(this.glManager);
    this.host = new LAppSubdelegate(this.canvas, this.glManager, this.textureManager);

    const gl = this.glManager.getGl();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.bindEvents();
    this.resize();
    this.startLoop();
  }

  public async setModel(modelJsonPath: string): Promise<void> {
    if (this.disposed || !this.host) {
      return;
    }

    this.canvas.dataset.modelJsonPath = modelJsonPath;
    this.textureManager.releaseTextures();
    this.model?.release();
    this.rawModelMatrix = null;

    const nextModel = new LAppModel();
    nextModel.setSubdelegate(this.host);

    const resolvedModel = resolveLive2DModel({ modelJsonPath });
    nextModel.loadAssets(resolvedModel.modelDirUrl, resolvedModel.modelJsonFile);

    this.model = nextModel;
    this.resize();
  }

  public setRenderOptions(renderOptions?: Live2DRenderOptions): void {
    this.renderOptions = renderOptions;
    this.resize();
  }

  public dispose(): void {
    this.disposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointerleave', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);

    this.model?.release();
    this.model = null;
    this.textureManager.release();
    this.host = null;
  }

  private bindEvents() {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown, {
      passive: true
    });
    this.canvas.addEventListener('pointermove', this.handlePointerMove, {
      passive: true
    });
    this.canvas.addEventListener('pointerup', this.handlePointerUp, {
      passive: true
    });
    this.canvas.addEventListener('pointerleave', this.handlePointerUp, {
      passive: true
    });
    this.canvas.addEventListener('pointercancel', this.handlePointerUp, {
      passive: true
    });

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
  }

  private startLoop() {
    const render = () => {
      if (this.disposed) {
        return;
      }

      LAppPal.updateTime();
      this.draw();
      this.animationFrameId = requestAnimationFrame(render);
    };

    render();
  }

  private resize() {
    const width = Math.max(
      1,
      Math.floor(this.canvas.clientWidth * window.devicePixelRatio)
    );
    const height = Math.max(
      1,
      Math.floor(this.canvas.clientHeight * window.devicePixelRatio)
    );

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    const gl = this.glManager.getGl();
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    if (this.model) {
      this.model.setRenderTargetSize(width, height);
    }

    const ratio = width / height;
    const left = -ratio;
    const right = ratio;
    const bottom = LAppDefine.ViewLogicalLeft;
    const top = LAppDefine.ViewLogicalRight;

    this.logicalLeft = left;
    this.logicalRight = right;
    this.logicalBottom = bottom;
    this.logicalTop = top;

    this.viewMatrix.setScreenRect(left, right, bottom, top);
    this.viewMatrix.scale(LAppDefine.ViewScale, LAppDefine.ViewScale);
    this.viewMatrix.setMaxScale(LAppDefine.ViewMaxScale);
    this.viewMatrix.setMinScale(LAppDefine.ViewMinScale);
    this.viewMatrix.setMaxScreenRect(
      LAppDefine.ViewLogicalMaxLeft,
      LAppDefine.ViewLogicalMaxRight,
      LAppDefine.ViewLogicalMaxBottom,
      LAppDefine.ViewLogicalMaxTop
    );

    this.deviceToScreen.loadIdentity();
    if (width > height) {
      const screenWidth = Math.abs(right - left);
      this.deviceToScreen.scaleRelative(
        screenWidth / width,
        -screenWidth / width
      );
    } else {
      const screenHeight = Math.abs(top - bottom);
      this.deviceToScreen.scaleRelative(
        screenHeight / height,
        -screenHeight / height
      );
    }
    this.deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);
  }

  private draw() {
    const gl = this.glManager.getGl();
    if (gl.isContextLost()) {
      return;
    }

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearDepth(1.0);

    if (!this.model) {
      return;
    }

    this.applyRenderOptions();

    CubismWebGLOffscreenManager.getInstance().beginFrameProcess(gl);

    const projection = new CubismMatrix44();
    if (this.model.getModel()) {
      if (
        this.model.getModel().getCanvasWidth() > 1.0 &&
        this.canvas.width < this.canvas.height
      ) {
        projection.scale(1.0, this.canvas.width / this.canvas.height);
      } else {
        projection.scale(this.canvas.height / this.canvas.width, 1.0);
      }

      projection.multiplyByMatrix(this.viewMatrix);
    }

    this.model.update();
    this.model.draw(projection);

    CubismWebGLOffscreenManager.getInstance().endFrameProcess(gl);
    CubismWebGLOffscreenManager.getInstance().releaseStaleRenderTextures(gl);
  }

  private readonly handlePointerDown = (event: PointerEvent) => {
    const { x, y } = this.getLocalPoint(event);
    this.touchManager.touchesBegan(x, y);
  };

  private readonly handlePointerMove = (event: PointerEvent) => {
    const { x, y } = this.getLocalPoint(event);
    this.touchManager.touchesMoved(x, y);

    const viewX = this.transformViewX(this.touchManager.getX());
    const viewY = this.transformViewY(this.touchManager.getY());
    this.model?.setDragging(viewX, viewY);
  };

  private readonly handlePointerUp = (event: PointerEvent) => {
    if (!this.model) {
      return;
    }

    const { x, y } = this.getLocalPoint(event);
    this.model.setDragging(0, 0);

    const viewX = this.transformViewX(x);
    const viewY = this.transformViewY(y);

    if (this.model.hitTest(this.headHitAreaName, viewX, viewY)) {
      this.model.setRandomExpression();
      return;
    }

    if (this.model.hitTest(this.bodyHitAreaName, viewX, viewY)) {
      this.model.startRandomMotion(
        this.tapBodyMotionGroup,
        LAppDefine.PriorityNormal
      );
    }
  };

  private getLocalPoint(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * window.devicePixelRatio,
      y: (event.clientY - rect.top) * window.devicePixelRatio
    };
  }

  private transformViewX(deviceX: number): number {
    const screenX = this.deviceToScreen.transformX(deviceX);
    return this.viewMatrix.invertTransformX(screenX);
  }

  private transformViewY(deviceY: number): number {
    const screenY = this.deviceToScreen.transformY(deviceY);
    return this.viewMatrix.invertTransformY(screenY);
  }

  private applyRenderOptions() {
    if (!this.model?.isReadyToRender()) {
      return;
    }

    const modelMatrix = this.model.getModelMatrix();
    if (!modelMatrix) {
      return;
    }

    if (!this.rawModelMatrix) {
      this.rawModelMatrix = new Float32Array(modelMatrix.getArray());
    }

    modelMatrix.setMatrix(this.rawModelMatrix);
    this.applyDefaultModelFit(modelMatrix);

    if (!this.hasActiveRenderOptions()) {
      return;
    }

    const bounds = this.model.getDrawableBounds();
    if (!bounds) {
      return;
    }

    const baselineMatrix = new Float32Array(modelMatrix.getArray());
    const baseScaleX = baselineMatrix[0];
    const baseScaleY = baselineMatrix[5];
    const baseTranslateX = baselineMatrix[12];
    const baseTranslateY = baselineMatrix[13];
    const fitMode = this.renderOptions?.fitMode ?? 'none';
    const anchorX = this.renderOptions?.anchorX;
    const anchorY = this.renderOptions?.anchorY ?? 'center';
    const zoom = this.renderOptions?.zoom ?? 1;

    const baseBounds = this.transformBounds(bounds, modelMatrix);
    const fittedScale = this.getFitScale(baseBounds, fitMode);
    const scale = fittedScale * zoom;

    modelMatrix.scale(baseScaleX * scale, baseScaleY * scale);
    modelMatrix.translate(baseTranslateX, baseTranslateY);

    const scaledBounds = this.transformBounds(bounds, modelMatrix);
    modelMatrix.translate(
      baseTranslateX +
        (anchorX ? this.getHorizontalDelta(anchorX, scaledBounds) : 0) +
        (this.renderOptions?.offsetX ?? 0),
      baseTranslateY +
        this.getVerticalDelta(anchorY, scaledBounds) +
        (this.renderOptions?.offsetY ?? 0)
    );
  }

  private applyDefaultModelFit(modelMatrix: CubismMatrix44) {
    const currentModel = this.model;
    if (!currentModel?.getModel()) {
      return;
    }

    if (
      currentModel.getModel().getCanvasWidth() > 1.0 &&
      this.canvas.width < this.canvas.height
    ) {
      const currentModelMatrix = currentModel.getModelMatrix();
      currentModelMatrix.setWidth(2.0);
      modelMatrix.setMatrix(currentModelMatrix.getArray());
    }
  }

  private hasActiveRenderOptions(): boolean {
    return Boolean(
      this.renderOptions &&
        (this.renderOptions.fitMode ||
          this.renderOptions.anchorX ||
          this.renderOptions.anchorY ||
          this.renderOptions.offsetX !== undefined ||
          this.renderOptions.offsetY !== undefined ||
          this.renderOptions.zoom !== undefined)
    );
  }

  private transformBounds(bounds: ModelBounds, matrix: CubismMatrix44): ModelBounds {
    return {
      left: matrix.transformX(bounds.left),
      right: matrix.transformX(bounds.right),
      top: matrix.transformY(bounds.top),
      bottom: matrix.transformY(bounds.bottom)
    };
  }

  private getFitScale(
    bounds: ModelBounds,
    fitMode: NonNullable<Live2DRenderOptions['fitMode']>
  ) {
    if (fitMode === 'none') {
      return 1;
    }

    const width = Math.max(bounds.right - bounds.left, Number.EPSILON);
    const height = Math.max(bounds.top - bounds.bottom, Number.EPSILON);
    const availableWidth = this.logicalRight - this.logicalLeft;
    const availableHeight = this.logicalTop - this.logicalBottom;
    const scaleX = availableWidth / width;
    const scaleY = availableHeight / height;

    switch (fitMode) {
      case 'contain':
        return Math.min(scaleX, scaleY);
      case 'cover':
        return Math.max(scaleX, scaleY);
      case 'width':
        return scaleX;
      case 'height':
        return scaleY;
      default:
        return 1;
    }
  }

  private getHorizontalDelta(
    anchorX: NonNullable<Live2DRenderOptions['anchorX']>,
    bounds: ModelBounds
  ): number {
    switch (anchorX) {
      case 'left':
        return this.logicalLeft - bounds.left;
      case 'right':
        return this.logicalRight - bounds.right;
      case 'center':
      default:
        return (
          (this.logicalLeft + this.logicalRight) * 0.5 -
          (bounds.left + bounds.right) * 0.5
        );
    }
  }

  private getVerticalDelta(
    anchorY: NonNullable<Live2DRenderOptions['anchorY']>,
    bounds: ModelBounds
  ): number {
    switch (anchorY) {
      case 'top':
        return this.logicalTop - bounds.top;
      case 'bottom':
        return this.logicalBottom - bounds.bottom;
      case 'center':
      default:
        return (
          (this.logicalTop + this.logicalBottom) * 0.5 -
          (bounds.top + bounds.bottom) * 0.5
        );
    }
  }
}
