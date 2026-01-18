import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ProgressIndicator } from "./ProgressIndicator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  canContinue: boolean;
  onContinue: () => void;
  onBack?: () => void;
  continueLabel?: string;
}

export const OnboardingLayout = ({
  children,
  currentStep,
  totalSteps,
  canContinue,
  onContinue,
  onBack,
  continueLabel = "Continue",
}: OnboardingLayoutProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

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
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <span className="font-display text-xl font-semibold">Fashify</span>
          </div>
          <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
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
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-6 pt-24 pb-32 flex flex-col items-center justify-center">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-lg"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer with Continue Button */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border/50">
        <div className="container mx-auto px-6 py-4">
          <Button
            onClick={onContinue}
            disabled={!canContinue}
            className="btn-primary w-full max-w-lg mx-auto block disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {continueLabel}
          </Button>
        </div>
      </footer>
    </div>
  );
};
