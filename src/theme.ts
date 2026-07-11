/**
 * Design tokens for the gardening UI redesign (1a shell).
 *
 * The app styles with inline `React.CSSProperties` objects — there is no CSS
 * framework. This module is the single source of truth for colour, spacing,
 * radius, shadow and type so the shell + garden drawer read as one system
 * instead of ad-hoc hex per component.
 *
 * Palette derived from the Claude Design "Garden Wireframes" exploration:
 * warm paper background, leaf-green accent, sky-blue for facade/links, warm red
 * for warnings.
 */

export const colors = {
  /** Page background — warm paper. */
  paper: "#efece6",
  /** Canvas / inset surface. */
  canvas: "#f4f6f4",
  /** Card / panel surface. */
  surface: "#ffffff",
  /** Primary text / borders — soft ink, not pure black. */
  ink: "#2a2a2a",
  inkSoft: "#555555",
  inkFaint: "#8a8a8a",
  hair: "#eeeeee",

  /** Leaf-green accent scale. */
  leaf: "oklch(0.72 0.13 145)",
  leafSoft: "oklch(0.9 0.06 145)",
  leafDeep: "oklch(0.55 0.13 145)", // score text / emphasis
  leafTint: "#f4f6f4",

  /** Sky blue — facade tags, links, user chat bubbles. */
  sky: "#2a78d6",
  skyDeep: "#1a5fb0",

  /** Warnings / low scores. */
  warn: "#c0392b",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  chip: 14,
  card: 9,
  pill: 999,
} as const;

export const shadow = {
  soft: "0 2px 0 rgba(0,0,0,.12)",
  panel: "0 6px 24px rgba(0,0,0,.14)",
} as const;

export const font = {
  ui: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

export const z = {
  canvasOverlay: 5,
  drawer: 20,
  fern: 30,
  /** Address search + its results dropdown — must sit above rail and panels. */
  top: 60,
} as const;

/** A bordered white card, the base surface for panels and plant cards. */
export const cardBase: React.CSSProperties = {
  background: colors.surface,
  border: `1.5px solid ${colors.ink}`,
  borderRadius: radius.card,
  boxShadow: shadow.soft,
  fontFamily: font.ui,
};

/** A rounded filter/benefit chip. `active` fills it leaf-soft. */
export function chipStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 11,
    padding: "5px 10px",
    borderRadius: radius.chip,
    border: `1.5px solid ${active ? colors.ink : "#cccccc"}`,
    background: active ? colors.leafSoft : "transparent",
    color: active ? colors.ink : "#777777",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };
}
