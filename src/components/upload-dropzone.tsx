"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ACCEPTED_IMAGE_TYPES } from "@/src/lib/constants";

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
}

export function UploadDropzone({ onFilesSelected }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isActive, setIsActive] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    onFilesSelected(Array.from(fileList));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsActive(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <label
      className={`dropzone ${isActive ? "is-active" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsActive(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsActive(false);
      }}
      onDrop={handleDrop}
    >
      <input ref={inputRef} type="file" accept={ACCEPTED_IMAGE_TYPES} multiple onChange={handleChange} />

      <div className="dropzone-content">
        <span className="dropzone-icon">⇪</span>
        <div>
          <h2>Arraste suas imagens aqui</h2>
          <p>PNG, JPEG, WebP, AVIF, TIFF ou GIF. Você pode enviar uma imagem ou um lote inteiro.</p>
        </div>
        <div className="dropzone-actions">
          <button type="button" className="button-primary" onClick={() => inputRef.current?.click()}>
            Escolher arquivos
          </button>
          <span className="micro-copy">Ideal para testar compressão, conversão e histórico local.</span>
        </div>
      </div>
    </label>
  );
}
