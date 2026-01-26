import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LogOut, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { profileService } from "@/services/profileService";
import { recommendationService } from "@/services/recommendationService";
import { tryOnService } from "@/services/tryOnService";
import type { ScoredItem, RecommendationResult } from "@/types/inventory";
import { SelectableImageCard } from "@/components/selection/SelectableImageCard";

type CategoryKey = "shirts" | "bottomwear" | "footwear" | "outerwear" | "accessories";

interface CategoryConfig {
  key: CategoryKey;
  title: string;
  emoji: string;
  getItems: (result: RecommendationResult) => ScoredItem[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: "shirts",
    title: "Shirts & Tops",
    emoji: "👕",
    getItems: (result) => result.shirts,
  },
  {
    key: "outerwear",
    title: "Outerwear / Jackets",
    emoji: "🧥",
    getItems: (result) => result.jackets,
  },
  {
    key: "bottomwear",
    title: "Bottomwear",
    emoji: "👖",
    getItems: (result) => result.jeans,
  },
  {
    key: "footwear",
    title: "Footwear",
    emoji: "👟",
    getItems: (result) => result.shoes,
  },
];

// Store current index for each category (which item is currently shown)
type CategoryIndices = Record<CategoryKey, number>;

const ItemSelection = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tryingOn, setTryingOn] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  
  // Track current index for each category (starts at 0)
  const [currentIndices, setCurrentIndices] = useState<CategoryIndices>({
    shirts: 0,
    bottomwear: 0,
    footwear: 0,
    outerwear: 0,
    accessories: 0,
  });

  // Track mouse movement to show/hide navigation arrows
  const [showArrows, setShowArrows] = useState<Record<CategoryKey, boolean>>({
    shirts: false,
    bottomwear: false,
    footwear: false,
    outerwear: false,
    accessories: false,
  });
  
  const [mouseMoveTimeout, setMouseMoveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Fetch user profile
      const profile = await profileService.getProfile();

      if (!profile) {
        navigate("/onboarding");
        return;
      }

      setUserName(profile.name || "");

      // Get recommendations from backend API
      // Backend automatically uses the user's saved profile from the auth token
      const result = await recommendationService.getRecommendations();
      setRecommendations(result);
    } catch (error: any) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to next/previous item in a category
  const navigateItem = (categoryKey: CategoryKey, direction: 'prev' | 'next') => {
    if (!recommendations) return;

    const items = CATEGORIES.find(c => c.key === categoryKey)?.getItems(recommendations) || [];
    if (items.length === 0) return;

    setCurrentIndices((prev) => {
      const currentIndex = prev[categoryKey];
      let newIndex: number;

      if (direction === 'next') {
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0; // Loop to start
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1; // Loop to end
      }

      return {
        ...prev,
        [categoryKey]: newIndex,
      };
    });
  };

  // Get currently selected item for a category
  const getCurrentItem = (categoryKey: CategoryKey): ScoredItem | null => {
    if (!recommendations) return null;
    const items = CATEGORIES.find(c => c.key === categoryKey)?.getItems(recommendations) || [];
    const currentIndex = currentIndices[categoryKey];
    return items[currentIndex] || null;
  };

  // Handle mouse movement to show/hide arrows
  const handleMouseMove = (categoryKey: CategoryKey) => {
    // Show arrows
    setShowArrows((prev) => ({
      ...prev,
      [categoryKey]: true,
    }));

    // Clear existing timeout
    if (mouseMoveTimeout) {
      clearTimeout(mouseMoveTimeout);
    }

    // Hide arrows after 2 seconds of no movement
    const timeout = setTimeout(() => {
      setShowArrows((prev) => ({
        ...prev,
        [categoryKey]: false,
      }));
    }, 2000);

    setMouseMoveTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (mouseMoveTimeout) {
        clearTimeout(mouseMoveTimeout);
      }
    };
  }, [mouseMoveTimeout]);

  const handleTryOn = async () => {
    if (!recommendations) return;

    // Get current item from each required category
    const shirtsItem = getCurrentItem('shirts');
    const outerwearItem = getCurrentItem('outerwear');
    const bottomwearItem = getCurrentItem('bottomwear');
    const footwearItem = getCurrentItem('footwear');

    // Validate that items exist for all categories
    if (!shirtsItem || !outerwearItem || !bottomwearItem || !footwearItem) {
      alert("Please ensure all categories have items available");
      return;
    }

    const baseUpperStyleId = shirtsItem.styleId;
    const outerUpperStyleId = outerwearItem.styleId;
    const bottomsStyleId = bottomwearItem.styleId;
    const footwearStyleId = footwearItem.styleId;

    setTryingOn(true);
    try {
      const response = await tryOnService.tryOn({
        baseUpperStyleId,
        outerUpperStyleId,
        bottomsStyleId,
        footwearStyleId,
      });

      // Navigate to result page with success state and image
      navigate("/tryon-result", {
        state: {
          success: true,
          image: response.image,
        },
      });
    } catch (error: any) {
      console.error("Try-on failed:", error);
      
      // Extract error message from error object
      const errorMessage = error?.message || error?.error || "Failed to generate try-on image. Please try again.";
      
      // Navigate to result page with error state
      navigate("/tryon-result", {
        state: {
          success: false,
          error: errorMessage,
        },
      });
    } finally {
      setTryingOn(false);
    }
  };

  // Check if all required categories have items available
  const canTryOn = (() => {
    if (!recommendations) return false;
    return (
      getCurrentItem('shirts') !== null &&
      getCurrentItem('outerwear') !== null &&
      getCurrentItem('bottomwear') !== null &&
      getCurrentItem('footwear') !== null
    );
  })();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading items...</p>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No items available</p>
          <Button onClick={() => navigate("/onboarding")} className="mt-4">
            Go Back to Onboarding
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-display text-xl font-semibold">Fashify</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 pt-24 pb-32">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="heading-section mb-2">
            Pick items you like{userName && <span className="text-primary">, {userName}</span>}
          </h1>
          <p className="text-muted-foreground">
            Select at least one item from each category to try on
          </p>
        </div>

        {/* Category Sections */}
        <div className="space-y-12">
          {CATEGORIES.map((category) => {
            const items = recommendations ? category.getItems(recommendations) : [];
            const currentIndex = currentIndices[category.key];
            const currentItem = items[currentIndex] || null;

            if (!currentItem) return null;

            return (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.emoji}</span>
                    <h2 className="text-xl font-semibold">{category.title}</h2>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentIndex + 1} / {items.length}
                  </div>
                </div>

                {/* Single Image Carousel with Button Navigation */}
                <div 
                  className="relative"
                  onMouseMove={() => handleMouseMove(category.key)}
                  onMouseLeave={() => {
                    setShowArrows((prev) => ({
                      ...prev,
                      [category.key]: false,
                    }));
                  }}
                >
                  {/* Single Item Display */}
                  <div className="w-full flex justify-center px-12">
                    <motion.div
                      key={currentItem.styleId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="w-full max-w-sm relative group"
                    >
                      <SelectableImageCard
                        item={currentItem}
                        isSelected={true}
                        onToggle={() => {}} // No toggle needed, always selected
                        showCheckmark={false} // Hide checkmark in carousel view
                      />
                      
                      {/* Left Navigation Button - On image, shown on hover/movement */}
                      <button
                        onClick={() => navigateItem(category.key, 'prev')}
                        className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-background transition-all hover:scale-110 ${
                          showArrows[category.key] ? 'opacity-100' : 'opacity-0'
                        }`}
                        aria-label="Previous item"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      {/* Right Navigation Button - On image, shown on hover/movement */}
                      <button
                        onClick={() => navigateItem(category.key, 'next')}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-background transition-all hover:scale-110 ${
                          showArrows[category.key] ? 'opacity-100' : 'opacity-0'
                        }`}
                        aria-label="Next item"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </motion.div>
                  </div>

                  {/* Navigation Dots */}
                  {items.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      {items.map((item, index) => (
                        <button
                          key={item.styleId}
                          onClick={() => {
                            setCurrentIndices((prev) => ({
                              ...prev,
                              [category.key]: index,
                            }));
                          }}
                          className={`h-2 rounded-full transition-all ${
                            currentIndex === index
                              ? 'bg-primary w-6'
                              : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2'
                          }`}
                          aria-label={`Go to item ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Footer with Try It On Button */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border/50">
        <div className="container mx-auto px-6 py-4">
          <Button
            onClick={handleTryOn}
            disabled={!canTryOn || tryingOn}
            className="btn-primary w-full max-w-lg mx-auto block disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {tryingOn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Try-On...
              </>
            ) : (
              "Try it on"
            )}
          </Button>
        </div>
      </footer>

      {/* Loading Modal for Try-On Process */}
      <Dialog open={tryingOn} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="mb-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2 font-display">
              Generating Your Try-On
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This process may take <span className="font-semibold text-foreground">30-60 seconds</span>.
              <br />
              Please wait while we create your virtual try-on image...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemSelection;
