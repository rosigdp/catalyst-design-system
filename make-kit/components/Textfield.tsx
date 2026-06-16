import React from "react";

export type TextfieldState = "default" | "focus" | "error" | "disabled";

export interface TextfieldProps {
  state?: TextfieldState;
  value?: string;
  placeholder?: string;
  multiLine?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
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
 * Root layer name → `Textfield/{state}`.
 */
export function Textfield({
  state = "default",
  value,
  placeholder,
  multiLine = false,
  leadingIcon,
  trailingIcon,
  style,
  onChange,
}: TextfieldProps) {
  const textColor =
    state === "disabled"
      ? "var(--theme-disable-foreground)"
      : "var(--theme-system-foreground)";

  return (
    <div
      data-name={`Textfield/${state}`}
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
    </div>
  );
}
Textfield.displayName = "Textfield";
