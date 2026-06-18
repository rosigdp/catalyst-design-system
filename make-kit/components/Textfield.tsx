import React from "react";

export type TextfieldState = "default" | "focus" | "error" | "disabled";
export type TextfieldMode = "edit" | "view";

export interface TextfieldProps {
  state?: TextfieldState;
  /** `edit` shows the input; `view` renders the value as read-only text. */
  mode?: TextfieldMode;
  value?: string;
  placeholder?: string;
  multiLine?: boolean;
  /** Icon glyph rendered before the value. Use for inline icons. */
  leadingIcon?: React.ReactNode;
  /** Icon glyph rendered after the value. */
  trailingIcon?: React.ReactNode;
  /** Inline button rendered before the value (e.g. currency toggle). */
  leadingButton?: React.ReactNode;
  /** Inline button rendered after the value (e.g. clear, search). */
  trailingButton?: React.ReactNode;
  style?: React.CSSProperties;
  onChange?: (value: string) => void;
}

const STATE: Record<TextfieldState, React.CSSProperties> = {
  default: {
    background: "var(--theme-system-background)",
    border: "1px solid var(--theme-system-foreground-20)",
    boxShadow: "none",
  },
  focus: {
    background: "var(--theme-system-background)",
    border: "1px solid var(--theme-brand-default)",
    boxShadow: "var(--focus-glow)",
  },
  error: {
    background: "var(--theme-system-background)",
    border: "1px solid var(--theme-negative-background)",
    boxShadow: "none",
  },
  disabled: {
    background: "var(--theme-disable-background)",
    border: "1px solid var(--theme-disable-foreground-20)",
    boxShadow: "none",
  },
};

/**
 * Catalyst Textfield.
 * Root layer name → `Textfield/{mode}/{state}`.
 */
export function Textfield({
  state = "default",
  mode = "edit",
  value,
  placeholder,
  multiLine = false,
  leadingIcon,
  trailingIcon,
  leadingButton,
  trailingButton,
  style,
  onChange,
}: TextfieldProps) {
  const textColor =
    state === "disabled"
      ? "var(--theme-disable-foreground)"
      : "var(--theme-system-foreground)";

  // View mode: render the value as plain text. No input chrome, no border/bg —
  // matches textfield.json#modes.view (an empty mode block = inherits the value
  // but is non-interactive). Keeps the layer-name shape so the plugin still
  // sets the Mode variant correctly.
  if (mode === "view") {
    return (
      <div
        data-name={`Textfield/${mode}/${state}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--spacing-sm)",
          padding: "var(--spacing-sm) 0",
          font: "var(--typography-body)",
          color: textColor,
          ...style,
        }}
      >
        {leadingIcon ? (
          <span data-name="leadingIcon" style={{ color: "var(--theme-system-foreground-70)", font: "var(--typography-icon)" }}>
            {leadingIcon}
          </span>
        ) : null}
        <span data-name="value">{value || ""}</span>
        {trailingIcon ? (
          <span data-name="trailingIcon" style={{ color: "var(--theme-system-foreground-70)", font: "var(--typography-icon)" }}>
            {trailingIcon}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      data-name={`Textfield/${mode}/${state}`}
      style={{
        display: "flex",
        alignItems: multiLine ? "flex-start" : "center",
        gap: "var(--spacing-sm)",
        padding: "var(--spacing-sm) var(--spacing-md)",
        borderRadius: "var(--radius-default)",
        font: "var(--typography-body)",
        ...STATE[state],
        ...style,
      }}
    >
      {leadingButton ? (
        <span data-name="leadingButton" style={{ display: "inline-flex", alignItems: "center" }}>
          {leadingButton}
        </span>
      ) : null}
      {leadingIcon ? (
        <span data-name="leadingIcon" style={{ color: "var(--theme-system-foreground-70)", font: "var(--typography-icon)" }}>
          {leadingIcon}
        </span>
      ) : null}

      {multiLine ? (
        <textarea
          data-name="value"
          value={value}
          placeholder={placeholder}
          disabled={state === "disabled"}
          onChange={(e) => onChange?.(e.target.value)}
          style={{
            flex: 1,
            resize: "vertical",
            border: "none",
            outline: "none",
            background: "transparent",
            color: textColor,
            font: "inherit",
          }}
        />
      ) : (
        <input
          data-name="value"
          value={value}
          placeholder={placeholder}
          disabled={state === "disabled"}
          onChange={(e) => onChange?.(e.target.value)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            color: textColor,
            font: "inherit",
          }}
        />
      )}

      {trailingIcon ? (
        <span data-name="trailingIcon" style={{ color: "var(--theme-system-foreground-70)", font: "var(--typography-icon)" }}>
          {trailingIcon}
        </span>
      ) : null}
      {trailingButton ? (
        <span data-name="trailingButton" style={{ display: "inline-flex", alignItems: "center" }}>
          {trailingButton}
        </span>
      ) : null}
    </div>
  );
}
Textfield.displayName = "Textfield";
