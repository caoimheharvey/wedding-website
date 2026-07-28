"use client";

import { useState } from "react";
import { CategoryForm } from "./category-form";

export function AddCategorySection() {
  const [adding, setAdding] = useState(false);

  if (adding) {
    return <CategoryForm onDone={() => setAdding(false)} />;
  }

  return (
    <button
      type="button"
      onClick={() => setAdding(true)}
      className="self-start rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-aegean-dark"
    >
      + Add category
    </button>
  );
}
