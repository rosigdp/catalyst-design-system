import React from "react";

export type InputState = "default" | "error";
export type InputOrientation = "vertical" | "horizontal";

export interface InputProps {
  label?: React.ReactNode;
  supportingText?: React.ReactNode;
  state?: InputState;
  orientation?: InputOrientation;

  /** Label metadata (input.json#label.metadata) */
  optional?: boolean;
  /** Unit / metric shown next to the label, e.g. "kg", "USD". */
  metric?: React.ReactNode;
  /** Character counter, e.g. { current: 42, max: 200 }. */
  counter?: { current: number; max: number };
  /** Show a question-mark icon next to the label (typically a tooltip). */
  questionIcon?: React.ReactNode;
  /** Show an info icon next to the label (typically informational). */
  infoIcon?: React.ReactNode;

  /** The control, e.g. a <Textfield/>. */
  children?: React.ReactNode;
  /** Optional infobox shown below the control to summarize selection state. */
  selectionInfobox?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Catalyst Input — the field wrapper (label + control + supporting text +
 * optional selection infobox). Root layer name → `Input/{state}`.
 *
 * Compose a control inside, e.g.:
 *   <Input label="Email"><Textfield placeholder="you@catapa.com" /></Input>
 */
export function Input({
  label,
  supportingText,
  state = "default",
  orientation = "vertical",
  optional = false,
  metric,
  counter,
  questionIcon,
  infoIcon,
  children,
  selectionInfobox,
  style,
}: InputProps) {
  const supportingColor =
    state === "error"
      ? "var(--theme-negative-background)"
      : "var(--theme-system-foreground)";

  const iconStyle = (color: string): React.CSSProperties => ({
    color,
    font: "var(--typography-icon)",
    cursor: "help",
  });

  return (
    <div
      data-name={`Input/${state}`}
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
            alignItems: "center",
            gap: "var(--spacing-xs)",
            font: "var(--typography-label)",
            color: "var(--theme-system-foreground)",
          }}
        >
          <span data-name="labelText">{label}</span>
          {optional ? (
            <span data-name="optional" style={{ color: "var(--theme-system-foreground-70)" }}>
              (optional)
            </span>
          ) : null}
          {metric ? (
            <span data-name="metric" style={{ color: "var(--theme-system-foreground-70)" }}>
              {metric}
            </span>
          ) : null}
          {questionIcon ? (
            <span data-name="questionIcon" style={iconStyle("var(--theme-system-foreground-70)")}>
              {questionIcon}
            </span>
          ) : null}
          {infoIcon ? (
            <span data-name="infoIcon" style={iconStyle("var(--theme-accent-default)")}>
              {infoIcon}
            </span>
          ) : null}
          {counter ? (
            <span
              data-name="counter"
              style={{
                marginLeft: "auto",
                font: "var(--typography-small)",
                color:
                  counter.current > counter.max
                    ? "var(--theme-negative-background)"
                    : "var(--theme-system-foreground-70)",
              }}
            >
              {counter.current}/{counter.max}
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
        {selectionInfobox ? (
          <div data-name="selectionInfobox">
            {selectionInfobox}
          </div>
        ) : null}
      </div>
    </div>
  );
}
Input.displayName = "Input";
