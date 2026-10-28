import React from "react";

function SearchBar({
    search,
    setSearch,
    placeholder = "Search reports...",
}) {

    return (

        <div className="relative w-full">

            <input
                type="text"
                value={search}
                onChange={(e) =>
                    setSearch(e.target.value)
                }
                placeholder={placeholder}
                className="w-full border rounded-2xl px-5 py-4 pl-12 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 absolute left-4 top-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
                />
            </svg>

        </div>

    );

}

export default SearchBar;