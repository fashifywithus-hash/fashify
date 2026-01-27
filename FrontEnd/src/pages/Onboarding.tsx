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
  gender: string;
  weather: number;
  lifestyle: string;
  bodyType: string;
  height: number;
  skinTone: number;
  styles: string[];
  photo: File | null; // File object for upload
}

const TOTAL_STEPS = 9;

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: "",
    gender: "",
    weather: 50,
    lifestyle: "",
    bodyType: "",
    height: 170,
    skinTone: 50,
    styles: [],
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
        return data.gender !== "";
      case 3:
        return true; // Weather always has a value
      case 4:
        return data.lifestyle !== "";
      case 5:
        return data.bodyType !== "";
      case 6:
        return true; // Height always has a value
      case 7:
        return true; // Skin tone always has a value
      case 8:
        return data.styles.length > 0;
      case 9:
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
        gender: data.gender,
        weather_preference: data.weather,
        lifestyle: data.lifestyle,
        body_type: data.bodyType,
        height: data.height,
        skin_tone: data.skinTone,
        preferred_styles: data.styles,
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
        return <GenderStep value={data.gender} onChange={(v) => updateData("gender", v)} />;
      case 3:
        return <WeatherStep value={data.weather} onChange={(v) => updateData("weather", v)} />;
      case 4:
        return <LifestyleStep value={data.lifestyle} onChange={(v) => updateData("lifestyle", v)} />;
      case 5:
        return <BodyTypeStep value={data.bodyType} onChange={(v) => updateData("bodyType", v)} />;
      case 6:
        return <HeightStep value={data.height} onChange={(v) => updateData("height", v)} />;
      case 7:
        return <SkinToneStep value={data.skinTone} onChange={(v) => updateData("skinTone", v)} />;
      case 8:
        return <StyleStep value={data.styles} onChange={(v) => updateData("styles", v)} />;
      case 9:
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
              : "See Outfit Suggestions"
            : "Continue"
        }
      >
        {renderStep()}
      </OnboardingLayout>
    </AnimatePresence>
  );
};

export default Onboarding;
