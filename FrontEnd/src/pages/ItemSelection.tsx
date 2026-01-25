import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { profileService } from "@/services/profileService";
import { recommendationService } from "@/services/recommendationService";
import type { ScoredItem, RecommendationResult } from "@/types/inventory";
import { SelectableImageCard } from "@/components/selection/SelectableImageCard";
import { Loader2 } from "lucide-react";

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
  {
    key: "outerwear",
    title: "Outerwear / Jackets",
    emoji: "🧥",
    getItems: (result) => result.jackets,
  },
];

// Store selections: category -> Set of styleIds
type Selections = Record<CategoryKey, Set<string>>;

const ItemSelection = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [selections, setSelections] = useState<Selections>({
    shirts: new Set(),
    bottomwear: new Set(),
    footwear: new Set(),
    outerwear: new Set(),
    accessories: new Set(),
  });

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

  const currentCategory = CATEGORIES[currentCategoryIndex];
  const currentItems = recommendations
    ? currentCategory.getItems(recommendations).slice(0, 4) // Get top 4 from backend
    : [];
  const currentSelections = selections[currentCategory.key];
  const selectedCount = currentSelections.size;
  const minSelections = 2;
  const canContinue = selectedCount >= minSelections;

  const toggleSelection = (styleId: string) => {
    setSelections((prev) => {
      const newSelections = { ...prev };
      const categorySet = new Set(newSelections[currentCategory.key]);
      
      if (categorySet.has(styleId)) {
        categorySet.delete(styleId);
      } else {
        categorySet.add(styleId);
      }
      
      newSelections[currentCategory.key] = categorySet;
      return newSelections;
    });
  };

  const handleContinue = () => {
    if (currentCategoryIndex < CATEGORIES.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
    } else {
      // All categories done - prepare selected items and navigate to outfit combinations
      const selectedItems = {
        shirts: Array.from(selections.shirts),
        jackets: Array.from(selections.outerwear), // outerwear maps to jackets
        jeans: Array.from(selections.bottomwear), // bottomwear maps to jeans
        shoes: Array.from(selections.footwear),
      };
      
      // Store selections in sessionStorage to pass to next page
      sessionStorage.setItem('selectedItems', JSON.stringify(selectedItems));
      navigate("/outfit-combinations");
    }
  };

  const handleBack = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
    }
  };

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
            {currentCategoryIndex > 0 && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <span className="font-display text-xl font-semibold">Fashify</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {currentCategoryIndex + 1} / {CATEGORIES.length}
            </div>
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
      <main className="flex-1 container mx-auto px-6 pt-24 pb-32 flex flex-col items-center justify-center">
        <motion.div
          key={currentCategoryIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-2xl"
        >
          {/* Category Title with Name */}
          <div className="text-center mb-8">
            <h1 className="heading-section mb-2">
              Pick at least 2 items you like{userName && <span className="text-primary">, {userName}</span>}
            </h1>
            <p className="text-muted-foreground">
              {currentCategory.emoji} {currentCategory.title}
            </p>
          </div>

          {/* Selection Counter */}
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">
              Selected <span className="font-semibold text-foreground">{selectedCount}</span> / {currentItems.length}
            </p>
          </div>

          {/* Grid of Selectable Items */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <AnimatePresence mode="wait">
              {currentItems.map((item) => (
                <SelectableImageCard
                  key={item.styleId}
                  item={item}
                  isSelected={currentSelections.has(item.styleId)}
                  onToggle={() => toggleSelection(item.styleId)}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* Footer with Continue Button */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border/50">
        <div className="container mx-auto px-6 py-4">
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            className="btn-primary w-full max-w-lg mx-auto block disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {currentCategoryIndex < CATEGORIES.length - 1 ? "Continue" : "Generate Outfits"}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default ItemSelection;
