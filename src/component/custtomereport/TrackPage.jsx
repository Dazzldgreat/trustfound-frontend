import React, { useState } from "react";

const TrackStatusPage = ({ reportId = "LF-99283" }) => {
  // 1. STATE INITIALIZATION (Ensure 'useState' is imported at top)
  const [currentStatus, setCurrentStatus] = useState(2);

  // Simple function to handle going back if you aren't using a Router yet
  const handleBack = (e) => {
    e.preventDefault();
    window.history.back(); 
  };

  const steps = [
    { id: 1, label: "Report Received", icon: "assignment_turned_in", time: "2:45 PM" },
    { id: 2, label: "Searching Premises", icon: "search", time: "Running..." },
    { id: 3, label: "Verification", icon: "fact_check", time: "Pending" },
    { id: 4, label: "Item Ready", icon: "inventory_2", time: "Pending" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-[#131616] dark:text-white font-['Manrope']">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Functional Back Button */}
            <button onClick={handleBack} className="material-symbols-outlined text-gray-400 hover:text-primary border-none bg-transparent cursor-pointer">
              arrow_back
            </button>
            <span className="font-bold tracking-tight"><a href="/submission-page">Back</a></span>
          </div>
          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-gray-500">
            ID: {reportId}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Status Hero Card - Changes based on state */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 mb-8 text-center">
          <div className="inline-flex items-center justify-center size-20 rounded-full bg-primary/10 text-primary mb-6 animate-pulse">
            <span className="material-symbols-outlined !text-4xl">
              {currentStatus >= 3 ? "verified" : "travel_explore"}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold mb-2">
            {currentStatus === 2 ? "Search in Progress" : currentStatus === 3 ? "Item Verified" : "Item Found!"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {currentStatus <= 2 
              ? "Our security team is currently scanning the Executive Floor." 
              : "We have located an item matching your description!"}
          </p>
        </div>

        {/* Live Timeline */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
          <h3 className="font-bold text-lg mb-8">Live Updates</h3>
          
          <div className="relative space-y-8">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-800" />

            {steps.map((step) => {
              const isCompleted = step.id < currentStatus;
              const isActive = step.id === currentStatus;

              return (
                <div key={step.id} className="flex gap-6 relative z-10">
                  <div className={`size-10 rounded-full flex items-center justify-center ring-4 transition-all ${
                    isCompleted ? "bg-emerald-500 ring-emerald-50 dark:ring-emerald-900/20 text-white" :
                    isActive ? "bg-primary ring-primary/20 text-white" :
                    "bg-gray-100 dark:bg-gray-800 text-gray-400 ring-transparent"
                  }`}>
                    <span className="material-symbols-outlined !text-xl">
                      {isCompleted ? "check" : step.icon}
                    </span>
                  </div>
                  
                  <div className="flex-1 border-b border-gray-50 dark:border-gray-800 pb-6 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-bold ${isActive ? "text-primary" : isCompleted ? "text-emerald-600" : "text-gray-400"}`}>
                          {step.label}
                        </p>
                        <p className="text-sm text-gray-500">
                          {isCompleted ? "Verified & Logged" : isActive ? "Currently checking CCTV and Physical areas..." : "Waiting for previous step"}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{step.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all">
            <span className="material-symbols-outlined text-lg">call</span>
            Call Concierge
          </button>
          <button className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all">
            <span className="material-symbols-outlined text-lg">chat</span>
            Live Chat
          </button>
        </div>

        {/* 2. TEST CONTROLS (Delete this section later) */}
        <div className="mt-12 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
          <p className="text-xs font-bold text-blue-600 mb-2 uppercase">Developer Tools: Test Progress</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentStatus(2)} className="text-[10px] bg-white border px-2 py-1 rounded">Set to Step 2</button>
            <button onClick={() => setCurrentStatus(3)} className="text-[10px] bg-white border px-2 py-1 rounded">Set to Step 3</button>
            <button onClick={() => setCurrentStatus(4)} className="text-[10px] bg-white border px-2 py-1 rounded">Set to Step 4</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrackStatusPage;