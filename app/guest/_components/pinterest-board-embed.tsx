"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    PinUtils?: { build: () => void };
  }
}

let scriptPromise: Promise<void> | null = null;

/** Loads Pinterest's widget script once and reuses it for every board embed on the page. */
function loadPinterestScript(): Promise<void> {
  if (window.PinUtils) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://assets.pinterest.com/js/pinit.js";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Renders a live Pinterest board via their widget builder — see
 * https://developers.pinterest.com/docs/web-features/widgets/#board-widget.
 * Pinterest's script replaces the anchor below with an iframe once loaded.
 */
export function PinterestBoardEmbed({ url }: { url: string }) {
  useEffect(() => {
    let cancelled = false;
    loadPinterestScript().then(() => {
      if (!cancelled) window.PinUtils?.build();
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="w-full overflow-hidden rounded-md">
      <a
        data-pin-do="embedBoard"
        data-pin-board-width="400"
        data-pin-scale-height="240"
        data-pin-scale-width="80"
        href={url}
      >
        {url}
      </a>
    </div>
  );
}
