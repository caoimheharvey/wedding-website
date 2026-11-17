const SECTIONS: [string, string][] = [
  ["s1", "1 Overview"],
  ["s2", "2 Availability & booking"],
  ["s3", "3 Spaces & capacities"],
  ["s4", "4 Food & drinks"],
  ["s5", "5 Cost breakdown"],
  ["s6", "6 Included services"],
  ["s7", "7 Not provided"],
  ["s8", "8 Additional costs"],
  ["s9", "9 Accommodation & logistics"],
  ["s10", "10 Coordination"],
  ["s11", "11 Dog policy"],
  ["s12", "12 Contract & payment"],
  ["s13", "13 Cost scenarios"],
  ["s14", "14 Evaluation"],
  ["s15", "15 Questions"],
  ["s16", "16 Correspondence"],
];

export function VenueSectionNav() {
  return (
    <nav
      aria-label="Venue sections"
      className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-x-3 gap-y-1 border-b border-border bg-background/90 px-1 py-2 text-xs backdrop-blur"
    >
      {SECTIONS.map(([id, label]) => (
        <a key={id} href={`#${id}`} className="text-aegean hover:underline">
          {label}
        </a>
      ))}
    </nav>
  );
}
