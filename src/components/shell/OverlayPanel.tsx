import type { ReactNode, CSSProperties } from "react";
import { colors, radius, shadow, font, space } from "../../theme";

interface OverlayPanelProps {
  title: string;
  emoji?: string;
  onClose: () => void;
  children: ReactNode;
  /** Extra positioning/style (App decides where the panel docks). */
  style?: CSSProperties;
  testId?: string;
}

/** A floating, scrollable card that docks over the canvas (left or right). */
export function OverlayPanel({ title, emoji, onClose, children, style, testId }: OverlayPanelProps) {
  return (
    <div
      data-testid={testId}
      style={{
        display: "flex",
        flexDirection: "column",
        background: colors.surface,
        border: `1.5px solid ${colors.ink}`,
        borderRadius: radius.card,
        boxShadow: shadow.panel,
        fontFamily: font.ui,
        color: colors.ink,
        maxHeight: "calc(100% - 32px)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${space.md}px ${space.lg}px`,
          borderBottom: `1.5px solid ${colors.hair}`,
          flex: "0 0 auto",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          {emoji ? `${emoji} ` : ""}
          {title}
        </span>
        <button
          type="button"
          aria-label={`Close ${title}`}
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: colors.inkFaint,
            fontSize: 18,
            cursor: "pointer",
            lineHeight: 1,
            padding: 0,
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ overflowY: "auto", padding: space.lg, display: "flex", flexDirection: "column", gap: space.md }}>
        {children}
      </div>
    </div>
  );
}
