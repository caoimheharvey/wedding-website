export function SectionWidthField({ defaultValue = "normal" }: { defaultValue?: "normal" | "wide" }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-ink">
      Width
      <select name="width" defaultValue={defaultValue} className="input w-auto">
        <option value="normal">Normal</option>
        <option value="wide">Wide</option>
      </select>
      <span className="text-xs font-normal text-foreground/50">
        Wide is only noticeably wider on larger screens — on phones it looks the same as normal.
      </span>
    </label>
  );
}
