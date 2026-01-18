interface HeightStepProps {
  value: number;
  onChange: (value: number) => void;
}

export const HeightStep = ({ value, onChange }: HeightStepProps) => {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-3">
        <h1 className="heading-section">How tall are you?</h1>
        <p className="text-body">Perfect proportions for your frame.</p>
      </div>
      
      <div className="pt-8 space-y-6">
        <div className="text-5xl font-display font-semibold">{value} <span className="text-2xl text-muted-foreground">cm</span></div>
        
        <div className="relative pt-4">
          <input
            type="range"
            min="140"
            max="200"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
          />
          <div className="flex justify-between mt-3 text-sm text-muted-foreground">
            <span>140 cm</span>
            <span>200 cm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
