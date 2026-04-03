
"use client";

import { useCallback, useEffect, useState } from "react";
import type { PersistedHistoryRecord } from "../types";
import {
  clearHistoryRecords,
  listHistoryRecords,
  removeHistoryRecord,
  saveHistoryRecord,
} from "../storage/history-db";

export function useHistory() {
  const [history, setHistory] = useState<PersistedHistoryRecord[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);

  const hydrate = useCallback(async () => {
    setIsHydrating(true);
    const items = await listHistoryRecords();
    setHistory(items);
    setIsHydrating(false);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const addRecord = useCallback(async (record: PersistedHistoryRecord) => {
    await saveHistoryRecord(record);
    await hydrate();
  }, [hydrate]);

  const deleteRecord = useCallback(async (id: string) => {
    await removeHistoryRecord(id);
    await hydrate();
  }, [hydrate]);

  const clearAll = useCallback(async () => {
    await clearHistoryRecords();
    await hydrate();
  }, [hydrate]);

  return {
    history,
    isHydrating,
    addRecord,
    deleteRecord,
    clearAll,
  };
}
