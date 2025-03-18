import { CheckIcon } from "lucide-react";

interface BookingStepsProps {
  currentStep: number;
  steps: { title: string }[];
}

export default function BookingSteps({ currentStep, steps }: BookingStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-neutral-200 -translate-y-1/2 z-0"></div>
        
        {steps.map((step, index) => {
          const isCompleted = currentStep > index + 1;
          const isActive = currentStep === index + 1;
          
          return (
            <div
              key={index}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium relative z-10 
                ${isCompleted ? 'bg-green-500 text-white' : 
                  isActive ? 'bg-primary text-white' : 
                  'bg-neutral-200 text-neutral-600'}`}
            >
              {isCompleted ? (
                <CheckIcon className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between mt-2">
        {steps.map((step, index) => {
          const isCompleted = currentStep > index + 1;
          const isActive = currentStep === index + 1;
          
          return (
            <span
              key={index}
              className={`text-sm font-medium
                ${isCompleted ? 'text-green-500' : 
                  isActive ? 'text-primary' : 
                  'text-neutral-500'}`}
            >
              {step.title}
            </span>
          );
        })}
      </div>
    </div>
  );
}
