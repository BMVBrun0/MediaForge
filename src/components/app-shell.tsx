"use client";

import { AppFrame } from "./app-frame";
import { ToolStudio } from "./tool-studio";

export function AppShell() {
  return (
    <AppFrame>
      <ToolStudio />
    </AppFrame>
  );
}
