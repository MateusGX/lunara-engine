import { api } from "../engine-lua-api";
import type { ApiRegistrationContext } from "./types";

export function registerDrawingApi(ctx: ApiRegistrationContext): void {
  const { L, process, renderer: r, opts } = ctx;

  // ── Drawing API ───────────────────────────────────────────────────────────
  L.set(api.cls.label, (col = 0) => {
    process(api.cls.cost(opts.screenPixels));
    r.cls(col);
  });
  L.set(api.pset.label, (x: number, y: number, col: number) => {
    process(api.pset.cost());
    r.pset(x, y, col);
  });
  L.set(api.pget.label, (x: number, y: number) => {
    process(api.pget.cost());
    return r.pget(x, y);
  });
  L.set(
    api.line.label,
    (x0: number, y0: number, x1: number, y1: number, col: number) => {
      process(api.line.cost(x0, y0, x1, y1));
      r.line(x0, y0, x1, y1, col);
    },
  );
  L.set(
    api.rect.label,
    (x: number, y: number, w: number, h: number, col: number) => {
      process(api.rect.cost(w, h));
      r.rect(x, y, w, h, col);
    },
  );
  L.set(
    api.rectfill.label,
    (x: number, y: number, w: number, h: number, col: number) => {
      process(api.rectfill.cost(w, h));
      r.rectfill(x, y, w, h, col);
    },
  );
  L.set(api.circ.label, (x: number, y: number, rad: number, col: number) => {
    process(api.circ.cost(rad));
    r.circ(x, y, rad, col);
  });
  L.set(
    api.circfill.label,
    (x: number, y: number, rad: number, col: number) => {
      process(api.circfill.cost(rad));
      r.circfill(x, y, rad, col);
    },
  );
  L.set(api.spr.label, (n: number, x: number, y: number, sw = 1, sh = 1) => {
    const s = opts.getSprite(n);
    if (!s) throw new Error(`spr(): sprite ${n} not found`);
    process(api.spr.cost(sw, sh, s.width, s.height));
    r.spr(n, x, y, sw, sh);
  });
  L.set(
    api.map.label,
    (
      tx: number,
      ty: number,
      sx: number,
      sy: number,
      tw: number,
      th: number,
      mapId = 0,
    ) => {
      process(api.map.cost(tw, th, opts.spriteSize));
      r.map(tx, ty, sx, sy, tw, th, mapId);
    },
  );

  // ── Text API ──────────────────────────────────────────────────────────────
  L.set(
    api.print.label,
    (str: unknown, x: number, y: number, col: number) => {
      const s = String(str);
      process(api.print.cost(s));
      r.print(s, x, y, col);
    },
  );
  L.set(api.cursor.label, (x: number, y: number) => {
    process(api.cursor.cost());
    r.cursor(x, y);
  });
}
