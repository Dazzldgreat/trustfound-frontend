import React from "react";

const ProgressBar = ({ step = 1, totalSteps = 3, label = "Item Details", nextStep = "Location & Time" }) => {
  const progressPercent = Math.round((step / totalSteps) * 100);

  return (
    <div className="mb-12 bg-white dark:bg-gray-800 p-6 rounded-xl custom-shadow border border-gray-50 dark:border-gray-700">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
            STEP {step} OF {totalSteps}
          </span>
          <p className="font-bold text-sm">{label}</p>
        </div>
        <p className="text-sm font-medium text-primary">{progressPercent}% Complete</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Next Step Info */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
        <span>Next: {nextStep}</span>
      </div>
    </div>
  );
};

export default ProgressBar;
