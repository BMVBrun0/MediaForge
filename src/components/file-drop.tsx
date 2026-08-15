"use client";

import { FileUp } from "lucide-react";
import { useRef, useState } from "react";

export function FileDrop({
  accept,
  multiple = false,
  label = "Arraste o arquivo aqui",
  hint = "ou selecione no dispositivo",
  onFiles,
}: {
  accept?: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const take = (list: FileList | null) => {
    if (!list?.length) return;
    onFiles(Array.from(list));
  };

  return (
    <div
      className={`file-drop ${dragging ? "dragging" : ""}`}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); take(event.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
    >
      <input ref={inputRef} hidden type="file" accept={accept} multiple={multiple} onChange={(event) => { take(event.target.files); event.target.value = ""; }} />
      <span className="file-drop-icon"><FileUp size={22} /></span>
      <div><strong>{label}</strong><small>{hint}</small></div>
      <span className="file-drop-action">Selecionar</span>
    </div>
  );
}
