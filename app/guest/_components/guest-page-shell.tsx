import type { ReactNode } from "react";
import { GuestPhotoBackdrop } from "./guest-photo-backdrop";

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
    <div className="canva-theme relative isolate min-h-screen overflow-x-clip">
      {backgroundImageUrl && <GuestPhotoBackdrop imageUrl={backgroundImageUrl} />}
      <main className={mainClassName}>{children}</main>
    </div>
  );
}
