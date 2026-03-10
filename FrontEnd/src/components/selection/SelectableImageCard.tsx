import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { CatalogItem } from "@/services/catalogService";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";

interface SelectableImageCardProps {
  item: CatalogItem;
  isSelected: boolean;
  onToggle: () => void;
  showCheckmark?: boolean; // Optional prop to show/hide checkmark
}

export const SelectableImageCard = ({ item, isSelected, onToggle, showCheckmark = true }: SelectableImageCardProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Catalog API returns relative paths (e.g. /static/suits/...); resolve against backend origin so images load
    const url = item.imageUrl.startsWith("http") ? item.imageUrl : `${API_BASE_URL}${item.imageUrl}`;
    setLoading(false);
    setImageUrl(url);
  }, [item.imageUrl]);

  const getCategoryEmoji = () => {
    const category = (item.category || "").toLowerCase();
    if (category.includes("blazer")) return "🧥";
    if (category.includes("shirt") || category.includes("tshirt")) return "👕";
    if (category.includes("jacket")) return "🧥";
    if (category.includes("jean") || category.includes("pant")) return "👖";
    if (category.includes("shoe")) return "👟";
    return "👔";
  };

  return (
    <motion.button
      onClick={onToggle}
      className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gradient-to-br from-muted to-muted/50 group cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image or Placeholder */}
      {loading || !imageUrl ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-6xl">{getCategoryEmoji()}</div>
        </div>
      ) : (
        <span className="absolute inset-0 block w-full h-full">
          <img
            src={imageUrl}
            alt={item.styleId}
            className="block w-full h-full min-h-0 min-w-0 object-cover object-center"
            onError={() => {
              setImageUrl(null);
            }}
          />
        </span>
      )}

      {/* Hover Overlay (subtle, 2-4% opacity) */}
      <motion.div
        className="absolute inset-0 bg-foreground"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: isSelected ? 0 : 0.03 }}
        transition={{ duration: 0.2 }}
      />

      {/* Selected Overlay (light, semi-transparent) */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 bg-foreground/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Selection Tick Mark */}
      {isSelected && showCheckmark && (
        <motion.div
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.9 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2, type: "spring", stiffness: 200 }}
        >
          <Check className="w-4 h-4 text-foreground/70" strokeWidth={2.5} />
        </motion.div>
      )}
    </motion.button>
  );
};
