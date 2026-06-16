import React from "react";

export type BadgeVariant =
  | "positive"
  | "negative"
  | "warning"
  | "disable"
  | "info";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANT: Record<BadgeVariant, React.CSSProperties> = {
  positive: {
    background: "var(--theme-positive-background-alternate)",
    color: "var(--theme-positive-foreground)",
    border: "1px solid var(--theme-positive-foreground-20)",
  },
  negative: {
    background: "var(--theme-negative-background-alternate)",
    color: "var(--theme-negative-foreground)",
    border: "1px solid var(--theme-negative-foreground-20)",
  },
  warning: {
    background: "var(--theme-warning-background-alternate)",
    color: "var(--theme-warning-foreground)",
    border: "1px solid var(--theme-warning-foreground-20)",
  },
  disable: {
    background: "var(--theme-disable-background-alternate)",
    color: "var(--theme-disable-foreground)",
    border: "1px solid var(--theme-disable-foreground-20)",
  },
  info: {
    background: "var(--theme-info-background-alternate)",
    color: "var(--theme-info-foreground)",
    border: "1px solid var(--theme-info-foreground-20)",
  },
};

/**
 * Catalyst Badge.
 * Root layer name → `Badge/{variant}`.
 */
export function Badge({ variant = "info", children, style, ...rest }: BadgeProps) {
  return (
    <span
      data-name={`Badge/${variant}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "var(--spacing-xs) var(--spacing-md)",
        borderRadius: "var(--radius-full)",
        font: "var(--typography-small)",
        ...VARIANT[variant],
        ...style,
      }}
      {...rest}
    >
      <span data-name="text">{children}</span>
    </span>
  );
}
Badge.displayName = "Badge";
