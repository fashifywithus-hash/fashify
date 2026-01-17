interface WeatherStepProps {
  value: number;
  onChange: (value: number) => void;
}

export const WeatherStep = ({ value, onChange }: WeatherStepProps) => {
  const getWeatherLabel = (val: number) => {
    if (val < 20) return "Extremely Cold ❄️";
    if (val < 40) return "Cold 🧥";
    if (val < 60) return "Mild 🌤️";
    if (val < 80) return "Warm ☀️";
    return "Very Hot 🔥";
  };

  return (
    <div className="text-center space-y-8">
      <div className="space-y-3">
        <h1 className="heading-section">What's the weather like?</h1>
        <p className="text-body">We'll suggest outfits perfect for your climate.</p>
      </div>
      
      <div className="pt-8 space-y-6">
        <div className="text-xl font-medium">{getWeatherLabel(value)}</div>
        
        <div className="relative pt-4">
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="slider-fashion"
          />
          <div className="flex justify-between mt-3 text-sm text-muted-foreground">
            <span>Extremely Cold</span>
            <span>Very Hot</span>
          </div>
        </div>
      </div>
    </div>
  );
};
