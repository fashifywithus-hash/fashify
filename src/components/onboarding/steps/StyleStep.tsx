interface StyleStepProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const styleOptions = [
  { id: "streetwear", label: "Streetwear", emoji: "🛹" },
  { id: "minimal", label: "Minimal", emoji: "⬜" },
  { id: "classic", label: "Classic", emoji: "👔" },
  { id: "trendy", label: "Trendy", emoji: "✨" },
  { id: "smart-casual", label: "Smart Casual", emoji: "🎩" },
  { id: "party", label: "Party", emoji: "🎉" },
];

export const StyleStep = ({ value, onChange }: StyleStepProps) => {
  const toggleStyle = (styleId: string) => {
    if (value.includes(styleId)) {
      onChange(value.filter((id) => id !== styleId));
    } else {
      onChange([...value, styleId]);
    }
  };

  return (
    <div className="text-center space-y-8">
      <div className="space-y-3">
        <h1 className="heading-section">What are your go-to styles?</h1>
        <p className="text-body">Select all that resonate with you.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-4">
        {styleOptions.map((style) => (
          <button
            key={style.id}
            onClick={() => toggleStyle(style.id)}
            className={`${value.includes(style.id) ? "card-selectable-active" : "card-selectable"} py-6`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">{style.emoji}</span>
              <span className="font-medium">{style.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
