"use client";

import { OUTPUT_FORMATS, QUICK_PRESETS, TOOL_MODES } from "@/src/lib/constants";
import type { ProcessOptions } from "@/src/lib/types";

interface OptionsPanelProps {
  options: ProcessOptions;
  onChange: (next: ProcessOptions) => void;
}

export function OptionsPanel({ options, onChange }: OptionsPanelProps) {
  const applyPreset = (presetId: string) => {
    const preset = QUICK_PRESETS.find((item) => item.id === presetId);

    if (!preset) {
      return;
    }

    onChange({
      ...options,
      ...preset.options,
    });
  };

  return (
    <section className="settings-panel">
      <div className="settings-block">
        <div>
          <p className="section-kicker">Modo</p>
          <h3>Defina como a imagem será tratada</h3>
        </div>

        <div className="segmented-control" role="tablist" aria-label="Modo de processamento">
          {TOOL_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              className={mode.value === options.mode ? "is-active" : ""}
              onClick={() => onChange({ ...options, mode: mode.value })}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <p className="section-copy compact">
          {TOOL_MODES.find((item) => item.value === options.mode)?.description}
        </p>
      </div>

      <div className="settings-block">
        <div className="row-between wrap-gap">
          <div>
            <p className="section-kicker">Presets rápidos</p>
            <h3>Atalhos para cenários comuns</h3>
          </div>
          <div className="preset-list">
            {QUICK_PRESETS.map((preset) => (
              <button key={preset.id} type="button" className="preset-chip" onClick={() => applyPreset(preset.id)}>
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="field-grid">
        <label className="field-label">
          <span>Formato de saída</span>
          <select
            className="field-control"
            value={options.outputFormat}
            onChange={(event) =>
              onChange({
                ...options,
                outputFormat: event.target.value as ProcessOptions["outputFormat"],
              })
            }
          >
            {OUTPUT_FORMATS.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label} · {format.hint}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          <span>Qualidade ({options.quality}%)</span>
          <div className="range-box">
            <input
              type="range"
              min={35}
              max={100}
              value={options.quality}
              onChange={(event) =>
                onChange({
                  ...options,
                  quality: Number(event.target.value),
                })
              }
            />
          </div>
        </label>

        <label className="field-label">
          <span>Largura máxima</span>
          <input
            className="field-control"
            placeholder="ex.: 1920"
            inputMode="numeric"
            value={options.maxWidth ?? ""}
            onChange={(event) =>
              onChange({
                ...options,
                maxWidth: event.target.value ? Number(event.target.value) : undefined,
              })
            }
          />
        </label>

        <label className="field-label">
          <span>Altura máxima</span>
          <input
            className="field-control"
            placeholder="ex.: 1080"
            inputMode="numeric"
            value={options.maxHeight ?? ""}
            onChange={(event) =>
              onChange({
                ...options,
                maxHeight: event.target.value ? Number(event.target.value) : undefined,
              })
            }
          />
        </label>
      </div>
    </section>
  );
}
