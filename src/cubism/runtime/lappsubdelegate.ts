import { LAppGlManager } from './lappglmanager';
import { LAppTextureManager } from './lapptexturemanager';

export class LAppSubdelegate {
  private readonly canvas: HTMLCanvasElement;
  private readonly glManager: LAppGlManager;
  private readonly textureManager: LAppTextureManager;
  private readonly frameBuffer: WebGLFramebuffer | null;

  public constructor(
    canvas: HTMLCanvasElement,
    glManager: LAppGlManager,
    textureManager: LAppTextureManager
  ) {
    this.canvas = canvas;
    this.glManager = glManager;
    this.textureManager = textureManager;

    const gl = this.glManager.getGl();
    this.frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getGlManager(): LAppGlManager {
    return this.glManager;
  }

  public getTextureManager(): LAppTextureManager {
    return this.textureManager;
  }

  public getFrameBuffer(): WebGLFramebuffer | null {
    return this.frameBuffer;
  }
}
