import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type FolderId = "personal" | "client" | "commission" | "fun";

export const FOLDERS: Array<{ id: FolderId; label: string }> = [
  { id: "personal", label: "Personal" },
  { id: "client", label: "Client Work" },
  { id: "commission", label: "Commission Work" },
  { id: "fun", label: "Fun" },
];

export interface Swatch {
  hex: string;
  name?: string;
  addedAt: number;
}

export interface GradientStop {
  hex: string;
  position: number; // 0..1
}

export interface Gradient {
  type: "linear" | "radial";
  angle: number; // degrees, 0..360
  stops: GradientStop[];
}

export interface FontPairing {
  pairId: string;
  headingFamily: string;
  headingWeight: number;
  bodyFamily: string;
  bodyWeight: number;
}

export interface Stash {
  id: string;
  name: string;
  folder: FolderId;
  swatches: Swatch[];
  referenceImage?: string; // optional data URL, e.g. from Extract page
  gradient?: Gradient;
  fontPair?: FontPairing;
  createdAt: number;
  updatedAt: number;
}

interface ColourPantryDB extends DBSchema {
  stashes: {
    key: string;
    value: Stash;
    indexes: { folder: string; updatedAt: number };
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

const DB_NAME = "colour-pantry";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<ColourPantryDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ColourPantryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Wipe legacy stores on schema bump (pre-launch terminology change)
        for (const name of Array.from(db.objectStoreNames)) {
          db.deleteObjectStore(name);
        }
        const store = db.createObjectStore("stashes", { keyPath: "id" });
        store.createIndex("folder", "folder");
        store.createIndex("updatedAt", "updatedAt");
        db.createObjectStore("meta", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function newStash(folder: FolderId = "personal"): Stash {
  const now = Date.now();
  return {
    id: newId(),
    name: "Untitled Stash",
    folder,
    swatches: [],
    createdAt: now,
    updatedAt: now,
  };
}

export async function saveStash(stash: Stash): Promise<void> {
  const db = await getDB();
  stash.updatedAt = Date.now();
  await db.put("stashes", stash);
}

export async function getStash(id: string): Promise<Stash | undefined> {
  const db = await getDB();
  return db.get("stashes", id);
}

export async function getAllStashes(): Promise<Stash[]> {
  const db = await getDB();
  const all = await db.getAll("stashes");
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getStashesByFolder(folder: FolderId): Promise<Stash[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("stashes", "folder", folder);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteStash(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("stashes", id);
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.put("meta", { key, value });
}

export async function getMeta(key: string): Promise<string | undefined> {
  const db = await getDB();
  const rec = await db.get("meta", key);
  return rec?.value;
}
