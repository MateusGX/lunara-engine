/**
 * Renders an RPG-styled cartridge illustration onto a Canvas 2D context.
 * Cover art (data-URL) is drawn in the label area; falls back to a gradient
 * placeholder with the game name if absent or fails to load.
 */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// RPG palette (mirrors index.css tokens)
const GOLD        = "#a259ef";
const GOLD_DIM    = "rgba(162,89,239,0.35)";
const GOLD_FAINT  = "rgba(162,89,239,0.12)";
const PARCHMENT   = "#ede8f7";
const STONE       = "#8c82a6";
const SURFACE_BASE   = "#0c0c12";
const SURFACE_CARD   = "#171720";
const SURFACE_RAISED = "#111119";

export async function renderCartridge(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  name: string,
  author: string,
  coverArt?: string,
): Promise<void> {
  const s = (n: number) => (n / 400) * w; // scale relative to 400 px base

  // ── Background ─────────────────────────────────────────────────────────────
  ctx.fillStyle = SURFACE_BASE;
  ctx.fillRect(0, 0, w, h);

  // ── Body (sharp corners — no roundRect) ───────────────────────────────────
  const bx = s(24), by = s(24), bw = w - s(48), bh = h - s(48);

  ctx.fillStyle = SURFACE_CARD;
  ctx.fillRect(bx, by, bw, bh);

  // Outer border
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = s(1.5);
  ctx.strokeRect(bx, by, bw, bh);

  // Inner inset line
  ctx.strokeStyle = GOLD_FAINT;
  ctx.lineWidth = s(1);
  ctx.strokeRect(bx + s(5), by + s(5), bw - s(10), bh - s(10));

  // ── Corner ornaments ───────────────────────────────────────────────────────
  const co = s(10); // ornament size
  const cw = s(1.5);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = cw;

  function corner(x: number, y: number, dx: number, dy: number) {
    ctx.beginPath();
    ctx.moveTo(x + dx * co, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * co);
    ctx.stroke();
  }
  corner(bx + s(4), by + s(4),  1,  1);
  corner(bx + bw - s(4), by + s(4), -1,  1);
  corner(bx + s(4), by + bh - s(4),  1, -1);
  corner(bx + bw - s(4), by + bh - s(4), -1, -1);

  // ── Top badge ──────────────────────────────────────────────────────────────
  const bdH = s(22);
  const bdX = bx + s(16), bdY = by + s(14), bdW = bw - s(32);

  // Badge fill
  ctx.fillStyle = GOLD_FAINT;
  ctx.fillRect(bdX, bdY, bdW, bdH);

  // Badge border
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = s(1);
  ctx.strokeRect(bdX, bdY, bdW, bdH);

  // Badge text
  ctx.fillStyle = GOLD;
  ctx.font = `bold ${s(10)}px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = `${s(2)}px`;
  ctx.fillText("✦  LUNARA ENGINE  ✦", bx + bw / 2, bdY + bdH / 2);
  ctx.letterSpacing = "0px";

  // ── Art area ───────────────────────────────────────────────────────────────
  const ax = bx + s(16), ay = by + s(48), aw = bw - s(32), ah = bh * 0.50;

  ctx.save();
  ctx.beginPath();
  ctx.rect(ax, ay, aw, ah);
  ctx.clip();

  let artDrawn = false;
  if (coverArt) {
    try {
      ctx.drawImage(await loadImage(coverArt), ax, ay, aw, ah);
      artDrawn = true;
    } catch { /* fall through to placeholder */ }
  }

  if (!artDrawn) {
    // Dark gradient background
    const g = ctx.createLinearGradient(ax, ay, ax + aw, ay + ah);
    g.addColorStop(0, "#0e0e1a");
    g.addColorStop(1, "#141422");
    ctx.fillStyle = g;
    ctx.fillRect(ax, ay, aw, ah);

    // Ambient gold glow in center
    const glow = ctx.createRadialGradient(ax + aw / 2, ay + ah / 2, 0, ax + aw / 2, ay + ah / 2, aw * 0.45);
    glow.addColorStop(0, "rgba(162,89,239,0.10)");
    glow.addColorStop(1, "rgba(162,89,239,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(ax, ay, aw, ah);

    // Placeholder name text
    ctx.fillStyle = "rgba(162,89,239,0.30)";
    ctx.font = `bold ${s(14)}px "JetBrains Mono", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    let label = name.slice(0, 20);
    while (ctx.measureText(label).width > aw - s(16) && label.length > 1)
      label = label.slice(0, -1) + "…";
    ctx.fillText(label, ax + aw / 2, ay + ah / 2);
  }

  ctx.restore();

  // Art border
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = s(1);
  ctx.strokeRect(ax, ay, aw, ah);

  // ── Horizontal divider below art ──────────────────────────────────────────
  const divY = ay + ah + s(10);
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = s(1);
  ctx.beginPath();
  ctx.moveTo(bx + s(20), divY);
  ctx.lineTo(bx + bw - s(20), divY);
  ctx.stroke();

  // Diamond decorations on divider
  const diamond = (x: number, y: number) => {
    const r = s(3);
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fill();
  };
  diamond(bx + s(20), divY);
  diamond(bx + bw - s(20), divY);

  // ── Title ──────────────────────────────────────────────────────────────────
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  ctx.fillStyle = PARCHMENT;
  ctx.font = `bold ${s(18)}px "JetBrains Mono", monospace`;

  let title = name;
  while (ctx.measureText(title).width > bw - s(32) && title.length > 1)
    title = title.slice(0, -1) + "…";
  ctx.fillText(title, bx + bw / 2, divY + s(22));

  // ── Author ─────────────────────────────────────────────────────────────────
  if (author) {
    ctx.fillStyle = STONE;
    ctx.font = `${s(10)}px "JetBrains Mono", monospace`;
    ctx.letterSpacing = `${s(1)}px`;
    ctx.fillText(author.toUpperCase(), bx + bw / 2, divY + s(38));
    ctx.letterSpacing = "0px";
  }

  // ── Bottom connector notch ────────────────────────────────────────────────
  const nw = s(80), nh = s(10);
  const nx = bx + (bw - nw) / 2, ny = by + bh - s(2);
  ctx.fillStyle = SURFACE_RAISED;
  ctx.fillRect(nx, ny, nw, nh);
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = s(1);
  ctx.strokeRect(nx, ny, nw, nh);
}
