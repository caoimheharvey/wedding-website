"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { SectionDecor, SectionStyle } from "@/lib/guest-view/types";

const POSITION_CLASS: Record<SectionDecor["position"], string> = {
  "top-left": "top-0 left-0",
  "top-center": "top-0 left-1/2 -translate-x-1/2",
  "top-right": "top-0 right-0",
  "bottom-left": "bottom-0 left-0",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-0 right-0",
};

const SIZE_CLASS: Record<SectionDecor["size"], string> = {
  sm: "w-24 sm:w-32",
  md: "w-36 sm:w-56",
  lg: "w-48 sm:w-80",
};

/** Wraps a section in the optional "designed" look: a full-width coloured band with
 *  artwork pinned to its edges, and/or a fade-in as it scrolls into view. The fade is
 *  applied to an inner element because the width classes already use transforms. */
export function SectionFrame({
  style,
  widthClass,
  children,
}: {
  style: SectionStyle | undefined;
  widthClass: string;
  children: ReactNode;
}) {
  const fadeRef = useRef<HTMLDivElement>(null);
  const fadeIn = style?.fadeIn ?? false;
  const banded = !!style && (!!style.bgColor || style.decor.length > 0);

  useEffect(() => {
    const element = fadeRef.current;
    if (!fadeIn || !element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("fade-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    element.classList.add("fade-pending");
    observer.observe(element);
    return () => observer.disconnect();
  }, [fadeIn]);

  if (!banded) {
    return (
      <div className={widthClass}>
        <div ref={fadeRef}>{children}</div>
      </div>
    );
  }

  return (
    <div
      className="section-full relative overflow-hidden"
      style={style.bgColor ? { backgroundColor: style.bgColor } : undefined}
    >
      {style.decor.map((decor, index) => (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded artwork
        <img
          key={index}
          src={decor.url}
          alt=""
          aria-hidden
          className={`pointer-events-none absolute z-0 h-auto ${POSITION_CLASS[decor.position]} ${SIZE_CLASS[decor.size]}`}
        />
      ))}
      <div className="relative z-10 mx-auto w-full max-w-lg px-6 py-20">
        <div ref={fadeRef}>{children}</div>
      </div>
    </div>
  );
}
