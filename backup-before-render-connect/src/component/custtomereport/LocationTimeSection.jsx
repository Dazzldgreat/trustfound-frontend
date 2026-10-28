import React, { useState } from "react";

const locations = [
  "Guest Room",
  "Lobby / Reception",
  "Restaurant / Bar",
  "Pool Area",
  "Gym / Spa",
  "Parking Lot",
  "Other",
];

const LocationTimeSection = () => {
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl custom-shadow border border-gray-50 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">
          location_on
        </span>
        <h3 className="text-xl font-bold">3. Where &amp; When</h3>
      </div>

      {/* Body */}
      <div className="p-8 grid md:grid-cols-2 gap-6">
        {/* Date */}
        <div>
          <label className="block text-sm font-bold mb-2">
            Last Seen Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-bold mb-2">
            Last Known Location
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-primary focus:border-primary"
          >
            <option value="">Select location</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Details */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold mb-2">
            Specific Details (Optional)
          </label>
          <input
            type="text"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="e.g. Room 402, near the left window"
            className="w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
    </section>
  );
};

export default LocationTimeSection;
