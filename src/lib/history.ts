"use client";

import { openDB } from "idb";
import type { ArtifactRecord } from "./types";

const DB_NAME = "mediaforge-workspace";
const STORE = "artifacts";
const MAX_PERSISTED_BLOB = 15 * 1024 * 1024;

async function database() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    },
  });
}

export async function saveArtifact(input: Omit<ArtifactRecord, "id" | "createdAt">) {
  const db = await database();
  const record: ArtifactRecord = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    blob: input.blob && input.blob.size <= MAX_PERSISTED_BLOB ? input.blob : undefined,
  };
  await db.put(STORE, record);
  return record;
}

export async function listArtifacts(): Promise<ArtifactRecord[]> {
  const db = await database();
  const all = (await db.getAll(STORE)) as ArtifactRecord[];
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteArtifact(id: string) {
  const db = await database();
  await db.delete(STORE, id);
}

export async function clearArtifacts() {
  const db = await database();
  await db.clear(STORE);
}
