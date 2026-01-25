import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface SelectedItems {
  shirts: string[];
  jackets: string[];
  jeans: string[];
  shoes: string[];
}

interface OutfitCombination {
  top_id: string;
  bottom_id: string;
  jacket_id: string;
  shoe_id: string;
  reasoning: string;
  finalImage: string;
  myntraLinks: {
    top: string;
    bottom: string;
    jacket: string;
    shoe: string;
  };
}

interface OutfitCombinationsResponse {
  message: string;
  count: number;
  combinations: OutfitCombination[];
}

const OutfitCombinations = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [combinations, setCombinations] = useState<OutfitCombination[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItems | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    // Get selected items from sessionStorage
    const stored = sessionStorage.getItem('selectedItems');
    if (stored) {
      try {
        const items = JSON.parse(stored);
        setSelectedItems(items);
        generateOutfitCombinations(items);
      } catch (error) {
        console.error("Error parsing selected items:", error);
        toast({
          title: "Error",
          description: "Failed to load selected items. Please go back and select items again.",
          variant: "destructive",
        });
        navigate("/selection");
      }
    } else {
      toast({
        title: "No selections found",
        description: "Please select items first.",
        variant: "destructive",
      });
      navigate("/selection");
    }
  }, [user, authLoading, navigate]);

  const generateOutfitCombinations = async (items: SelectedItems) => {
    if (!user) return;

    setGenerating(true);
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch('http://localhost:3000/api/outfit-combinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          selectedItems: items,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate outfit combinations');
      }

      const data: OutfitCombinationsResponse = await response.json();
      setCombinations(data.combinations);
      
      toast({
        title: "Success!",
        description: `Generated ${data.count} outfit combinations`,
      });
    } catch (error: any) {
      console.error("Error generating outfit combinations:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate outfit combinations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleRetry = () => {
    if (selectedItems) {
      generateOutfitCombinations(selectedItems);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {generating ? "Generating your outfit combinations..." : "Loading..."}
          </p>
          {generating && (
            <p className="text-sm text-muted-foreground mt-2">
              This may take a few minutes...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md border-b border-border/50 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/selection")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold">Your Outfit Combinations</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 pt-24 pb-32">
        {combinations.length === 0 && !generating ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No outfit combinations generated yet.</p>
            <Button onClick={handleRetry}>Generate Outfits</Button>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold mb-2">
                {combinations.length} Outfit Combinations
              </h2>
              <p className="text-muted-foreground">
                AI-generated outfits tailored to your style and body type
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {combinations.map((combination, index) => (
                <motion.div
                  key={`${combination.top_id}-${combination.bottom_id}-${combination.jacket_id}-${combination.shoe_id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Generated Image */}
                  <div className="relative aspect-[3/4] bg-muted">
                    <img
                      src={`data:image/png;base64,${combination.finalImage}`}
                      alt={`Outfit combination ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Combination Details */}
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {combination.reasoning}
                    </p>

                    {/* Style IDs */}
                    <div className="mb-3 space-y-1">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Top:</span> {combination.top_id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Bottom:</span> {combination.bottom_id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Jacket:</span> {combination.jacket_id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Shoes:</span> {combination.shoe_id}
                      </div>
                    </div>

                    {/* Myntra Links */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => window.open(combination.myntraLinks.top, '_blank')}
                      >
                        Top <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => window.open(combination.myntraLinks.bottom, '_blank')}
                      >
                        Bottom <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => window.open(combination.myntraLinks.jacket, '_blank')}
                      >
                        Jacket <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => window.open(combination.myntraLinks.shoe, '_blank')}
                      >
                        Shoes <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default OutfitCombinations;

