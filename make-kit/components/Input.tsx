import React from "react";

export type InputState = "default" | "error";
export type InputOrientation = "vertical" | "horizontal";

export interface InputProps {
  label?: React.ReactNode;
  supportingText?: React.ReactNode;
  state?: InputState;
  orientation?: InputOrientation;
  optional?: boolean;
  /** The control, e.g. a <Textfield/>. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Catalyst Input — the field wrapper (label + control + supporting text).
 * Root layer name → `Input`. Compose a control inside, e.g.:
 *   <Input label="Email"><Textfield placeholder="you@catapa.com" /></Input>
 */
export function Input({
  label,
  supportingText,
  state = "default",
  orientation = "vertical",
  optional = false,
  children,
  style,
}: InputProps) {
  const supportingColor =
    state === "error"
      ? "var(--theme-negative-background)"
      : "var(--theme-system-foreground)";

  return (
    <div
      data-name="Input"
      style={{
        display: "flex",
        flexDirection: orientation === "vertical" ? "column" : "row",
        gap:
          orientation === "vertical"
            ? "var(--spacing-xs)"
            : "var(--spacing-sm)",
        ...style,
      }}
    >
      {label ? (
        <label
          data-name="label"
          style={{
            display: "inline-flex",
            gap: "var(--spacing-xs)",
            font: "var(--typography-label)",
            color: "var(--theme-system-foreground)",
          }}
        >
          {label}
          {optional ? (
            <span data-name="optional" style={{ color: "var(--theme-system-foreground-70)" }}>
              (optional)
            </span>
          ) : null}
        </label>
      ) : null}

      <div data-name="control" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)", flex: 1 }}>
        {children}
        {supportingText ? (
          <span data-name="supportingText" style={{ font: "var(--typography-small)", color: supportingColor }}>
            {supportingText}
          </span>
        ) : null}
      </div>
    </div>
  );
}
Input.displayName = "Input";
