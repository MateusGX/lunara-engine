/** LSB steganography: 2 bits per R/G/B channel → 6 bits/pixel. */

export const MAGIC = new Uint8Array([0x4c, 0x55, 0x4e, 0x58]); // "LUNX"

export function encode(px: Uint8ClampedArray, payload: Uint8Array): void {
  let b = 0;
  const total = payload.length * 8;
  for (let i = 0; i < px.length / 4 && b < total; i++) {
    for (let c = 0; c < 3 && b < total; c++) {
      let bits = 0;
      for (let k = 1; k >= 0; k--)
        bits |= ((payload[b >> 3] >> (7 - (b++ & 7))) & 1) << k;
      px[i * 4 + c] = (px[i * 4 + c] & 0xfc) | bits;
    }
  }
}

export function decode(px: Uint8ClampedArray, bytes: number): Uint8Array {
  const out = new Uint8Array(bytes);
  let b = 0;
  for (let i = 0; i < px.length / 4 && b < bytes * 8; i++) {
    for (let c = 0; c < 3 && b < bytes * 8; c++) {
      const bits = px[i * 4 + c] & 0x03;
      for (let k = 1; k >= 0 && b < bytes * 8; k--)
        out[b >> 3] |= ((bits >> k) & 1) << (7 - (b++ & 7));
    }
  }
  return out;
}

/** Wraps JSON in the LUNX envelope and encodes it into `px`. */
export function encodeJSON(px: Uint8ClampedArray, json: Uint8Array): void {
  const payload = new Uint8Array(8 + json.length);
  payload.set(MAGIC);
  new DataView(payload.buffer).setUint32(4, json.length, false);
  payload.set(json, 8);
  encode(px, payload);
}

/** Extracts JSON bytes from `px`, or returns null if magic doesn't match. */
export function decodeJSON(px: Uint8ClampedArray): Uint8Array | null {
  const header = decode(px, 8);
  if (header[0] !== MAGIC[0] || header[1] !== MAGIC[1] ||
      header[2] !== MAGIC[2] || header[3] !== MAGIC[3]) return null;
  const len = new DataView(header.buffer).getUint32(4, false);
  if (len === 0 || len > 8 * 1024 * 1024) return null;
  return decode(px, 8 + len).slice(8);
}
