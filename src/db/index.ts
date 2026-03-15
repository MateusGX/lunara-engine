import { openDB, type IDBPDatabase } from "idb";
import type { Cartridge } from "@/types/cartridge";

const DB_NAME = "lunara";
const DB_VERSION = 1;
const STORE_NAME = "cartridges";

export type LunaraDB = IDBPDatabase<{
  cartridges: {
    key: string;
    value: Cartridge;
    indexes: { "meta.name": string };
  };
}>;

let _db: LunaraDB | null = null;

export async function getDb(): Promise<LunaraDB> {
  if (_db) return _db;
  _db = await openDB<{
    cartridges: {
      key: string;
      value: Cartridge;
      indexes: { "meta.name": string };
    };
  }>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: "meta.id",
      });
      store.createIndex("meta.name", "meta.name");
    },
  });
  return _db;
}
