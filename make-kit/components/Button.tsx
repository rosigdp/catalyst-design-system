import React from "react";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "card";
export type ButtonSize = "default" | "large";
export type ButtonContent =
  | "leadingIcon+label+trailingIcon"
  | "leadingIcon+label"
  | "label+trailingIcon"
  | "labelOnly"
  | "iconOnly";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  /** Optional override; otherwise inferred from which slots are provided. */
  content?: ButtonContent;
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
  // Card — outlined CTA with dashed brand-colored border. Per Figma matrix,
  // only valid for size=large + content=leadingIcon+label, but the component
  // doesn't hard-enforce that so Make can compose freely.
  card: {
    background: "var(--theme-system-background)",
    color: "var(--theme-brand-default)",
    border: "1px dashed var(--theme-brand-default)",
    boxShadow: "none",
  },
};

const SIZE: Record<ButtonSize, React.CSSProperties> = {
  default: { padding: "var(--spacing-sm) var(--spacing-lg)" },
  large: { padding: "var(--spacing-md) var(--spacing-lg)" },
};

function inferContent(
  hasLeading: boolean,
  hasTrailing: boolean,
  hasLabel: boolean,
): ButtonContent {
  if (hasLabel && hasLeading && hasTrailing) return "leadingIcon+label+trailingIcon";
  if (hasLabel && hasLeading) return "leadingIcon+label";
  if (hasLabel && hasTrailing) return "label+trailingIcon";
  if (!hasLabel && (hasLeading || hasTrailing)) return "iconOnly";
  return "labelOnly";
}

/**
 * Catalyst Button.
 * Root layer name → `Button/{variant}/{size}/{content}` so the Make → Design
 * System plugin can map it to the Button component set and set every variant
 * property (Variant, Size, Content) automatically.
 */
export function Button({
  variant = "primary",
  size = "default",
  leadingIcon,
  trailingIcon,
  content,
  children,
  style,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const hasLabel = children !== undefined && children !== null && children !== false && children !== "";
  const inferred = content || inferContent(!!leadingIcon, !!trailingIcon, !!hasLabel);

  // Icon color tracks the text color for each variant.
  const iconColor =
    variant === "secondary"
      ? "var(--theme-system-foreground-70)"
      : variant === "card"
        ? "var(--theme-brand-default)"
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

  // Icon-only adjusts to a square-ish pad so it doesn't look stretched.
  if (inferred === "iconOnly") {
    base.padding = "var(--spacing-sm)";
  }

  return (
    <button
      data-name={`Button/${variant}/${size}/${inferred}`}
      data-catalyst-focus="button"
      disabled={disabled}
      style={base}
      className={className}
      {...rest}
    >
      {leadingIcon ? (
        <span data-name="leadingIcon" style={{ color: iconColor, font: "var(--typography-icon)" }}>
          {leadingIcon}
        </span>
      ) : null}
      {hasLabel ? <span data-name="text">{children}</span> : null}
      {trailingIcon ? (
        <span data-name="trailingIcon" style={{ color: iconColor, font: "var(--typography-icon)" }}>
          {trailingIcon}
        </span>
      ) : null}
    </button>
  );
}
Button.displayName = "Button";
