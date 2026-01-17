interface BodyTypeStepProps {
  value: string;
  onChange: (value: string) => void;
}

const bodyTypes = [
  { id: "slim", label: "Slim", silhouette: "│" },
  { id: "athletic", label: "Athletic", silhouette: "◇" },
  { id: "average", label: "Average", silhouette: "○" },
  { id: "muscular", label: "Muscular", silhouette: "▽" },
  { id: "curvy", label: "Curvy", silhouette: "◎" },
  { id: "plus", label: "Plus Size", silhouette: "◉" },
];

export const BodyTypeStep = ({ value, onChange }: BodyTypeStepProps) => {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-3">
        <h1 className="heading-section">What's your body type?</h1>
        <p className="text-body">This helps us find the most flattering fits.</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
        {bodyTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onChange(type.id)}
            className={`${value === type.id ? "card-selectable-active" : "card-selectable"} aspect-square flex flex-col items-center justify-center gap-3`}
          >
            <div className="text-4xl opacity-60">{type.silhouette}</div>
            <span className="font-medium">{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
