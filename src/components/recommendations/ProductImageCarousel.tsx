import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { getProductImages } from "@/lib/imageLoader";

interface ProductImageCarouselProps {
  styleId: string;
  alt: string;
}

export const ProductImageCarousel = ({ styleId, alt }: ProductImageCarouselProps) => {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Load all images for this styleId
    const loadImages = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const foundImages = await getProductImages(styleId);
        
        if (foundImages.length > 0) {
          setImages(foundImages);
        } else {
          // If no images found, show error state
          setError(true);
        }
      } catch (err) {
        console.error("Error loading images:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [styleId]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  // Show placeholder while loading or on error
  if (loading || error || images.length === 0) {
    const getCategoryEmoji = () => {
      const category = alt.toLowerCase();
      if (category.includes('shirt') || category.includes('tshirt')) return '👕';
      if (category.includes('jacket')) return '🧥';
      if (category.includes('jean') || category.includes('pant')) return '👖';
      if (category.includes('shoe')) return '👟';
      return '👔';
    };

    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
        <div className="text-center p-4">
          <div className="text-6xl mb-2">{getCategoryEmoji()}</div>
          {loading && <div className="text-xs text-muted-foreground">Loading...</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      {/* Main Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onError={(e) => {
            // If image fails, try next one or show placeholder
            const target = e.target as HTMLImageElement;
            const nextIndex = (currentIndex + 1) % images.length;
            if (nextIndex !== currentIndex && images[nextIndex]) {
              target.src = images[nextIndex];
              setCurrentIndex(nextIndex);
            } else {
              setError(true);
            }
          }}
        />
      </AnimatePresence>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90 backdrop-blur-sm h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90 backdrop-blur-sm h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Image Indicators (Dots) */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToImage(index);
              }}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-background/60 hover:bg-background/80"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};
