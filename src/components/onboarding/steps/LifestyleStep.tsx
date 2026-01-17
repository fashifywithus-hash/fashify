import { Briefcase, Coffee, Dumbbell } from "lucide-react";

interface LifestyleStepProps {
  value: string;
  onChange: (value: string) => void;
}

const lifestyleOptions = [
  { id: "formal", label: "Formal", description: "Office & business", icon: Briefcase },
  { id: "casual", label: "Casual", description: "Everyday comfort", icon: Coffee },
  { id: "athletic", label: "Athletic", description: "Active lifestyle", icon: Dumbbell },
];

export const LifestyleStep = ({ value, onChange }: LifestyleStepProps) => {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-3">
        <h1 className="heading-section">What's your lifestyle?</h1>
        <p className="text-body">Tell us about your typical day.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 pt-4">
        {lifestyleOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={value === option.id ? "card-selectable-active" : "card-selectable"}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-lg">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
