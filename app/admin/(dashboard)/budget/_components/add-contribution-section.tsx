"use client";

import { useState } from "react";
import { ContributionForm } from "./contribution-form";

export function AddContributionSection() {
  const [adding, setAdding] = useState(false);

  if (adding) {
    return <ContributionForm onDone={() => setAdding(false)} />;
  }

  return (
    <button
      type="button"
      onClick={() => setAdding(true)}
      className="self-start rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
    >
      + Add contribution
    </button>
  );
}
