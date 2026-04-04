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
import { resolveLive2DModel } from './model';

type Live2DViewerOptions = {
  canvas: HTMLCanvasElement;
  coreScriptSrc: string;
  idleMotionGroup: string;
  tapBodyMotionGroup: string;
  headHitAreaName: string;
  bodyHitAreaName: string;
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

  public constructor({
    canvas,
    coreScriptSrc,
    idleMotionGroup,
    tapBodyMotionGroup,
    headHitAreaName,
    bodyHitAreaName
  }: Live2DViewerOptions) {
    this.canvas = canvas;
    this.coreScriptSrc = coreScriptSrc;
    this.idleMotionGroup = idleMotionGroup;
    this.tapBodyMotionGroup = tapBodyMotionGroup;
    this.headHitAreaName = headHitAreaName;
    this.bodyHitAreaName = bodyHitAreaName;
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

    const nextModel = new LAppModel();
    nextModel.setSubdelegate(this.host);

    const resolvedModel = resolveLive2DModel({ modelJsonPath });
    nextModel.loadAssets(resolvedModel.modelDirUrl, resolvedModel.modelJsonFile);

    this.model = nextModel;
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

    CubismWebGLOffscreenManager.getInstance().beginFrameProcess(gl);

    const projection = new CubismMatrix44();
    if (this.model.getModel()) {
      if (
        this.model.getModel().getCanvasWidth() > 1.0 &&
        this.canvas.width < this.canvas.height
      ) {
        this.model.getModelMatrix().setWidth(2.0);
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
}
