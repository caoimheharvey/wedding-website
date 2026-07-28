export function GuestsSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="guest-search" className="text-sm font-medium text-ink">
        Search:
      </label>
      <input
        id="guest-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Name, email, or phone…"
        className="input w-full max-w-md"
      />
    </div>
  );
}
