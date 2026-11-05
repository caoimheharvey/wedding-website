export function SectionWidthField({
  defaultValue = "normal",
  allowFull = false,
}: {
  defaultValue?: "normal" | "wide" | "full";
  allowFull?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-ink">
      Width
      <select name="width" defaultValue={defaultValue} className="input w-auto">
        <option value="normal">Normal</option>
        <option value="wide">Wide</option>
        {allowFull && <option value="full">Full-bleed (edge to edge, no frame)</option>}
      </select>
      <span className="text-xs font-normal text-foreground/50">
        {allowFull
          ? "Wide is only noticeably wider on larger screens. Full-bleed drops the card, border and captions so a designed image (e.g. exported from Canva) blends into the page."
          : "Wide is only noticeably wider on larger screens — on phones it looks the same as normal."}
      </span>
    </label>
  );
}
