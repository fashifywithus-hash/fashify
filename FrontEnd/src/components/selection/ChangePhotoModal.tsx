import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { uploadService } from "@/services/uploadService";
import { profileService } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";

interface ChangePhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ChangePhotoModal({ open, onOpenChange, onSuccess }: ChangePhotoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({ title: "Select a photo", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const photoUrl = await uploadService.uploadPhoto(file);
      await profileService.updatePhoto(photoUrl);
      toast({ title: "Photo updated", description: "Your photo has been updated." });
      setFile(null);
      setPreview(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err?.message || "Could not update photo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      setPreview(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change my photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Upload a new front-facing photo. It will be used for try-on results.
          </p>
          <label className="block cursor-pointer border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-48 mx-auto object-contain rounded" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="w-10 h-10" />
                <span className="text-sm font-medium">Click to select photo</span>
                <span className="text-xs">JPG or PNG</span>
              </div>
            )}
          </label>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => handleClose()} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!file || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update photo"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
