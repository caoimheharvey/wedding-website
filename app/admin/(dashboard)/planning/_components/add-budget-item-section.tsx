"use client";

import { useState } from "react";
import type { Category } from "@/lib/categories/types";
import { BudgetItemForm } from "./budget-item-form";

export function AddBudgetItemSection({ categories }: { categories: Category[] }) {
  const [adding, setAdding] = useState(false);

  if (adding) {
    return <BudgetItemForm categories={categories} onDone={() => setAdding(false)} />;
  }

  return (
    <button
      type="button"
      onClick={() => setAdding(true)}
      className="self-start rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
    >
      + Add item
    </button>
  );
}
