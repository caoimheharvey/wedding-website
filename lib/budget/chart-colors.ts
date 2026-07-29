// Literal class names (not dynamically concatenated) so Tailwind's JIT scanner
// picks them all up — cycles if there are more categories than colors.
const PALETTE = [
  "bg-aegean",
  "bg-terracotta",
  "bg-olive",
  "bg-gold",
  "bg-aegean-light",
  "bg-terracotta-light",
  "bg-olive-light",
  "bg-aegean-dark",
];

export function colorForIndex(index: number): string {
  return PALETTE[index % PALETTE.length];
}
