interface NameStepProps {
  value: string;
  onChange: (value: string) => void;
}

export const NameStep = ({ value, onChange }: NameStepProps) => {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-3">
        <h1 className="heading-section">What should we call you?</h1>
        <p className="text-body">Let's make this personal.</p>
      </div>
      
      <div className="pt-4">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your name"
          className="input-fashion text-center"
          autoFocus
        />
      </div>
    </div>
  );
};
