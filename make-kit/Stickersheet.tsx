import React from "react";
import {
  Button,
  Badge,
  Avatar,
  TextAction,
  IconAction,
  Textfield,
  Input,
} from "./components";

/**
 * Catalyst Stickersheet — one instance of every component / variant.
 *
 * Two jobs:
 *  1. Paste this into your Figma file so the "Make → Design System" plugin can
 *     see the whole library (the plugin builds its catalog from components that
 *     already exist in the file).
 *  2. Use it to verify Make's layer naming: generate it, copy into Figma, and
 *     confirm the layer names read `Button/primary/large/labelOnly` etc.
 */
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
    <span style={{ font: "var(--typography-h4)", color: "var(--theme-system-foreground-70)" }}>{label}</span>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-md)", alignItems: "center" }}>
      {children}
    </div>
  </div>
);

export function Stickersheet() {
  return (
    <div
      data-name="Catalyst Stickersheet"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-xl)",
        padding: "var(--spacing-xl)",
        background: "var(--theme-system-background)",
        font: "var(--typography-body)",
      }}
    >
      <Row label="Button">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="card" size="large" leadingIcon="+">Card</Button>
        <Button variant="primary" size="large">Large</Button>
        <Button variant="primary" leadingIcon=">">Leading icon</Button>
        <Button variant="primary" trailingIcon="v">Trailing icon</Button>
        <Button variant="primary" leadingIcon="x" aria-label="Close" />
        <Button variant="secondary" disabled>Disabled</Button>
      </Row>

      <Row label="Badge">
        <Badge variant="positive">Positive</Badge>
        <Badge variant="negative">Negative</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="disable">Disable</Badge>
      </Row>

      <Row label="Avatar">
        <Avatar shape="circle" size="sm" initials="AL" />
        <Avatar shape="circle" size="md" initials="CD" />
        <Avatar shape="square" size="md" initials="EF" />
        <Avatar shape="circle" size="lg" />
      </Row>

      <Row label="TextAction">
        <TextAction variant="link">Link</TextAction>
        <TextAction variant="action">Action</TextAction>
        <TextAction variant="destructive">Destructive</TextAction>
      </Row>

      <Row label="IconAction">
        <IconAction variant="action" icon="" />
        <IconAction variant="destructive" icon="" />
      </Row>

      <Row label="Textfield">
        <Textfield state="default" placeholder="Default" />
        <Textfield state="focus" value="Focused" />
        <Textfield state="error" value="Error" />
        <Textfield state="disabled" value="Disabled" />
      </Row>

      <Row label="Input">
        <Input label="Email" supportingText="We never share it.">
          <Textfield placeholder="you@catapa.com" />
        </Input>
        <Input label="Name" state="error" supportingText="Required field.">
          <Textfield state="error" value="" />
        </Input>
      </Row>
    </div>
  );
}
Stickersheet.displayName = "Stickersheet";
