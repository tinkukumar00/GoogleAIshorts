import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface AiAnalysisStatusProps {
  videoTitle?: string;
}

export const AiAnalysisStatus: React.FC<AiAnalysisStatusProps> = ({ videoTitle }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(20);

  const steps = [
    'Fetching video stream and transcribing speech',
    'Detecting high-retention hooks and emotional peaks with Gemini AI',
    'Reframing speaker to vertical 9:16',
    'Generating animated captions and viral titles',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p < 45) {
          setCurrentStep(1);
          return p + 6;
        }
        if (p < 75) {
          setCurrentStep(2);
          return p + 4;
        }
        if (p < 95) {
          setCurrentStep(3);
          return p + 2;
        }
        return 96;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">AI Analyzing Video & Creating Shorts</h2>
          {videoTitle && <p className="text-xs text-zinc-400 truncate max-w-md mt-0.5">{videoTitle}</p>}
        </div>
        <span className="text-xs font-mono font-medium text-zinc-400">{progress}%</span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-white transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2 pt-1">
        {steps.map((label, idx) => {
          const isDone = currentStep > idx;
          const isActive = currentStep === idx;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2.5 text-xs ${
                isActive ? 'text-white font-medium' : isDone ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isActive
                    ? 'border-2 border-white border-t-transparent animate-spin'
                    : 'border border-zinc-700'
                }`}
              >
                {isDone && <Check className="h-2.5 w-2.5" />}
              </div>
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
