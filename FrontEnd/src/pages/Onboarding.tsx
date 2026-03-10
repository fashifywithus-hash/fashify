import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { NameStep } from "@/components/onboarding/steps/NameStep";
import { GenderStep } from "@/components/onboarding/steps/GenderStep";
import { WeatherStep } from "@/components/onboarding/steps/WeatherStep";
import { LifestyleStep } from "@/components/onboarding/steps/LifestyleStep";
import { BodyTypeStep } from "@/components/onboarding/steps/BodyTypeStep";
import { HeightStep } from "@/components/onboarding/steps/HeightStep";
import { SkinToneStep } from "@/components/onboarding/steps/SkinToneStep";
import { StyleStep } from "@/components/onboarding/steps/StyleStep";
import { PhotoUploadStep } from "@/components/onboarding/steps/PhotoUploadStep";
import { useAuth } from "@/hooks/useAuth";
import { profileService } from "@/services/profileService";
import { uploadService } from "@/services/uploadService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface OnboardingData {
  name: string;
  photo: File | null; // File object for upload
}

const TOTAL_STEPS = 2;

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: "",
    photo: null,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Note: We no longer auto-convert photos to base64
  // Photos will be uploaded separately via the upload endpoint

  const updateData = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const canContinue = (): boolean => {
    switch (currentStep) {
      case 1:
        return data.name.trim().length > 0;
      case 2:
        return data.photo !== null;
      default:
        return false;
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      let photoUrl: string | null = null;

      // Upload photo separately if it exists
      if (data.photo && data.photo instanceof File) {
        try {
          console.log("📤 Uploading photo...", {
            name: data.photo.name,
            size: data.photo.size,
            type: data.photo.type
          });
          
          photoUrl = await uploadService.uploadPhoto(data.photo);
          console.log("✅ Photo uploaded successfully");
        } catch (error: any) {
          console.error("❌ Error uploading photo:", error);
          toast({
            title: "Photo upload error",
            description: error.message || "Could not upload the photo. Saving profile without photo.",
            variant: "destructive",
          });
          // Continue without photo - don't block profile creation
        }
      }

      // Prepare profile data (without large base64 strings)
      const profileData: any = {
        name: data.name,
        photo_url: photoUrl, // Use uploaded photo URL (can be null)
      };

      console.log("📤 Sending profile data to backend:", {
        ...profileData,
        photo_url: photoUrl ? "[uploaded]" : null
      });
      
      await profileService.saveProfile(profileData);

      toast({
        title: "Profile saved!",
        description: "Your preferences have been saved successfully.",
      });

      navigate("/selection");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error saving profile",
        description: error.error || error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - save profile and go to suggestions
      saveProfile();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <NameStep value={data.name} onChange={(v) => updateData("name", v)} />;
      case 2:
        return <PhotoUploadStep value={data.photo} onChange={(v) => updateData("photo", v)} />;
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <OnboardingLayout
        key={currentStep}
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        canContinue={canContinue() && !isSaving}
        onContinue={handleContinue}
        onBack={currentStep > 1 ? handleBack : undefined}
        continueLabel={
          currentStep === TOTAL_STEPS
            ? isSaving
              ? "Saving..."
              : "Go to selection"
            : "Continue"
        }
      >
        {renderStep()}
      </OnboardingLayout>
    </AnimatePresence>
  );
};

export default Onboarding;
