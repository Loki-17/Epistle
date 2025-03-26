import { Category } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

// Color mappings for category slugs
const categoryColors: Record<string, string> = {
  technology: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  business: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  design: "bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200",
  productivity: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  lifestyle: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
};

// Fallback color
const defaultColor = "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const colorClass = categoryColors[category.slug] || defaultColor;

  return (
    <span className={cn(
      "px-2 py-1 text-xs font-medium rounded-full",
      colorClass,
      className
    )}>
      {category.name}
    </span>
  );
}
