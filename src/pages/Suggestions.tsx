import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings, Camera } from "lucide-react";

const outfitSuggestions = [
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

const Suggestions = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-semibold">
            Fashify
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Settings className="w-4 h-4 mr-2" />
              Edit preferences
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
            Based on your preferences and photo
          </p>
        </motion.div>

        {/* Outfit Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {outfitSuggestions.map((outfit, index) => (
            <motion.div
              key={outfit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group"
            >
              <div className={`${outfit.color} rounded-2xl aspect-[3/4] mb-4 overflow-hidden shadow-[var(--shadow-card)] group-hover:shadow-[var(--shadow-soft)] transition-all duration-300`}>
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <span className="text-6xl">👕</span>
                </div>
              </div>
              <h3 className="font-display text-xl font-semibold mb-1">{outfit.name}</h3>
              <p className="text-muted-foreground text-sm">{outfit.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-16"
        >
          <Button className="btn-primary group">
            <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            Try another look
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
