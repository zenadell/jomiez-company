"use client";

import { FieldLabel, useField, useFormFields } from "@payloadcms/ui";
import { useState } from "react";

const CLEAR = "__clear__";

/*
 * The API key box. The saved key never comes back to the browser: this shows
 * whether one is saved (its last four characters) and lets you paste a new one
 * or remove it. Saving encrypts it on the server.
 */
export function SecretField({ path, field }: { path: string; field?: { label?: string; admin?: { description?: string } } }) {
  const { value, setValue } = useField<string>({ path });
  const hintPath = `${path}Hint`;
  const hint = useFormFields(([fields]) => fields[hintPath]?.value as string | undefined);
  const [editing, setEditing] = useState(!hint);
  const removing = value === CLEAR;

  return (
    <div className="field-type text jz-secret">
      <FieldLabel label={field?.label ?? "API key"} path={path} />
      {hint && !editing ? (
        <div className="jz-secret__saved">
          <span>{removing ? "Will be removed when you save." : `A key is saved (${hint}).`}</span>
          {!removing && (
            <>
              <button type="button" className="jz-btn jz-btn--ghost" onClick={() => setEditing(true)}>
                Replace
              </button>
              <button type="button" className="jz-btn jz-btn--ghost" onClick={() => setValue(CLEAR)}>
                Remove
              </button>
            </>
          )}
          {removing && (
            <button type="button" className="jz-btn jz-btn--ghost" onClick={() => setValue("")}>
              Keep it
            </button>
          )}
        </div>
      ) : (
        <div className="jz-secret__edit">
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste the key"
            value={typeof value === "string" && value !== CLEAR ? value : ""}
            onChange={(e) => setValue(e.target.value)}
          />
          {hint && (
            <button
              type="button"
              className="jz-btn jz-btn--ghost"
              onClick={() => {
                setValue("");
                setEditing(false);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      )}
      {field?.admin?.description && <p className="field-description">{field.admin.description}</p>}
    </div>
  );
}
