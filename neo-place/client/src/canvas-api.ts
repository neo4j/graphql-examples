import type { PixelClickedCallback, PixelColor, PixelPosition } from "./types";

export class CanvasApi {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  onPixelClickedCallback: PixelClickedCallback;
  pixelScale: number;

  constructor(id: string, pixelScale: number) {
    this.canvas = document.getElementById(id) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.ctx.imageSmoothingEnabled = false;
    this.pixelScale = pixelScale;
    this.onPixelClickedCallback = () => {};
  }

  onPixelClicked(callback: PixelClickedCallback) {
    this.onPixelClickedCallback = callback;

    this.canvas.addEventListener(
      "click",
      (event) => this.onClick(event),
      false
    );
  }

  drawPixel(position: PixelPosition, color: PixelColor) {
    const x0 = position[0] * this.pixelScale;
    const y0 = position[1] * this.pixelScale;
    this.ctx.fillStyle = color;
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.fillRect(x0, y0, this.pixelScale, this.pixelScale);
  }

  onClick(event: MouseEvent) {
    const pixelClicked = this.getCanvasPixel([event.clientX, event.clientY]);
    this.onPixelClickedCallback(pixelClicked);
  }

  getCanvasPixel(screenPixel: PixelPosition): PixelPosition {
    const rect: DOMRect = this.canvas.getBoundingClientRect();
    const x = screenPixel[0] - rect.left;
    const y = screenPixel[1] - rect.top;

    return [Math.floor(x / this.pixelScale), Math.floor(y / this.pixelScale)];
  }

  grayscale() {
    this.ctx.filter = "grayscale(1)";
    this.ctx.drawImage(this.canvas, 0, 0);
  }
}
