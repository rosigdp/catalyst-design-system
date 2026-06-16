import React from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "square";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Image URL. Takes priority over initials. */
  src?: string;
  /** Up to 2 characters, shown when no image is provided. */
  initials?: string;
  alt?: string;
}

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 24,
  sm: 36,
  md: 72,
  lg: 108,
  xl: 144,
};

// theme.json → palettes.generated
const PALETTE = [
  "rgba(3, 235, 199, 1)", "rgba(26, 236, 249, 1)", "rgba(34, 199, 255, 1)",
  "rgba(45, 147, 251, 1)", "rgba(69, 230, 92, 1)", "rgba(73, 108, 231, 1)",
  "rgba(107, 79, 242, 1)", "rgba(134, 82, 251, 1)", "rgba(163, 235, 5, 1)",
  "rgba(203, 45, 247, 1)", "rgba(221, 236, 29, 1)", "rgba(234, 79, 190, 1)",
  "rgba(249, 98, 122, 1)", "rgba(250, 104, 60, 1)", "rgba(254, 242, 71, 1)",
  "rgba(255, 91, 184, 1)", "rgba(255, 150, 43, 1)", "rgba(255, 192, 43, 1)",
  "rgba(255, 211, 80, 1)",
];

function paletteFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/**
 * Catalyst Avatar.
 * Root layer name → `Avatar/{shape}/{size}`.
 */
export function Avatar({
  size = "md",
  shape = "circle",
  src,
  initials,
  alt = "",
  style,
  ...rest
}: AvatarProps) {
  const px = SIZE_PX[size];
  const radius =
    shape === "circle" ? "var(--radius-full)" : "var(--radius-default)";

  const frame: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: radius,
    overflow: "hidden",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    ...style,
  };

  let inner: React.ReactNode;
  if (src) {
    inner = (
      <img
        data-name="image"
        src={src}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  } else if (initials) {
    inner = (
      <span
        data-name="initials"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: paletteFor(initials),
          color: "var(--theme-system-on-surface-brand)",
          font: "var(--typography-body)",
        }}
      >
        {initials.slice(0, 2).toUpperCase()}
      </span>
    );
  } else {
    inner = (
      <span
        data-name="placeholder"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--theme-disable-background)",
          color: "var(--theme-disable-foreground)",
          font: "var(--typography-icon)",
        }}
      >
        {""}
      </span>
    );
  }

  return (
    <div data-name={`Avatar/${shape}/${size}`} style={frame} {...rest}>
      {inner}
    </div>
  );
}
Avatar.displayName = "Avatar";
