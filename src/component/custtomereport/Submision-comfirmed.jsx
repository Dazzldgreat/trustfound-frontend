import React from "react";
import { Link } from "react-router-dom";
import ProgressBarTwo from "./ProgressBarSectiontwo";

// Main Component
function SubmissionPage({ reportData }) {

  // Back Button Logic
  const handleBack = () => {
    window.history.back();
  };

  // Default Data
  const data = reportData || {
    userName: "Alex",
    hotelName: "The Grand Hotel",
    reportId: "LF-99283",
    item: "iPhone 15 Pro (Blue)",
    location: "Room 402, Executive Floor",
    date: "Oct 24, 2023 • 2:45 PM",
    email: "alex.w@example.com",
  };

  // Print Function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">

      {/* Font Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body {
              font-family: 'Manrope', sans-serif;
            }

            .material-symbols-outlined {
              font-variation-settings:
                'FILL' 0,
                'wght' 300,
                'GRAD' 0,
                'opsz' 24;
            }
          `,
        }}
      />

      {/* Progress Bar */}
      <ProgressBarTwo />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#f1f3f3] dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">

          {/* Left Side */}
          <div className="flex items-center gap-4">

            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-all"
            >
              <span className="material-symbols-outlined">
                arrow_back
              </span>

              <span className="font-semibold">
                <a href="/customer-report">Back</a>
              </span>
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3 ml-4">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <span className="material-symbols-outlined !text-[20px]">
                  search
                </span>
              </div>

              <h2 className="text-lg font-bold tracking-tight">
                LostFound
              </h2>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex gap-2">

            {/* Print */}
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <span className="material-symbols-outlined !text-[20px]">
                print
              </span>
            </button>

            {/* Home */}
            <Link
              to="/"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <span className="material-symbols-outlined !text-[20px]">
                home
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Side */}
          <div className="lg:col-span-7 flex flex-col gap-8">

            {/* Hero Section */}
            <section className="space-y-4">

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase">
                <span className="material-symbols-outlined !text-[14px]">
                  check_circle
                </span>

                Successfully Lodged
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold text-[#292524] dark:text-white">
                Submission Confirmed
              </h1>

              <p className="text-lg text-gray-500 dark:text-gray-400">
                We&apos;ve received your report,{" "}
                <span className="font-bold text-black dark:text-white">
                  {data.userName}
                </span>.
                Our team at{" "}
                <span className="font-semibold text-blue-600">
                  {data.hotelName}
                </span>{" "}
                is on it.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4">

                <Link
                  to="/track-page"
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all"
                >
                  Track Status
                </Link>

                <Link
                  to="/customer-report"
                  className="border border-gray-200 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all dark:hover:bg-gray-800"
                >
                  Edit Report
                </Link>
              </div>
            </section>

            {/* Report Summary */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 shadow-sm">

              <div className="flex justify-between mb-6">
                <h3 className="font-bold text-lg">
                  Report Summary
                </h3>

                <span className="text-sm text-gray-400 font-mono">
                  #{data.reportId}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {[
                  {
                    icon: "smartphone",
                    label: "Item",
                    val: data.item,
                  },
                  {
                    icon: "location_on",
                    label: "Last Seen",
                    val: data.location,
                  },
                  {
                    icon: "calendar_today",
                    label: "Date",
                    val: data.date,
                  },
                  {
                    icon: "mail",
                    label: "Notifications",
                    val: data.email,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4"
                  >
                    <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <span className="material-symbols-outlined">
                        {item.icon}
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">
                        {item.label}
                      </p>

                      <p className="font-bold text-sm">
                        {item.val}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side Timeline */}
          <div className="lg:col-span-5">

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">

              <h3 className="font-bold text-lg mb-8">
                Next Steps
              </h3>

              <div className="space-y-10">

                <TimelineStep
                  title="Report Submitted"
                  desc="Successfully received"
                  active={false}
                  completed={true}
                  icon="check"
                />

                <TimelineStep
                  title="Searching Premises"
                  desc="Security is checking the area"
                  active={true}
                  completed={false}
                  icon="search"
                />

                <TimelineStep
                  title="Verification Match"
                  desc="Comparing found items"
                  active={false}
                  completed={false}
                  icon="fact_check"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Timeline Component
function TimelineStep({
  title,
  desc,
  active,
  completed,
  icon,
}) {
  return (
    <div className="flex gap-4">

      <div
        className={`z-10 size-10 rounded-full flex items-center justify-center ring-4 ${
          completed
            ? "bg-emerald-500 ring-emerald-50"
            : active
            ? "bg-blue-600 ring-blue-100 animate-pulse"
            : "bg-gray-200 ring-transparent"
        } text-white`}
      >
        <span className="material-symbols-outlined !text-[20px]">
          {icon}
        </span>
      </div>

      <div>
        <p
          className={`font-bold ${
            completed
              ? "text-emerald-600"
              : active
              ? "text-blue-600"
              : "text-gray-400"
          }`}
        >
          {title}
        </p>

        <p className="text-sm text-gray-500">
          {desc}
        </p>
      </div>
    </div>
  );
}

export default SubmissionPage;
export { ProgressBarTwo };