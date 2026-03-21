/**
 * Renders a retro-style cartridge illustration onto a Canvas 2D context.
 * Cover art (data-URL) is drawn in the label area; falls back to a gradient
 * placeholder if absent or fails to load.
 */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

export async function renderCartridge(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  name: string,
  author: string,
  coverArt?: string,
): Promise<void> {
  const s = (n: number) => (n / 400) * w; // scale relative to 400 px base

  // Background
  ctx.fillStyle = "#0e0e1a";
  ctx.fillRect(0, 0, w, h);

  // Body
  const bx = s(24), by = s(24), bw = w - s(48), bh = h - s(48);
  ctx.fillStyle = "#1c1c30";
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, s(14));
  ctx.fill();
  ctx.strokeStyle = "#3a3a60";
  ctx.lineWidth = s(2);
  ctx.stroke();

  // Top badge
  ctx.fillStyle = "#5b21b6";
  ctx.beginPath();
  ctx.roundRect(bx + s(12), by + s(12), bw - s(24), s(28), s(4));
  ctx.fill();
  ctx.fillStyle = "#e5e7eb";
  ctx.font = `bold ${s(12)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LUNARA ENGINE", bx + bw / 2, by + s(26));

  // Art area
  const ax = bx + s(12), ay = by + s(52), aw = bw - s(24), ah = bh * 0.52;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(ax, ay, aw, ah, s(6));
  ctx.clip();

  let artDrawn = false;
  if (coverArt) {
    try {
      ctx.drawImage(await loadImage(coverArt), ax, ay, aw, ah);
      artDrawn = true;
    } catch { /* fall through to placeholder */ }
  }
  if (!artDrawn) {
    const g = ctx.createLinearGradient(ax, ay, ax + aw, ay + ah);
    g.addColorStop(0, "#1e1b4b");
    g.addColorStop(1, "#2e1065");
    ctx.fillStyle = g;
    ctx.fillRect(ax, ay, aw, ah);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.font = `bold ${s(15)}px monospace`;
    ctx.textBaseline = "middle";
    ctx.fillText(name.slice(0, 18), ax + aw / 2, ay + ah / 2);
  }
  ctx.restore();

  // Title
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f9fafb";
  ctx.font = `bold ${s(20)}px monospace`;
  let title = name;
  while (ctx.measureText(title).width > bw - s(24) && title.length > 1)
    title = title.slice(0, -1) + "…";
  ctx.fillText(title, bx + bw / 2, ay + ah + s(30));

  if (author) {
    ctx.fillStyle = "#818cf8";
    ctx.font = `${s(11)}px monospace`;
    ctx.fillText(author, bx + bw / 2, ay + ah + s(48));
  }
}
