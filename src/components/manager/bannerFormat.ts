import { CATEGORY_OPTIONS } from "@/context/BannerContext";

export function getCategoryLabel(categoryValue: string): string {
  const match = CATEGORY_OPTIONS.find((c) => c.value === categoryValue);
  return match ? match.label : categoryValue;
}
