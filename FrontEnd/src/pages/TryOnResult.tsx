import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

interface TryOnResultState {
  success: boolean;
  image?: string; // Base64 image data URL
  error?: string;
}

const TryOnResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const state = location.state as TryOnResultState | null;

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // If no state, redirect back to selection
  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No result data found</p>
          <Button onClick={() => navigate("/selection")}>Go Back to Selection</Button>
        </div>
      </div>
    );
  }

  const handleTryAgain = () => {
    navigate("/selection");
  };

  const handleBack = () => {
    navigate("/selection");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
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
      <main className="flex-1 container mx-auto px-6 pt-24 pb-8 flex items-center justify-center">
        {state.success && state.image ? (
          // Success: Show the try-on image
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <div className="text-center mb-6">
              <h1 className="heading-section mb-2">Your Try-On Result</h1>
              <p className="text-muted-foreground">Here's how you look in your selected outfit!</p>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-card border border-border">
              <img
                src={state.image}
                alt="Try-on result"
                className="w-full h-auto object-contain"
                onError={(e) => {
                  console.error("Failed to load try-on image");
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <Button
                onClick={handleTryAgain}
                variant="outline"
                className="btn-secondary"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Another Outfit
              </Button>
            </div>
          </motion.div>
        ) : (
          // Error: Show error message with try again button
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md text-center"
          >
            <div className="mb-6">
              <div className="text-6xl mb-4">😔</div>
              <h1 className="heading-section mb-2">Oh no!</h1>
              <p className="text-muted-foreground text-lg">
                Due to limited resources, we can't process image currently, try after some time
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleTryAgain}
                className="btn-primary"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={handleBack}
                variant="ghost"
                className="text-muted-foreground"
              >
                Go Back to Selection
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default TryOnResult;
