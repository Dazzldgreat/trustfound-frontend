import React from "react";

function ReportFilters({
    filter,
    setFilter,
}) {

    const filters = [
        {
            label: "All",
            value: "all",
        },
        {
            label: "Lost",
            value: "lost",
        },
        {
            label: "Found",
            value: "found",
        },
        {
            label: "Pending",
            value: "Pending",
        },
        {
            label: "Matched",
            value: "Matched",
        },
        {
            label: "Approved",
            value: "Approved",
        },
        {
            label: "Recovered",
            value: "Recovered",
        },
    ];

    return (

        <div className="flex flex-wrap gap-3">

            {filters.map((item) => (

                <button
                    key={item.value}
                    onClick={() =>
                        setFilter(item.value)
                    }
                    className={`px-5 py-2 rounded-full font-semibold transition-all ${
                        filter === item.value
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                >
                    {item.label}
                </button>

            ))}

        </div>

    );

}

export default ReportFilters;