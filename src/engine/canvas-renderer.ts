import type { HardwareConfig, SpriteData, MapData } from "@/types/cartridge";

// 5×7 bitmap font, ASCII 32-126
// Each character = 7 rows of 5 bits packed into a number
const FONT_DATA: Record<number, number[]> = {
  32: [0, 0, 0, 0, 0, 0, 0], // space
  65: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001], // A
  66: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110], // B
  67: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110], // C
  68: [0b11100, 0b10010, 0b10001, 0b10001, 0b10001, 0b10010, 0b11100], // D
  69: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111], // E
  70: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000], // F
  71: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110], // G
  72: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001], // H
  73: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110], // I
  74: [0b00001, 0b00001, 0b00001, 0b00001, 0b00001, 0b10001, 0b01110], // J
  75: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001], // K
  76: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111], // L
  77: [0b10001, 0b11011, 0b10101, 0b10001, 0b10001, 0b10001, 0b10001], // M
  78: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001], // N
  79: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110], // O
  80: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000], // P
  81: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101], // Q
  82: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001], // R
  83: [0b01110, 0b10001, 0b10000, 0b01110, 0b00001, 0b10001, 0b01110], // S
  84: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100], // T
  85: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110], // U
  86: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100], // V
  87: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001], // W
  88: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001], // X
  89: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100], // Y
  90: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111], // Z
  97: [0b00000, 0b00000, 0b01110, 0b00001, 0b01111, 0b10001, 0b01111], // a
  98: [0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b10001, 0b11110], // b
  99: [0b00000, 0b00000, 0b01110, 0b10000, 0b10000, 0b10001, 0b01110], // c
  100: [0b00001, 0b00001, 0b01111, 0b10001, 0b10001, 0b10001, 0b01111], // d
  101: [0b00000, 0b00000, 0b01110, 0b10001, 0b11111, 0b10000, 0b01110], // e
  102: [0b00110, 0b01001, 0b01000, 0b11100, 0b01000, 0b01000, 0b01000], // f
  103: [0b00000, 0b01111, 0b10001, 0b10001, 0b01111, 0b00001, 0b01110], // g
  104: [0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b10001, 0b10001], // h
  105: [0b00100, 0b00000, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100], // i
  106: [0b00010, 0b00000, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100], // j
  107: [0b10000, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001], // k
  108: [0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110], // l
  109: [0b00000, 0b00000, 0b11010, 0b10101, 0b10101, 0b10001, 0b10001], // m
  110: [0b00000, 0b00000, 0b11110, 0b10001, 0b10001, 0b10001, 0b10001], // n
  111: [0b00000, 0b00000, 0b01110, 0b10001, 0b10001, 0b10001, 0b01110], // o
  112: [0b00000, 0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000], // p
  113: [0b00000, 0b01111, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001], // q
  114: [0b00000, 0b00000, 0b10110, 0b11001, 0b10000, 0b10000, 0b10000], // r
  115: [0b00000, 0b00000, 0b01110, 0b10000, 0b01110, 0b00001, 0b11110], // s
  116: [0b01000, 0b01000, 0b11100, 0b01000, 0b01000, 0b01001, 0b00110], // t
  117: [0b00000, 0b00000, 0b10001, 0b10001, 0b10001, 0b10001, 0b01111], // u
  118: [0b00000, 0b00000, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100], // v
  119: [0b00000, 0b00000, 0b10001, 0b10001, 0b10101, 0b10101, 0b01010], // w
  120: [0b00000, 0b00000, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001], // x
  121: [0b00000, 0b10001, 0b10001, 0b01111, 0b00001, 0b10001, 0b01110], // y
  122: [0b00000, 0b00000, 0b11111, 0b00010, 0b00100, 0b01000, 0b11111], // z
  48: [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110], // 0
  49: [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110], // 1
  50: [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111], // 2
  51: [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110], // 3
  52: [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010], // 4
  53: [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110], // 5
  54: [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110], // 6
  55: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000], // 7
  56: [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110], // 8
  57: [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100], // 9
  46: [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00110, 0b00110], // .
  44: [0b00000, 0b00000, 0b00000, 0b00000, 0b00110, 0b00100, 0b01000], // ,
  58: [0b00000, 0b00110, 0b00110, 0b00000, 0b00110, 0b00110, 0b00000], // :
  33: [0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100, 0b00000], // !
  63: [0b01110, 0b10001, 0b00001, 0b00110, 0b00100, 0b00000, 0b00100], // ?
  45: [0b00000, 0b00000, 0b00000, 0b11111, 0b00000, 0b00000, 0b00000], // -
  43: [0b00000, 0b00100, 0b00100, 0b11111, 0b00100, 0b00100, 0b00000], // +
  61: [0b00000, 0b00000, 0b11111, 0b00000, 0b11111, 0b00000, 0b00000], // =
  40: [0b00010, 0b00100, 0b01000, 0b01000, 0b01000, 0b00100, 0b00010], // (
  41: [0b01000, 0b00100, 0b00010, 0b00010, 0b00010, 0b00100, 0b01000], // )
  47: [0b00001, 0b00010, 0b00100, 0b00100, 0b01000, 0b10000, 0b00000], // /
  95: [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b11111], // _
  60: [0b00010, 0b00100, 0b01000, 0b10000, 0b01000, 0b00100, 0b00010], // <
  62: [0b01000, 0b00100, 0b00010, 0b00001, 0b00010, 0b00100, 0b01000], // >
};

const CHAR_W = 5;
const CHAR_H = 7;

function getCharBitmap(code: number): number[] {
  return FONT_DATA[code] ?? FONT_DATA[63] ?? new Array(7).fill(0);
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hw: HardwareConfig;
  private sprites: SpriteData[];
  private maps: MapData[];

  private pixelBuffer: Uint8Array;
  private imageData: ImageData;
  private rgbaPalette: Uint8ClampedArray; // palette.length * 4

  private paletteMap: Uint8Array; // 256 → 256 remap
  private transparent: Uint8Array; // 256, bool

  private camX = 0;
  private camY = 0;

  constructor(
    canvas: HTMLCanvasElement,
    hw: HardwareConfig,
    sprites: SpriteData[],
    maps: MapData[],
  ) {
    this.canvas = canvas;
    this.hw = hw;
    this.sprites = sprites;
    this.maps = maps;

    canvas.width = hw.width;
    canvas.height = hw.height;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;

    this.pixelBuffer = new Uint8Array(hw.width * hw.height);
    this.imageData = this.ctx.createImageData(hw.width, hw.height);
    this.rgbaPalette = this.buildRgbaPalette(hw.palette);
    this.paletteMap = new Uint8Array(256).map((_, i) => i);
    this.transparent = new Uint8Array(256);
    this.transparent[0] = 1; // color 0 is transparent by default
  }

  private buildRgbaPalette(palette: string[]): Uint8ClampedArray {
    const arr = new Uint8ClampedArray(palette.length * 4);
    for (let i = 0; i < palette.length; i++) {
      const hex = palette[i].replace("#", "");
      arr[i * 4 + 0] = parseInt(hex.slice(0, 2), 16);
      arr[i * 4 + 1] = parseInt(hex.slice(2, 4), 16);
      arr[i * 4 + 2] = parseInt(hex.slice(4, 6), 16);
      arr[i * 4 + 3] = 255;
    }
    return arr;
  }

  updateAssets(sprites: SpriteData[], maps: MapData[]) {
    this.sprites = sprites;
    this.maps = maps;
  }

  updateHardware(hw: HardwareConfig) {
    this.hw = hw;
    this.canvas.width = hw.width;
    this.canvas.height = hw.height;
    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.pixelBuffer = new Uint8Array(hw.width * hw.height);
    this.imageData = this.ctx.createImageData(hw.width, hw.height);
    this.rgbaPalette = this.buildRgbaPalette(hw.palette);
  }

  resetState() {
    this.paletteMap = new Uint8Array(256).map((_, i) => i);
    this.transparent = new Uint8Array(256);
    this.transparent[0] = 1;
    this.camX = 0;
    this.camY = 0;
  }

  private pset_raw(x: number, y: number, c: number) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= this.hw.width || y < 0 || y >= this.hw.height) return;
    this.pixelBuffer[y * this.hw.width + x] = c & 0xff;
  }

  // ---- Public API (called from Lua) ----

  cls(c = 0) {
    this.pixelBuffer.fill(c & 0xff);
  }

  pset(x: number, y: number, c: number) {
    this.pset_raw(x - this.camX, y - this.camY, c);
  }

  pget(x: number, y: number): number {
    x = Math.floor(x) - this.camX;
    y = Math.floor(y) - this.camY;
    if (x < 0 || x >= this.hw.width || y < 0 || y >= this.hw.height) return 0;
    return this.pixelBuffer[y * this.hw.width + x];
  }

  line(x0: number, y0: number, x1: number, y1: number, c: number) {
    x0 = Math.floor(x0 - this.camX);
    y0 = Math.floor(y0 - this.camY);
    x1 = Math.floor(x1 - this.camX);
    y1 = Math.floor(y1 - this.camY);
    let dx = Math.abs(x1 - x0),
      sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0),
      sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      this.pset_raw(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  rect(x: number, y: number, w: number, h: number, c: number) {
    const x0 = Math.floor(x - this.camX);
    const y0 = Math.floor(y - this.camY);
    const x1 = x0 + Math.floor(w) - 1;
    const y1 = y0 + Math.floor(h) - 1;
    this.line(x0, y0 + this.camY, x1, y0 + this.camY, c);
    this.line(x0, y1 + this.camY, x1, y1 + this.camY, c);
    this.line(x0 + this.camX, y0, x0 + this.camX, y1, c);
    this.line(x1 + this.camX, y0, x1 + this.camX, y1, c);
  }

  rectfill(x: number, y: number, w: number, h: number, c: number) {
    const x0 = Math.floor(x - this.camX);
    const y0 = Math.floor(y - this.camY);
    const x1 = x0 + Math.floor(w);
    const y1 = y0 + Math.floor(h);
    for (let py = y0; py < y1; py++)
      for (let px = x0; px < x1; px++) this.pset_raw(px, py, c);
  }

  circ(x: number, y: number, r: number, c: number) {
    x = Math.floor(x - this.camX);
    y = Math.floor(y - this.camY);
    r = Math.floor(r);
    let dx = r,
      dy = 0,
      err = 0;
    while (dx >= dy) {
      this.pset_raw(x + dx, y + dy, c);
      this.pset_raw(x - dx, y + dy, c);
      this.pset_raw(x + dx, y - dy, c);
      this.pset_raw(x - dx, y - dy, c);
      this.pset_raw(x + dy, y + dx, c);
      this.pset_raw(x - dy, y + dx, c);
      this.pset_raw(x + dy, y - dx, c);
      this.pset_raw(x - dy, y - dx, c);
      dy++;
      if (err <= 0) {
        err += 2 * dy + 1;
      } else {
        dx--;
        err += 2 * (dy - dx) + 1;
      }
    }
  }

  circfill(x: number, y: number, r: number, c: number) {
    x = Math.floor(x - this.camX);
    y = Math.floor(y - this.camY);
    r = Math.floor(r);
    for (let py = -r; py <= r; py++)
      for (let px = -r; px <= r; px++)
        if (px * px + py * py <= r * r) this.pset_raw(x + px, y + py, c);
  }

  spr(n: number, sx: number, sy: number, sw = 1, sh = 1) {
    const spritesPerRow = 16;
    sx = Math.floor(sx - this.camX);
    sy = Math.floor(sy - this.camY);
    for (let ty = 0; ty < sh; ty++) {
      for (let tx = 0; tx < sw; tx++) {
        const sprId = n + ty * spritesPerRow + tx;
        const sprite = this.sprites[sprId];
        if (!sprite) continue;
        const destX = sx + tx * sprite.width;
        const destY = sy + ty * sprite.height;
        for (let py = 0; py < sprite.height; py++) {
          for (let px = 0; px < sprite.width; px++) {
            const col = sprite.pixels[py * sprite.width + px];
            if (this.transparent[col]) continue;
            const mapped = this.paletteMap[col];
            this.pset_raw(destX + px, destY + py, mapped);
          }
        }
      }
    }
  }

  map(
    tx: number,
    ty: number,
    sx: number,
    sy: number,
    tw: number,
    th: number,
    mapId = 0,
  ) {
    const m = this.maps[mapId];
    if (!m) return;
    for (let row = 0; row < th; row++) {
      for (let col = 0; col < tw; col++) {
        const tileX = tx + col;
        const tileY = ty + row;
        const sprId = m.tiles[`${tileX},${tileY}`];
        if (sprId === undefined || sprId < 0) continue;
        const sprite = this.sprites[sprId];
        if (!sprite) continue;
        this.spr(
          sprId,
          sx + col * sprite.width + this.camX,
          sy + row * sprite.height + this.camY,
        );
      }
    }
  }

  print(str: string, px: number, py: number, c: number) {
    px = Math.floor(px - this.camX);
    py = Math.floor(py - this.camY);
    let cx = px;
    let cy = py;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code === 10) {
        cy += CHAR_H + 1;
        cx = px;
        continue;
      }
      const bitmap = getCharBitmap(code);
      for (let row = 0; row < CHAR_H; row++) {
        const bits = bitmap[row] ?? 0;
        for (let bit = 0; bit < CHAR_W; bit++) {
          if (bits & (1 << (CHAR_W - 1 - bit))) {
            this.pset_raw(cx + bit, cy + row, c);
          }
        }
      }
      cx += CHAR_W + 1;
    }
    // cursor tracks end of last print (available for future use)
    void cx;
    void cy;
  }

  cursor(_x: number, _y: number) {
    // Cursor position tracking for future use
  }

  camera(x: number, y: number) {
    this.camX = Math.floor(x);
    this.camY = Math.floor(y);
  }

  pal(c0: number, c1: number) {
    this.paletteMap[c0 & 0xff] = c1 & 0xff;
  }

  palt(c: number, t: boolean) {
    this.transparent[c & 0xff] = t ? 1 : 0;
  }

  flush() {
    const data = this.imageData.data;
    const buf = this.pixelBuffer;
    const rgba = this.rgbaPalette;
    const palLen = this.hw.palette.length;
    const len = buf.length;
    for (let i = 0; i < len; i++) {
      let col = this.paletteMap[buf[i]] % palLen;
      data[i * 4 + 0] = rgba[col * 4 + 0];
      data[i * 4 + 1] = rgba[col * 4 + 1];
      data[i * 4 + 2] = rgba[col * 4 + 2];
      data[i * 4 + 3] = 255;
    }
    this.ctx.putImageData(this.imageData, 0, 0);
  }
}
