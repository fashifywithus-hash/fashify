import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings, Loader2, AlertCircle, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { profileService } from "@/services/profileService";
import { recommendationService } from "@/services/recommendationService";
import type { RecommendationResult } from "@/types/inventory";
import { CategorySection } from "@/components/recommendations/CategorySection";
import { useToast } from "@/hooks/use-toast";

const Suggestions = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      loadRecommendations();
    }
  }, [user, authLoading, navigate]);

  const loadRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch user profile from backend API
      const profile = await profileService.getProfile();

      if (!profile) {
        navigate("/onboarding");
        return;
      }

      // Get recommendations from backend API
      // Backend automatically uses the user's saved profile from the auth token
      console.log("Loading recommendations from backend API...");
      const result = await recommendationService.getRecommendations();
      console.log("Recommendations result:", result);
      setRecommendations(result);
    } catch (err: any) {
      console.error("Error loading recommendations:", err);
      console.error("Error details:", err);
      setError(err.message || "Failed to load recommendations");
      toast({
        title: "Error",
        description: err.message || "Failed to load recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadRecommendations();
  };

  const handleEditPreferences = () => {
    navigate("/onboarding");
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
          <p className="text-muted-foreground">Loading your recommendations...</p>
        </div>
      </div>
    );
  }

  if (error && !recommendations) {
    return (
      <div className="min-h-screen bg-background">
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="font-display text-xl font-semibold">
              Fashify
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-6 pt-28 pb-24">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="heading-display mb-4">Error Loading Recommendations</h1>
            <p className="text-muted-foreground mb-2">{error}</p>
            <p className="text-sm text-muted-foreground mb-6">
              Open browser console (F12) to see detailed logs
            </p>
            <Button onClick={handleRefresh} className="btn-primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const hasRecommendations =
    recommendations &&
    (recommendations.shirts.length > 0 ||
      recommendations.jackets.length > 0 ||
      recommendations.jeans.length > 0 ||
      recommendations.shoes.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-semibold">
            Fashify
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={handleEditPreferences}
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit preferences
            </Button>
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
      <main className="container mx-auto px-6 pt-28 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="heading-display mb-4">Outfits picked for you</h1>
          <p className="text-muted-foreground text-lg">
            Based on your preferences and style
          </p>
        </motion.div>

        {!hasRecommendations ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No recommendations found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't find matching items based on your preferences.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              <strong>Debug Info:</strong> Open browser console (F12) to see detailed logs about why items were filtered out.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={handleEditPreferences} className="btn-primary">
                <Settings className="w-4 h-4 mr-2" />
                Edit Preferences
              </Button>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        ) : (
          <>
            {recommendations && (
              <>
                <CategorySection
                  title="Shirts & T-Shirts"
                  items={recommendations.shirts}
                  emoji="👕"
                />
                <CategorySection
                  title="Jackets"
                  items={recommendations.jackets}
                  emoji="🧥"
                />
                <CategorySection
                  title="Jeans & Pants"
                  items={recommendations.jeans}
                  emoji="👖"
                />
                <CategorySection
                  title="Shoes"
                  items={recommendations.shoes}
                  emoji="👟"
                />
              </>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-16"
            >
              <Button onClick={handleRefresh} className="btn-primary group">
                <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                Refresh Recommendations
              </Button>
            </motion.div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-display text-lg font-medium text-foreground">Fashify</span>
          <span>© 2025 Fashify. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default Suggestions;
