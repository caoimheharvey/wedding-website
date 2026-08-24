import type { ReactNode } from "react";
import { GuestBackgroundLayer } from "./guest-background-layer";

const DEFAULT_MAIN_CLASS =
  "relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center gap-6 px-6 py-12 text-center";

export function GuestPageShell({
  backgroundImageUrl,
  mainClassName = DEFAULT_MAIN_CLASS,
  children,
}: {
  backgroundImageUrl: string | null;
  mainClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate min-h-screen">
      <GuestBackgroundLayer imageUrl={backgroundImageUrl} />
      <main className={mainClassName}>{children}</main>
    </div>
  );
}
