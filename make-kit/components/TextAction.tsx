import React from "react";

export type TextActionVariant = "link" | "action" | "destructive";

export interface TextActionProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: TextActionVariant;
}

const COLOR: Record<TextActionVariant, string> = {
  link: "var(--theme-accent-default)",
  action: "var(--theme-brand-default)",
  destructive: "var(--theme-system-foreground-70)",
};

/**
 * Catalyst TextAction (text link / inline action).
 * Root layer name → `TextAction/{variant}`.
 */
export function TextAction({
  variant = "link",
  children,
  style,
  ...rest
}: TextActionProps) {
  return (
    <a
      data-name={`TextAction/${variant}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        font: "var(--typography-link)",
        textDecoration: "underline",
        color: COLOR[variant],
        cursor: "pointer",
        ...style,
      }}
      {...rest}
    >
      <span data-name="text">{children}</span>
    </a>
  );
}
TextAction.displayName = "TextAction";
