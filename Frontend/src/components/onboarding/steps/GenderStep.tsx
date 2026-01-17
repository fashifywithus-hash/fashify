interface GenderStepProps {
  value: string;
  onChange: (value: string) => void;
}

const genderOptions = [
  { id: "male", label: "Male", icon: "👔" },
  { id: "female", label: "Female", icon: "👗" },
  { id: "other", label: "Rather not say", icon: "✨" },
];

export const GenderStep = ({ value, onChange }: GenderStepProps) => {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-3">
        <h1 className="heading-section">How do you identify?</h1>
        <p className="text-body">This helps us tailor outfit suggestions for you.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 pt-4">
        {genderOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={value === option.id ? "card-selectable-active" : "card-selectable"}
          >
            <div className="flex items-center justify-center gap-4">
              <span className="text-2xl">{option.icon}</span>
              <span className="font-medium text-lg">{option.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
