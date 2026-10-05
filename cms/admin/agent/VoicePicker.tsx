"use client";

import { useField } from "@payloadcms/ui";
import { useState } from "react";

/*
 * "Choose a voice" under the voice box: Gemini's voices with how Google
 * describes each one. Any other voice name can still be typed in the box.
 */

const VOICES: [string, string][] = [
  ["Kore", "Firm · female"],
  ["Aoede", "Breezy · female"],
  ["Leda", "Youthful · female"],
  ["Zephyr", "Bright · female"],
  ["Puck", "Upbeat · male"],
  ["Charon", "Informative · male"],
  ["Fenrir", "Excitable · male"],
  ["Orus", "Firm · male"],
  ["Achernar", "Soft"],
  ["Achird", "Friendly"],
  ["Algenib", "Gravelly"],
  ["Algieba", "Smooth"],
  ["Alnilam", "Firm"],
  ["Autonoe", "Bright"],
  ["Callirrhoe", "Easy-going"],
  ["Despina", "Smooth"],
  ["Enceladus", "Breathy"],
  ["Erinome", "Clear"],
  ["Gacrux", "Mature"],
  ["Iapetus", "Clear"],
  ["Laomedeia", "Upbeat"],
  ["Pulcherrima", "Forward"],
  ["Rasalgethi", "Informative"],
  ["Sadachbia", "Lively"],
  ["Sadaltager", "Knowledgeable"],
  ["Schedar", "Even"],
  ["Sulafat", "Warm"],
  ["Umbriel", "Easy-going"],
  ["Vindemiatrix", "Gentle"],
  ["Zubenelgenubi", "Casual"],
];

export function VoicePicker({ path }: { path?: string }) {
  const { value, setValue } = useField<string>({ path });
  const [open, setOpen] = useState(false);
  return (
    <div className="jz-picker">
      <button type="button" className="jz-picker__button" onClick={() => setOpen((v) => !v)}>
        Choose a voice <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="jz-picker__panel" role="listbox">
          {VOICES.map(([name, sound]) => (
            <button
              key={name}
              type="button"
              role="option"
              aria-selected={name === value}
              className="jz-picker__option"
              onClick={() => {
                setValue(name);
                setOpen(false);
              }}
            >
              <span>{name}</span>
              <code>{sound}</code>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
