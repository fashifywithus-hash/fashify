interface SkinToneStepProps {
  value: number;
  onChange: (value: number) => void;
}

export const SkinToneStep = ({ value, onChange }: SkinToneStepProps) => {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-3">
        <h1 className="heading-section">What's your skin tone?</h1>
        <p className="text-body">We'll suggest colors that complement you.</p>
      </div>
      
      <div className="pt-8 space-y-6">
        <div 
          className="w-20 h-20 rounded-full mx-auto shadow-lg"
          style={{
            background: `hsl(${25 + value * 0.15}, ${40 - value * 0.1}%, ${25 + value * 0.65}%)`
          }}
        />
        
        <div className="relative pt-4">
          <div 
            className="w-full h-4 rounded-full"
            style={{
              background: "linear-gradient(90deg, hsl(25, 40%, 25%) 0%, hsl(30, 50%, 45%) 25%, hsl(35, 55%, 60%) 50%, hsl(35, 45%, 75%) 75%, hsl(40, 40%, 90%) 100%)"
            }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-4 rounded-full appearance-none cursor-pointer absolute top-4 left-0 opacity-0"
          />
          <div 
            className="absolute top-4 w-6 h-6 bg-background border-4 border-foreground rounded-full -translate-y-1 pointer-events-none shadow-md"
            style={{ left: `calc(${value}% - 12px)` }}
          />
          <div className="flex justify-between mt-6 text-sm text-muted-foreground">
            <span>Dark</span>
            <span>Fair</span>
          </div>
        </div>
      </div>
    </div>
  );
};
