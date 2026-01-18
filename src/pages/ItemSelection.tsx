import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { recommendationService } from "@backend/services/recommendationService";
import type { UserPreferences, ScoredItem, RecommendationResult } from "@/types/inventory";
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
  const { user, loading: authLoading } = useAuth();
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
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) {
        navigate("/onboarding");
        return;
      }

      setUserName(profile.name || "");

      // Convert profile to UserPreferences
      const preferences: UserPreferences = {
        gender: profile.gender || "male",
        weather: profile.weather_preference || 50,
        lifestyle: profile.lifestyle || "casual",
        bodyType: profile.body_type || "average",
        height: profile.height || 170,
        skinTone: profile.skin_tone || 50,
        styles: profile.preferred_styles || [],
      };

      // Get recommendations from backend
      const result = await recommendationService.getRecommendations(preferences);
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
      // All categories done - navigate to suggestions
      navigate("/suggestions");
    }
  };

  const handleBack = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
    }
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
          <div className="text-sm text-muted-foreground">
            {currentCategoryIndex + 1} / {CATEGORIES.length}
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
