
"use client";

import { openDB } from "idb";
import type { PersistedHistoryRecord } from "../types";

const DATABASE_NAME = "mediaforge-history";
const STORE_NAME = "records";

async function getDatabase() {
  return openDB(DATABASE_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
}

export async function listHistoryRecords(): Promise<PersistedHistoryRecord[]> {
  const database = await getDatabase();
  const all = await database.getAll(STORE_NAME);
  return all.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function saveHistoryRecord(record: PersistedHistoryRecord): Promise<void> {
  const database = await getDatabase();
  await database.put(STORE_NAME, record);
}

export async function removeHistoryRecord(id: string): Promise<void> {
  const database = await getDatabase();
  await database.delete(STORE_NAME, id);
}

export async function clearHistoryRecords(): Promise<void> {
  const database = await getDatabase();
  await database.clear(STORE_NAME);
}
