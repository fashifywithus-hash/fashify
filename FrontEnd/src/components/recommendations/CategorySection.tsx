import { motion } from "framer-motion";
import type { ScoredItem } from "@/types/inventory";
import { RecommendationCard } from "./RecommendationCard";

interface CategorySectionProps {
  title: string;
  items: ScoredItem[];
  emoji: string;
}

export const CategorySection = ({ title, items, emoji }: CategorySectionProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{emoji}</span>
        <h2 className="text-2xl font-display font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground ml-auto">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, index) => (
          <RecommendationCard key={item.styleId} item={item} index={index} />
        ))}
      </div>
    </motion.section>
  );
};
