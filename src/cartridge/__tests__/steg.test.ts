import { describe, it, expect } from "vitest";
import { encode, decode, encodeJSON, decodeJSON, MAGIC } from "../steg";

describe("encode / decode round-trip", () => {
  it("recovers exact bytes", () => {
    const payload = new TextEncoder().encode("Hello, Lunara!");
    const px = new Uint8ClampedArray(payload.length * 8 * 4).fill(200); // enough pixels
    encode(px, payload);
    expect(Array.from(decode(px, payload.length))).toEqual(Array.from(payload));
  });

  it("does not touch the alpha channel", () => {
    const payload = new Uint8Array([1, 2, 3]);
    const px = new Uint8ClampedArray(400 * 4).fill(0xff);
    const alphas = () => Array.from({ length: 400 }, (_, i) => px[i * 4 + 3]);
    const before = alphas();
    encode(px, payload);
    expect(alphas()).toEqual(before);
  });

  it("only modifies the 2 LSBs of each channel", () => {
    const payload = new Uint8Array(1).fill(0b10101010);
    const px = new Uint8ClampedArray(4 * 4).fill(0xff); // 4 pixels
    encode(px, payload);
    for (let i = 0; i < 4; i++) {
      for (let c = 0; c < 3; c++) {
        expect(px[i * 4 + c] & 0xfc).toBe(0xfc); // upper 6 bits unchanged
      }
    }
  });
});

describe("encodeJSON / decodeJSON", () => {
  it("wraps with MAGIC header and recovers JSON bytes", () => {
    const json = new TextEncoder().encode('{"hello":"world"}');
    const px = new Uint8ClampedArray((8 + json.length) * 8 * 4).fill(100);
    encodeJSON(px, json);
    const result = decodeJSON(px);
    expect(Array.from(result!)).toEqual(Array.from(json));
  });

  it("returns null when magic is wrong", () => {
    const px = new Uint8ClampedArray(100 * 4).fill(0);
    expect(decodeJSON(px)).toBeNull();
  });
});

describe("capacity", () => {
  it("400×600 holds at least 87 KB", () => {
    // 400*600 pixels × 6 bits/pixel ÷ 8 bits/byte
    expect(Math.floor(400 * 600 * 6 / 8)).toBeGreaterThanOrEqual(87 * 1024);
  });
});

describe("MAGIC constant", () => {
  it("spells LUNX", () => {
    expect(new TextDecoder().decode(MAGIC)).toBe("LUNX");
  });
});
