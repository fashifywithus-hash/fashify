import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Landing = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-2xl font-semibold">Fashify</span>
          {user ? (
            <Button variant="ghost" className="font-medium" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="ghost" className="font-medium">
                Login
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="heading-display mb-6">
              Outfits that suit <span className="text-primary">you</span>, not models.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="text-xl text-muted-foreground mb-12 max-w-xl mx-auto leading-relaxed"
          >
            Upload a photo, answer a few questions, and get outfit ideas tailored just for you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup">
              <Button className="btn-hero group">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="btn-secondary">
                I have an account
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="heading-section mb-4">How it works</h2>
            <p className="text-muted-foreground">Three simple steps to your perfect outfit</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { number: "01", title: "Tell us about you", description: "Answer a few quick questions about your style and preferences." },
              { number: "02", title: "Upload a photo", description: "Share a front-facing photo so we can understand your unique features." },
              { number: "03", title: "Get suggestions", description: "Receive personalized outfit ideas that truly suit you." },
            ].map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-8"
              >
                <div className="text-5xl font-display font-bold text-primary/20 mb-4">
                  {step.number}
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="heading-section mb-4">Ready to find your style?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands discovering outfits that actually work for them.
            </p>
            <Link to="/signup">
              <Button className="btn-hero">Start Free</Button>
            </Link>
          </motion.div>
        </div>
      </section>

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

export default Landing;
