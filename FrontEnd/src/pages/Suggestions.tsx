import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings, Camera, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBackendAuth } from "@/hooks/useBackendAuth";
import { apiClient } from "@/lib/api";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { WardrobeResponse } from "@/lib/api";

const Suggestions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { backendUserId, clearBackendAuth } = useBackendAuth();
  const { toast } = useToast();
  const [wardrobeData, setWardrobeData] = useState<WardrobeResponse | null>(
    location.state?.wardrobe || null
  );
  const [loading, setLoading] = useState(!wardrobeData);

  useEffect(() => {
    // If we have wardrobe data from navigation, use it
    if (location.state?.wardrobe) {
      setWardrobeData(location.state.wardrobe);
      setLoading(false);
    } else if (backendUserId) {
      // Otherwise, try to fetch personal info and get wardrobe
      fetchWardrobe();
    }
  }, [backendUserId, location.state]);

  const fetchWardrobe = async () => {
    if (!backendUserId) return;
    
    setLoading(true);
    try {
      const response = await apiClient.getPersonalInfo(backendUserId);
      if (response.success && response.data) {
        // If we have personal info, we can trigger a new wardrobe request
        // For now, we'll just show a message
        toast({
          title: "Loading suggestions",
          description: "Fetching your personalized outfit suggestions...",
        });
      }
    } catch (error) {
      console.error("Error fetching wardrobe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!backendUserId) {
      toast({
        title: "Error",
        description: "Please complete onboarding first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.getPersonalInfo(backendUserId);
      if (response.success && response.data) {
        // Trigger new wardrobe generation
        const updateResponse = await apiClient.updatePersonalInfo({
          _id: backendUserId,
          // Include existing data to trigger new suggestions
        });
        
        if (updateResponse.success && updateResponse.data) {
          setWardrobeData(updateResponse.data);
          toast({
            title: "New suggestions ready!",
            description: "Here are your refreshed outfit ideas.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fallback outfit suggestions if no backend data
  const fallbackOutfits = [
    {
      id: 1,
      name: "Casual Friday",
      description: "Relaxed yet put-together",
      color: "bg-secondary",
    },
    {
      id: 2,
      name: "Smart Business",
      description: "Professional elegance",
      color: "bg-muted",
    },
    {
      id: 3,
      name: "Weekend Vibes",
      description: "Effortlessly cool",
      color: "bg-card",
    },
    {
      id: 4,
      name: "Evening Out",
      description: "Sophisticated charm",
      color: "bg-secondary",
    },
    {
      id: 5,
      name: "Active Day",
      description: "Sporty and stylish",
      color: "bg-muted",
    },
    {
      id: 6,
      name: "Classic Minimal",
      description: "Timeless simplicity",
      color: "bg-card",
    },
  ];

  const handleSignOut = async () => {
    try {
      // Clear Supabase auth
      await signOut();
      // Clear backend auth
      clearBackendAuth();
      // Show success message
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      // Redirect to home page
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const outfits = wardrobeData?.wardrobe || fallbackOutfits;
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
              onClick={() => navigate("/onboarding")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit preferences
            </Button>
            {user && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            )}
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
          <h1 className="heading-display mb-4">
            {wardrobeData?.title || "Outfits picked for you"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {wardrobeData?.description || "Based on your preferences and photo"}
          </p>
        </motion.div>

        {/* Outfit Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {outfits.map((outfit: any, index: number) => (
              <motion.div
                key={outfit.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group"
              >
                <div className={`${outfit.color || 'bg-secondary'} rounded-2xl aspect-[3/4] mb-4 overflow-hidden shadow-[var(--shadow-card)] group-hover:shadow-[var(--shadow-soft)] transition-all duration-300`}>
                  {outfit.image ? (
                    <img 
                      src={outfit.image} 
                      alt={outfit.name || 'Outfit suggestion'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <span className="text-6xl">👕</span>
                    </div>
                  )}
                </div>
                {outfit.name && (
                  <>
                    <h3 className="font-display text-xl font-semibold mb-1">{outfit.name}</h3>
                    {outfit.description && (
                      <p className="text-muted-foreground text-sm">{outfit.description}</p>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-16"
        >
          <Button 
            className="btn-primary group" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            {loading ? "Loading..." : "Try another look"}
          </Button>
          <Button variant="outline" className="btn-secondary">
            <Camera className="w-4 h-4 mr-2" />
            Upload new photo
          </Button>
        </motion.div>
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
