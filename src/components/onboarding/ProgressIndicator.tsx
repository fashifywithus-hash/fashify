interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isComplete = stepNumber < currentStep;

        return (
          <div
            key={index}
            className={`transition-all duration-300 rounded-full ${
              isActive
                ? "progress-dot-active"
                : isComplete
                ? "progress-dot-complete"
                : "progress-dot"
            }`}
          />
        );
      })}
    </div>
  );
};
