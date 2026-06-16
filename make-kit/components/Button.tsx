import React from "react";

export type ButtonVariant = "primary" | "secondary" | "destructive";
export type ButtonSize = "default" | "large";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const VARIANT: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--theme-brand-default)",
    color: "var(--theme-system-on-surface-brand)",
    border: "none",
    boxShadow: "var(--shadow-sm)",
  },
  secondary: {
    background: "var(--theme-system-background)",
    color: "var(--theme-system-foreground)",
    border: "1px solid var(--theme-system-foreground-20)",
    boxShadow: "none",
  },
  destructive: {
    background: "var(--theme-negative-background)",
    color: "var(--theme-system-on-surface-brand)",
    border: "none",
    boxShadow: "var(--shadow-sm)",
  },
};

const SIZE: Record<ButtonSize, React.CSSProperties> = {
  default: { padding: "var(--spacing-sm) var(--spacing-lg)" },
  large: { padding: "var(--spacing-md) var(--spacing-lg)" },
};

/**
 * Catalyst Button.
 * Root layer name → `Button/{variant}/{size}` so the Make → Design System
 * plugin can map it to the Button component set and set variant properties.
 */
export function Button({
  variant = "primary",
  size = "default",
  leadingIcon,
  trailingIcon,
  children,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const iconColor =
    variant === "secondary"
      ? "var(--theme-system-foreground-70)"
      : "var(--theme-system-on-surface-brand)";

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--spacing-sm)",
    borderRadius: "var(--radius-default)",
    font: "var(--typography-body)",
    cursor: disabled ? "not-allowed" : "pointer",
    ...VARIANT[variant],
    ...SIZE[size],
    ...(disabled
      ? {
          background: "var(--theme-disable-background)",
          color: "var(--theme-disable-foreground)",
          boxShadow: "none",
          border: "none",
        }
      : null),
    ...style,
  };

  return (
    <button
      data-name={`Button/${variant}/${size}`}
      disabled={disabled}
      style={base}
      {...rest}
    >
      {leadingIcon ? (
        <span data-name="leadingIcon" style={{ color: iconColor, font: "var(--typography-icon)" }}>
          {leadingIcon}
        </span>
      ) : null}
      <span data-name="text">{children}</span>
      {trailingIcon ? (
        <span data-name="trailingIcon" style={{ color: iconColor, font: "var(--typography-icon)" }}>
          {trailingIcon}
        </span>
      ) : null}
    </button>
  );
}
Button.displayName = "Button";
