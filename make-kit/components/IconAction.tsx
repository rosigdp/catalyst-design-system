import React from "react";

export type IconActionVariant = "action" | "destructive";

export interface IconActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconActionVariant;
  /** The icon glyph/element to render. */
  icon?: React.ReactNode;
}

/**
 * Catalyst IconAction (icon-only button).
 * Root layer name → `IconAction/{variant}`.
 */
export function IconAction({
  variant = "action",
  icon,
  children,
  style,
  ...rest
}: IconActionProps) {
  return (
    <button
      data-name={`IconAction/${variant}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-xs)",
        background: "transparent",
        border: "none",
        borderRadius: "var(--radius-default)",
        color: "var(--theme-system-foreground-70)",
        font: "var(--typography-icon)",
        cursor: "pointer",
        ...style,
      }}
      {...rest}
    >
      <span data-name="icon">{icon ?? children}</span>
    </button>
  );
}
IconAction.displayName = "IconAction";
