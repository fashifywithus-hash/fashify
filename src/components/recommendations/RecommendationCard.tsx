import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { ScoredItem } from "@/types/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { ProductImageCarousel } from "./ProductImageCarousel";

interface RecommendationCardProps {
  item: ScoredItem;
  index: number;
}

export const RecommendationCard = ({ item, index }: RecommendationCardProps) => {
  // Construct Myntra product URL
  const productUrl = item.itemLink.startsWith('http') 
    ? item.itemLink 
    : `https://${item.itemLink}`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          <ProductImageCarousel styleId={item.styleId} alt={item.description} />
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium z-10">
            {Math.round(item.score * 100)}% match
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{item.description}</h3>
          <p className="text-sm text-muted-foreground mb-2 capitalize">
            {item.type} • {item.color}
          </p>
          <div className="flex flex-wrap gap-1 mb-3">
            {item.styleTags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-secondary rounded-full text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            View on Myntra
            <ExternalLink className="w-4 h-4" />
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
};
