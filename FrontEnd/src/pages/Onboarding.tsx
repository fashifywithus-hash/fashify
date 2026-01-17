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
import { useBackendAuth } from "@/hooks/useBackendAuth";
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/api";
import { logger } from "@/lib/logger";
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
  photo: File | null;
}

const TOTAL_STEPS = 9;

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { backendUserId, setBackendUserId } = useBackendAuth();
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

  const updateData = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    logger.onboarding(`Step ${currentStep}: Updated ${key}`, { 
      key, 
      value: key === 'photo' ? `[File: ${(value as File)?.name || 'null'}]` : value 
    });
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

  // Convert File to base64 string with compression
  const fileToBase64 = (file: File, maxSizeMB: number = 2): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Check file size first
      const fileSizeMB = file.size / (1024 * 1024);
      
      if (fileSizeMB > maxSizeMB) {
        // Compress image if too large
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Calculate new dimensions to keep under maxSizeMB
            const maxDimension = 1920; // Max width/height
            if (width > maxDimension || height > maxDimension) {
              const ratio = Math.min(maxDimension / width, maxDimension / height);
              width = width * ratio;
              height = height * ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }
                const reader2 = new FileReader();
                reader2.onload = () => resolve(reader2.result as string);
                reader2.onerror = (error) => reject(error);
                reader2.readAsDataURL(blob);
              },
              'image/jpeg',
              0.85 // Quality
            );
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target?.result as string;
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      } else {
        // File is small enough, use as-is
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      }
    });
  };

  const saveProfile = async () => {
    if (!user) {
      logger.error('Cannot save profile: user not authenticated', null, 'ONBOARDING');
      return;
    }

    logger.onboarding('Starting profile save', { 
      step: currentStep, 
      hasBackendUserId: !!backendUserId,
      userId: user.id 
    });
    setIsSaving(true);

    try {
      let userId = backendUserId;

      // If no backend user ID, create one using email
      if (!userId) {
        logger.onboarding('Creating backend user', { email: user.email });
        // Use the Supabase email for backend authentication
        const userEmail = user.email;
        if (!userEmail) {
          throw new Error('User email is required');
        }
        const tempPassword = 'temp123'; // In production, generate or use existing password
        
        const authResponse = await apiClient.signupOrLogin(userEmail, tempPassword);
        if (authResponse.success && authResponse.data) {
          userId = authResponse.data.id;
          setBackendUserId(userId);
          logger.onboarding('Backend user created', { userId, action: authResponse.data.action });
        } else {
          logger.error('Failed to create backend user', authResponse, 'ONBOARDING');
          throw new Error(authResponse.message || 'Failed to create backend user');
        }
      }

      // Convert photo to base64 if available
      let userPicBase64: string | undefined;
      if (data.photo) {
        logger.onboarding('Converting photo to base64', { 
          fileName: data.photo.name, 
          fileSize: `${(data.photo.size / 1024).toFixed(2)}KB`,
          fileType: data.photo.type 
        });
        const startTime = Date.now();
        userPicBase64 = await fileToBase64(data.photo);
        const conversionTime = Date.now() - startTime;
        logger.onboarding('Photo converted', { 
          base64Length: userPicBase64.length, 
          conversionTime: `${conversionTime}ms` 
        });
      } else {
        logger.onboarding('No photo provided, skipping photo upload');
      }

      // Map frontend data to backend format
      // Normalize gender: frontend uses lowercase IDs, backend expects capitalized
      const normalizeGender = (gender: string): 'Male' | 'Female' | 'Other' | undefined => {
        if (!gender) return undefined;
        const normalized = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
        if (normalized === 'Male' || normalized === 'Female' || normalized === 'Other') {
          return normalized;
        }
        return undefined;
      };

      const personalInfoData = {
        _id: userId,
        name: data.name,
        gender: normalizeGender(data.gender),
        bodyType: data.bodyType,
        height: `${data.height}cm`,
        goToStyle: data.styles.join(', '), // Convert styles array to comma-separated string
        userPic: userPicBase64,
      };

      logger.onboarding('Sending personal info to backend', {
        userId,
        hasPhoto: !!userPicBase64,
        photoSize: userPicBase64 ? `${(userPicBase64.length / 1024).toFixed(2)}KB` : 'N/A',
        dataFields: Object.keys(personalInfoData).filter(k => k !== 'userPic' && personalInfoData[k as keyof typeof personalInfoData]),
      });

      // Save to backend API
      const backendResponse = await apiClient.updatePersonalInfo(personalInfoData);

      if (!backendResponse.success) {
        logger.error('Backend API failed to save profile', backendResponse, 'ONBOARDING');
        throw new Error(backendResponse.message || 'Failed to save profile to backend');
      }

      logger.onboarding('Backend API success', {
        hasWardrobe: !!backendResponse.data,
        wardrobeItems: backendResponse.data?.wardrobe?.length || 0,
      });

      // Also save to Supabase for compatibility
      logger.onboarding('Saving to Supabase for compatibility');
      const { error: supabaseError } = await supabase.from("profiles").upsert({
        user_id: user.id,
        name: data.name,
        gender: data.gender,
        weather_preference: data.weather,
        lifestyle: data.lifestyle,
        body_type: data.bodyType,
        height: data.height,
        skin_tone: data.skinTone,
        preferred_styles: data.styles,
        photo_url: userPicBase64 || null,
      });

      if (supabaseError) {
        logger.warn("Supabase save warning", supabaseError, 'ONBOARDING');
        // Don't fail if Supabase save fails, backend is primary
      } else {
        logger.onboarding('Supabase save successful');
      }

      logger.onboarding('Profile save completed successfully', {
        hasWardrobeData: !!backendResponse.data,
      });

      toast({
        title: "Profile saved!",
        description: "Your preferences have been saved successfully.",
      });

      // Navigate to suggestions with wardrobe data if available
      if (backendResponse.data) {
        logger.onboarding('Navigating to suggestions with wardrobe data');
        navigate("/suggestions", { state: { wardrobe: backendResponse.data } });
      } else {
        logger.onboarding('Navigating to suggestions without wardrobe data');
        navigate("/suggestions");
      }
    } catch (error: any) {
      logger.error("Error saving profile", error, 'ONBOARDING');
      toast({
        title: "Error saving profile",
        description: error.message || "Please try again.",
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
