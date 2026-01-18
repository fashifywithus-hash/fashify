import { useState } from "react";
import { Upload, Check } from "lucide-react";

interface PhotoUploadStepProps {
  value: File | null;
  onChange: (value: File | null) => void;
}

export const PhotoUploadStep = ({ value, onChange }: PhotoUploadStepProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("📸 Photo selected:", {
        name: file.name,
        size: file.size,
        type: file.type,
        isFile: file instanceof File
      });
      onChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      console.log("⚠️ No file selected");
    }
  };

  return (
    <div className="text-center space-y-8">
      <div className="space-y-3">
        <h1 className="heading-section">Upload a front-facing photo</h1>
        <p className="text-body">This helps us personalize your outfit suggestions.</p>
      </div>
      
      <div className="pt-4">
        <label
          htmlFor="photo-upload"
          className={`block cursor-pointer ${preview ? "card-selectable-active" : "card-selectable"} aspect-[3/4] max-w-xs mx-auto flex flex-col items-center justify-center gap-4 overflow-hidden`}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium">Click to upload</div>
                <div className="text-sm text-muted-foreground">JPG or PNG</div>
              </div>
            </>
          )}
        </label>
        <input
          id="photo-upload"
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {value && (
        <div className="flex items-center justify-center gap-2 text-primary">
          <Check className="w-5 h-5" />
          <span className="font-medium">Photo uploaded</span>
        </div>
      )}

      <div className="space-y-2 text-sm text-muted-foreground bg-muted/50 rounded-xl p-4 max-w-xs mx-auto">
        <p>📸 Stand straight, face the camera</p>
        <p>🎯 Plain background works best</p>
        <p>🔒 Your photo stays private</p>
      </div>
    </div>
  );
};
