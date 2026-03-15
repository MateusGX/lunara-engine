import { getDb } from "./index";
import type { Cartridge } from "@/types/cartridge";

const STORE = "cartridges";

export async function getAll(): Promise<Cartridge[]> {
  const db = await getDb();
  return db.getAll(STORE);
}

export async function get(id: string): Promise<Cartridge | undefined> {
  const db = await getDb();
  return db.get(STORE, id);
}

export async function save(cartridge: Cartridge): Promise<void> {
  const db = await getDb();
  await db.put(STORE, cartridge);
}

export async function remove(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}
