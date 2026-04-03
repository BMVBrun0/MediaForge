"use client";

import { HistoryPanel } from "./history-panel";
import { useHistory } from "@/src/lib/hooks/use-history";

export function HistoryPage() {
  const { history, isHydrating, deleteRecord, clearAll } = useHistory();

  return (
    <HistoryPanel history={history} isHydrating={isHydrating} onDelete={deleteRecord} onClearAll={clearAll} />
  );
}
