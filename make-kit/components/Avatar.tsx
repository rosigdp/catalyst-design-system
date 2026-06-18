import React from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "square";
export type AvatarState = "default" | "disabled";
export type AvatarMode = "view" | "edit";
export type AvatarVisualization = "image" | "initials" | "placeholder";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: AvatarSize;
  shape?: AvatarShape;
  state?: AvatarState;
  /** `edit` reveals the supporting button overlay (camera/edit icon). */
  mode?: AvatarMode;
  /** Optional override; otherwise inferred from src/initials presence. */
  visualization?: AvatarVisualization;
  /** Image URL. Takes priority over initials. */
  src?: string;
  /** Up to 2 characters, shown when no image is provided. */
  initials?: string;
  alt?: string;
  /** Click handler for the edit-mode supporting button. */
  onEdit?: () => void;
  /** Glyph/element rendered inside the supporting button. */
  editIcon?: React.ReactNode;
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

// supportingButton size is roughly 1/3 of the avatar (placement.overlap: 50%
// means it overhangs by half its own size). Capped so xs/sm avatars still get
// a tappable button.
function supportingButtonSize(avatarPx: number) {
  return Math.max(20, Math.round(avatarPx / 3));
}

/**
 * Catalyst Avatar.
 * Root layer name → `Avatar/{shape}/{size}/{state}` so the Make → Design System
 * plugin can apply matching variant properties on swap.
 */
export function Avatar({
  size = "md",
  shape = "circle",
  state = "default",
  mode = "view",
  visualization,
  src,
  initials,
  alt = "",
  onEdit,
  editIcon,
  style,
  ...rest
}: AvatarProps) {
  const px = SIZE_PX[size];
  const radius =
    shape === "circle" ? "var(--radius-full)" : "var(--radius-default)";
  const isDisabled = state === "disabled";
  const viz: AvatarVisualization =
    visualization ?? (src ? "image" : initials ? "initials" : "placeholder");

  const wrapper: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
    width: px,
    height: px,
    flexShrink: 0,
    ...style,
  };

  const frame: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: radius,
    overflow: "hidden",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    filter: isDisabled ? "grayscale(1)" : undefined,
    opacity: isDisabled ? 0.7 : undefined,
  };

  let inner: React.ReactNode;
  if (viz === "image" && src) {
    inner = (
      <img
        data-name="image"
        src={src}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  } else if (viz === "initials" && initials) {
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
        {""}
      </span>
    );
  }

  // Edit-mode overlay: a small circle button anchored to the bottom-right with
  // 50% overlap, per avatar.json#modes.edit.supportingButton.placement.
  // NOTE: avatar.json still references `shape: "circle"` on the supporting button,
  // but button.json removed its shape variant. Rendered inline here as a
  // styled circle button rather than wiring through <Button/>, since Button no
  // longer exposes shape.
  const showSupporting = mode === "edit";
  const btnPx = supportingButtonSize(px);

  return (
    <div data-name={`Avatar/${size}/${shape}/${viz}/${state}/${mode}`} style={wrapper} {...rest}>
      <div data-name="frame" style={frame}>{inner}</div>
      {showSupporting ? (
        <button
          type="button"
          data-name="supportingButton"
          onClick={onEdit}
          disabled={isDisabled}
          style={{
            position: "absolute",
            right: -btnPx / 2,
            bottom: -btnPx / 2,
            width: btnPx,
            height: btnPx,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--theme-system-background)",
            color: "var(--theme-system-foreground)",
            border: "1px solid var(--theme-system-foreground-20)",
            borderRadius: "var(--radius-full)",
            boxShadow: "var(--shadow-sm)",
            font: "var(--typography-icon)",
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
        >
          {editIcon}
        </button>
      ) : null}
    </div>
  );
}
Avatar.displayName = "Avatar";
